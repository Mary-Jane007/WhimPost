import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import { mapUser } from "@/lib/auth";
import { areFriends, listFriends } from "@/lib/letters";
import type { UserPublic } from "@/lib/types";
import type { VillageId } from "@/lib/villages";
import { getVillage } from "@/lib/villages";
import {
  addVideoToChannelSchedule,
  ensureChannelSchedule,
  probeAndStoreDuration,
  removeVideoFromChannelSchedule,
  resolveChannelBroadcast,
  setVideoDurationMs,
  type TvScheduleSlot,
} from "@/lib/tvSchedule";
import {
  DEFAULT_LINK_DURATION_MS,
  parseTvLink,
  type TvSourceKind,
} from "@/lib/tvLinks";
import { probeRemoteDurationMs } from "@/lib/tvDuration";
import { persistTvCatalogs } from "@/lib/tvPersist";

export type TvRoomScope = "village" | "friends";
export type { TvScheduleSlot };
export type { TvSourceKind };

export type TvVideo = {
  id: string;
  title: string;
  url: string;
  /** Internal disk key, or `link-{uuid}` for URL clips. */
  filename: string;
  sourceUrl: string | null;
  sourceKind: TvSourceKind;
  youtubeId: string | null;
  mime: string;
  sizeBytes: number;
  durationMs: number;
  uploaderId: string;
  uploaderName: string;
  villageId: string | null;
  channelId: string | null;
  createdAt: string;
};

export type TvChannel = {
  id: string;
  title: string;
  villageId: string;
  createdBy: string;
  createdAt: string;
  isGlobal: boolean;
  videos: TvVideo[];
};

export type TvWatcher = {
  user: UserPublic;
  lastSeenAt: string;
};

export type TvChatMessage = {
  id: string;
  roomId: string;
  body: string;
  createdAt: string;
  author: UserPublic;
};

export type TvRoomState = {
  id: string;
  scope: TvRoomScope;
  villageId: string | null;
  hostId: string;
  title: string;
  currentChannelId: string | null;
  currentVideoId: string | null;
  currentVideo: TvVideo | null;
  isPlaying: boolean;
  positionMs: number;
  positionUpdatedAt: string;
  updatedAt: string;
  createdAt: string;
  watchers: TvWatcher[];
  messages: TvChatMessage[];
  /** Village lounge only — wall-clock channel guide. */
  schedule: TvScheduleSlot[];
  /** Village lounge only — stable start of the clip currently on air. */
  airStartsAt: string | null;
  broadcastMode: "schedule" | "interactive";
};

type VideoRow = {
  id: string;
  title: string;
  filename: string;
  mime: string;
  size_bytes: number;
  duration_ms?: number | null;
  source_url?: string | null;
  uploader_id: string;
  village_id: string | null;
  channel_id: string | null;
  created_at: string;
  uploader_name?: string;
};

function classifyStoredVideo(row: VideoRow): {
  sourceKind: TvSourceKind;
  youtubeId: string | null;
  url: string;
  sourceUrl: string | null;
} {
  const sourceUrl = row.source_url?.trim() || null;
  if (!sourceUrl) {
    return {
      sourceKind: "file",
      youtubeId: null,
      url: videoUrl(row.filename),
      sourceUrl: null,
    };
  }
  const parsed = parseTvLink(sourceUrl);
  if (parsed.ok && parsed.kind === "youtube") {
    return {
      sourceKind: "youtube",
      youtubeId: parsed.youtubeId,
      url: sourceUrl,
      sourceUrl,
    };
  }
  return {
    sourceKind: "direct",
    youtubeId: null,
    url: sourceUrl,
    sourceUrl,
  };
}

type ChannelRow = {
  id: string;
  title: string;
  village_id: string;
  created_by: string;
  created_at: string;
  is_global?: number | null;
};

type RoomRow = {
  id: string;
  scope: TvRoomScope;
  village_id: string | null;
  host_id: string;
  title: string;
  current_channel_id: string | null;
  current_video_id: string | null;
  is_playing: number;
  position_ms: number;
  position_updated_at: string;
  created_at: string;
  updated_at: string;
};

const PRESENCE_TTL_SEC = 45;

export function videoUrl(filename: string) {
  return `/api/uploads/${filename}`;
}

function mapVideo(row: VideoRow): TvVideo {
  const classified = classifyStoredVideo(row);
  return {
    id: row.id,
    title: row.title,
    url: classified.url,
    filename: row.filename,
    sourceUrl: classified.sourceUrl,
    sourceKind: classified.sourceKind,
    youtubeId: classified.youtubeId,
    mime: row.mime,
    sizeBytes: Number(row.size_bytes) || 0,
    durationMs: Number(row.duration_ms) || 0,
    uploaderId: row.uploader_id,
    uploaderName: row.uploader_name || "Villager",
    villageId: row.village_id,
    channelId: row.channel_id,
    createdAt: row.created_at,
  };
}

export function getVideoById(id: string): TvVideo | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT v.*, u.display_name as uploader_name
       FROM tv_videos v
       JOIN users u ON u.id = v.uploader_id
       WHERE v.id = ?`
    )
    .get(id) as VideoRow | undefined;
  return row ? mapVideo(row) : null;
}

export function getVideoByFilename(filename: string): TvVideo | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT v.*, u.display_name as uploader_name
       FROM tv_videos v
       JOIN users u ON u.id = v.uploader_id
       WHERE v.filename = ?`
    )
    .get(filename) as VideoRow | undefined;
  return row ? mapVideo(row) : null;
}

export function canAccessVideo(user: UserPublic, video: TvVideo) {
  if (user.isOwner) return true;
  if (video.channelId) {
    const channel = getChannelById(video.channelId);
    if (channel?.isGlobal && user.villageId) return true;
  }
  if (video.villageId && user.villageId === video.villageId) return true;
  if (areFriends(user.id, video.uploaderId)) return true;
  const friends = listFriends(user.id);
  if (friends.some((f) => f.villageId && f.villageId === video.villageId)) {
    return true;
  }
  return false;
}

export function listVideosForChannel(channelId: string): TvVideo[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT v.*, u.display_name as uploader_name
       FROM tv_videos v
       JOIN users u ON u.id = v.uploader_id
       WHERE v.channel_id = ?
       ORDER BY v.created_at ASC
       LIMIT 200`
    )
    .all(channelId) as VideoRow[];
  return rows.map(mapVideo);
}

function mapChannel(row: ChannelRow): TvChannel {
  return {
    id: row.id,
    title: row.title,
    villageId: row.village_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    isGlobal: Boolean(row.is_global),
    videos: listVideosForChannel(row.id),
  };
}

export const SHARED_CHANNEL_TITLE = "Cottage Cartoons";

export function getChannelById(id: string): TvChannel | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM tv_channels WHERE id = ?`)
    .get(id) as ChannelRow | undefined;
  return row ? mapChannel(row) : null;
}

function channelUsableInVillage(
  channel: TvChannel,
  villageId: string | null | undefined
) {
  if (channel.isGlobal) return true;
  return Boolean(villageId && channel.villageId === villageId);
}

function videoUsableInVillage(
  video: TvVideo,
  villageId: string | null | undefined
) {
  if (video.channelId) {
    const channel = getChannelById(video.channelId);
    if (channel?.isGlobal) return true;
  }
  return Boolean(villageId && video.villageId === villageId);
}

/** Merge duplicate Cottage Cartoons rows and ensure one shared channel exists. */
export function ensureSharedCottageCartoons() {
  const db = getDb();
  db.prepare(
    `UPDATE tv_channels
     SET is_global = 1
     WHERE lower(trim(title)) = lower(?)`
  ).run(SHARED_CHANNEL_TITLE);

  const matches = db
    .prepare(
      `SELECT id, created_at FROM tv_channels
       WHERE lower(trim(title)) = lower(?)
       ORDER BY created_at ASC`
    )
    .all(SHARED_CHANNEL_TITLE) as Array<{ id: string; created_at: string }>;

  if (matches.length > 1) {
    const keeper = matches[0].id;
    for (const extra of matches.slice(1)) {
      db.prepare(`UPDATE tv_videos SET channel_id = ? WHERE channel_id = ?`).run(
        keeper,
        extra.id
      );
      db.prepare(
        `UPDATE tv_rooms SET current_channel_id = ? WHERE current_channel_id = ?`
      ).run(keeper, extra.id);
      db.prepare(`DELETE FROM tv_channels WHERE id = ?`).run(extra.id);
    }
    db.prepare(`UPDATE tv_channels SET is_global = 1 WHERE id = ?`).run(keeper);
  }

  if (matches.length === 0) {
    const owner = db
      .prepare(`SELECT id FROM users WHERE is_owner = 1 LIMIT 1`)
      .get() as { id: string } | undefined;
    if (owner) {
      createChannel({
        title: SHARED_CHANNEL_TITLE,
        villageId: "mosshollow",
        createdBy: owner.id,
        isGlobal: true,
      });
    }
  } else {
    db.prepare(`UPDATE tv_channels SET is_global = 1 WHERE id = ?`).run(
      matches[0].id
    );
  }
}

/** Owner-curated channels for one village, plus shared all-village channels. */
export function listChannelsForVillage(
  villageId: string | null | undefined
): TvChannel[] {
  if (!villageId) return [];
  ensureSharedCottageCartoons();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM tv_channels
       WHERE is_global = 1 OR village_id = ?
       ORDER BY is_global DESC, created_at ASC
       LIMIT 40`
    )
    .all(villageId) as ChannelRow[];
  return rows.map(mapChannel);
}

export function channelLibraryVillageId(
  user: UserPublic,
  room?: Pick<TvRoomState, "villageId" | "scope"> | null
) {
  if (room?.villageId) return room.villageId;
  return user.villageId;
}

export function listChannelsForUser(
  user: UserPublic,
  room?: Pick<TvRoomState, "villageId" | "scope"> | null
): TvChannel[] {
  return listChannelsForVillage(channelLibraryVillageId(user, room));
}

/** @deprecated Prefer listChannelsForUser — flat video list for legacy callers. */
export function listVideosForUser(
  user: UserPublic,
  room?: Pick<TvRoomState, "villageId" | "scope"> | null
): TvVideo[] {
  return listChannelsForUser(user, room).flatMap((channel) => channel.videos);
}

export function createChannel(input: {
  title: string;
  villageId: string;
  createdBy: string;
  isGlobal?: boolean;
}): TvChannel {
  const db = getDb();
  const id = randomUUID();
  const title = input.title.trim().slice(0, 80) || "Untitled channel";
  const isGlobal =
    Boolean(input.isGlobal) ||
    title.toLowerCase() === SHARED_CHANNEL_TITLE.toLowerCase();
  db.prepare(
    `INSERT INTO tv_channels (id, title, village_id, created_by, is_global)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, title, input.villageId, input.createdBy, isGlobal ? 1 : 0);
  return getChannelById(id)!;
}

export function deleteChannel(channelId: string, user: UserPublic) {
  if (!user.isOwner) {
    return { ok: false as const, error: "Only the site owner can remove channels" };
  }
  const channel = getChannelById(channelId);
  if (!channel) return { ok: false as const, error: "Channel not found" };

  const db = getDb();
  const filenames = channel.videos
    .filter((v) => v.sourceKind === "file")
    .map((v) => v.filename);
  db.prepare(
    `UPDATE tv_rooms
     SET current_channel_id = NULL, current_video_id = NULL
     WHERE current_channel_id = ?`
  ).run(channelId);
  db.prepare(`DELETE FROM tv_videos WHERE channel_id = ?`).run(channelId);
  db.prepare(`DELETE FROM tv_channels WHERE id = ?`).run(channelId);
  try {
    persistTvCatalogs(db);
  } catch (err) {
    console.error("[persistent-tv] catalog export failed:", err);
  }
  return { ok: true as const, filenames };
}

export function createVideo(input: {
  title: string;
  filename: string;
  mime: string;
  sizeBytes: number;
  uploaderId: string;
  villageId: string | null;
  channelId: string;
  durationMs?: number;
  sourceUrl?: string | null;
}): TvVideo {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO tv_videos
      (id, title, filename, mime, size_bytes, duration_ms, uploader_id, village_id, channel_id, source_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.title,
    input.filename,
    input.mime,
    input.sizeBytes,
    Math.max(0, Math.floor(input.durationMs || 0)),
    input.uploaderId,
    input.villageId,
    input.channelId,
    input.sourceUrl?.trim() || null
  );

  if (!(input.durationMs && input.durationMs > 0) && !input.sourceUrl) {
    probeAndStoreDuration(id, input.filename);
  }

  // Every new clip joins the wall-clock lineup immediately.
  ensureChannelSchedule(input.channelId);
  addVideoToChannelSchedule(input.channelId, id);
  try {
    persistTvCatalogs(db);
  } catch (err) {
    console.error("[persistent-tv] catalog export failed:", err);
  }
  return getVideoById(id)!;
}

/** Add a channel clip from a YouTube or direct video URL (no file upload). */
export function createVideoFromLink(input: {
  sourceUrl: string;
  title?: string;
  durationMs?: number | null;
  uploaderId: string;
  villageId: string | null;
  channelId: string;
}): { ok: true; video: TvVideo } | { ok: false; error: string } {
  const parsed = parseTvLink(input.sourceUrl);
  if (!parsed.ok) return parsed;

  let durationMs =
    input.durationMs && input.durationMs > 0
      ? Math.floor(input.durationMs)
      : 0;

  if (!durationMs && parsed.kind === "direct") {
    durationMs = probeRemoteDurationMs(parsed.sourceUrl) || 0;
  }
  if (!durationMs) {
    durationMs = DEFAULT_LINK_DURATION_MS;
  }

  const title =
    (input.title || "").trim().slice(0, 80) ||
    parsed.titleHint.slice(0, 80) ||
    "Linked clip";

  const video = createVideo({
    title,
    filename: `link-${randomUUID()}`,
    mime: parsed.mime,
    sizeBytes: 0,
    uploaderId: input.uploaderId,
    villageId: input.villageId,
    channelId: input.channelId,
    durationMs,
    sourceUrl: parsed.sourceUrl,
  });

  // Persist duration explicitly for schedule (createVideo skipped file probe).
  setVideoDurationMs(video.id, durationMs);
  ensureChannelSchedule(input.channelId);
  // createVideo already exported catalogs; refresh again with the final duration.
  try {
    persistTvCatalogs(getDb());
  } catch (err) {
    console.error("[persistent-tv] catalog export failed:", err);
  }
  return { ok: true, video: getVideoById(video.id)! };
}

export function deleteVideo(videoId: string, user: UserPublic) {
  const video = getVideoById(videoId);
  if (!video) return { ok: false as const, error: "Clip not found" };
  if (!user.isOwner) {
    return { ok: false as const, error: "Only the site owner can remove clips" };
  }
  const db = getDb();
  if (video.channelId) {
    removeVideoFromChannelSchedule(video.channelId, videoId);
  }
  db.prepare(`UPDATE tv_rooms SET current_video_id = NULL WHERE current_video_id = ?`).run(
    videoId
  );
  db.prepare(`DELETE FROM tv_videos WHERE id = ?`).run(videoId);
  try {
    persistTvCatalogs(db);
  } catch (err) {
    console.error("[persistent-tv] catalog export failed:", err);
  }
  return {
    ok: true as const,
    filename: video.filename,
    isFile: video.sourceKind === "file",
  };
}

export function renameVideo(
  videoId: string,
  titleRaw: string,
  user: UserPublic
) {
  const video = getVideoById(videoId);
  if (!video) return { ok: false as const, error: "Clip not found" };
  if (!user.isOwner) {
    return { ok: false as const, error: "Only the site owner can rename clips" };
  }
  const title = titleRaw.trim().slice(0, 80);
  if (!title) {
    return { ok: false as const, error: "Give the clip a name" };
  }
  const db = getDb();
  db.prepare(`UPDATE tv_videos SET title = ? WHERE id = ?`).run(title, videoId);
  const updated = getVideoById(videoId);
  if (!updated) return { ok: false as const, error: "Clip not found" };
  try {
    persistTvCatalogs(db);
  } catch (err) {
    console.error("[persistent-tv] catalog export failed:", err);
  }
  return {
    ok: true as const,
    video: updated,
    channel: video.channelId ? getChannelById(video.channelId) : null,
  };
}

function listWatchers(roomId: string): TvWatcher[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT p.last_seen_at,
              u.id, u.username, u.display_name, u.bio, u.forest_name, u.created_at,
              u.is_owner, u.village_id, u.reputation
       FROM tv_presence p
       JOIN users u ON u.id = p.user_id
       WHERE p.room_id = ?
         AND datetime(p.last_seen_at) >= datetime('now', ?)
       ORDER BY u.display_name COLLATE NOCASE`
    )
    .all(roomId, `-${PRESENCE_TTL_SEC} seconds`) as Array<{
    last_seen_at: string;
    id: string;
    username: string;
    display_name: string;
    bio: string;
    forest_name: string;
    created_at: string;
    is_owner: number;
    village_id: string | null;
    reputation: number;
  }>;

  return rows.map((row) => ({
    lastSeenAt: row.last_seen_at,
    user: mapUser(row),
  }));
}

export function listChatMessages(roomId: string, limit = 60): TvChatMessage[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT m.id, m.room_id, m.body, m.created_at,
              u.id as uid, u.username, u.display_name, u.bio, u.forest_name,
              u.created_at as ucreated, u.is_owner, u.village_id, u.reputation
       FROM tv_chat_messages m
       JOIN users u ON u.id = m.author_id
       WHERE m.room_id = ?
       ORDER BY m.created_at DESC
       LIMIT ?`
    )
    .all(roomId, limit) as Array<{
    id: string;
    room_id: string;
    body: string;
    created_at: string;
    uid: string;
    username: string;
    display_name: string;
    bio: string;
    forest_name: string;
    ucreated: string;
    is_owner: number;
    village_id: string | null;
    reputation: number;
  }>;

  return rows
    .map((row) => ({
      id: row.id,
      roomId: row.room_id,
      body: row.body,
      createdAt: row.created_at,
      author: mapUser({
        id: row.uid,
        username: row.username,
        display_name: row.display_name,
        bio: row.bio,
        forest_name: row.forest_name,
        created_at: row.ucreated,
        is_owner: row.is_owner,
        village_id: row.village_id,
        reputation: row.reputation,
      }),
    }))
    .reverse();
}

export function postChatMessage(
  roomId: string,
  user: UserPublic,
  rawBody: string
) {
  const room = getRoomById(roomId);
  if (!room) return { ok: false as const, error: "Room not found", status: 404 };
  if (!canAccessRoom(user, room)) {
    return {
      ok: false as const,
      error: "This chat is for other villagers",
      status: 403,
    };
  }

  const body = rawBody.trim().slice(0, 280);
  if (!body) {
    return { ok: false as const, error: "Write a little something first", status: 400 };
  }

  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO tv_chat_messages (id, room_id, author_id, body)
     VALUES (?, ?, ?, ?)`
  ).run(id, roomId, user.id, body);
  db.prepare(
    `UPDATE tv_rooms SET updated_at = datetime('now') WHERE id = ?`
  ).run(roomId);
  touchPresence(roomId, user.id);

  return { ok: true as const, room: getRoomById(roomId)! };
}

function mapRoom(
  row: RoomRow,
  opts: { includeMessages?: boolean } = {}
): TvRoomState {
  const includeMessages = opts.includeMessages !== false;
  const base: TvRoomState = {
    id: row.id,
    scope: row.scope,
    villageId: row.village_id,
    hostId: row.host_id,
    title: row.title,
    currentChannelId: row.current_channel_id,
    currentVideoId: row.current_video_id,
    currentVideo: row.current_video_id
      ? getVideoById(row.current_video_id)
      : null,
    isPlaying: Boolean(row.is_playing),
    positionMs: Number(row.position_ms) || 0,
    positionUpdatedAt: row.position_updated_at,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    watchers: listWatchers(row.id),
    messages: includeMessages ? listChatMessages(row.id) : [],
    schedule: [],
    airStartsAt: null,
    broadcastMode: row.scope === "village" ? "schedule" : "interactive",
  };

  if (row.scope !== "village") {
    if (!base.currentChannelId && base.currentVideo?.channelId) {
      base.currentChannelId = base.currentVideo.channelId;
    }
    return base;
  }

  // Village lounge: wall-clock schedule is the source of truth.
  const channelId = row.current_channel_id;
  if (!channelId) {
    base.currentVideoId = null;
    base.currentVideo = null;
    base.isPlaying = false;
    base.positionMs = 0;
    base.schedule = [];
    base.airStartsAt = null;
    return base;
  }

  const broadcast = resolveChannelBroadcast(channelId);
  if (!broadcast) {
    base.currentChannelId = channelId;
    base.currentVideoId = null;
    base.currentVideo = null;
    base.isPlaying = false;
    base.positionMs = 0;
    base.schedule = [];
    base.airStartsAt = null;
    return base;
  }

  base.currentChannelId = channelId;
  base.currentVideoId = broadcast.videoId;
  base.currentVideo = getVideoById(broadcast.videoId);
  base.isPlaying = broadcast.isPlaying;
  base.positionMs = broadcast.positionMs;
  base.positionUpdatedAt = broadcast.positionUpdatedAt;
  base.schedule = broadcast.schedule;
  base.airStartsAt = broadcast.airStartsAt;
  return base;
}

export function estimatedPositionMs(room: Pick<
  TvRoomState,
  "positionMs" | "isPlaying" | "positionUpdatedAt"
>) {
  if (!room.isPlaying) return room.positionMs;
  const started = Date.parse(room.positionUpdatedAt.replace(" ", "T") + "Z");
  if (Number.isNaN(started)) return room.positionMs;
  const elapsed = Math.max(0, Date.now() - started);
  return room.positionMs + elapsed;
}

export function getRoomById(roomId: string): TvRoomState | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM tv_rooms WHERE id = ?`)
    .get(roomId) as RoomRow | undefined;
  return row ? mapRoom(row) : null;
}

export function canAccessRoom(user: UserPublic, room: TvRoomState) {
  if (user.isOwner) return true;
  if (room.scope === "village") {
    return Boolean(user.villageId && user.villageId === room.villageId);
  }
  if (room.hostId === user.id) return true;
  return areFriends(user.id, room.hostId);
}

export function touchPresence(roomId: string, userId: string) {
  const db = getDb();
  db.prepare(
    `INSERT INTO tv_presence (room_id, user_id, last_seen_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(room_id, user_id)
     DO UPDATE SET last_seen_at = datetime('now')`
  ).run(roomId, userId);
}

export function getOrCreateVillageRoom(
  user: UserPublic,
  villageId: VillageId
): TvRoomState {
  const db = getDb();
  const existing = db
    .prepare(
      `SELECT * FROM tv_rooms
       WHERE scope = 'village' AND village_id = ?
       ORDER BY created_at ASC
       LIMIT 1`
    )
    .get(villageId) as RoomRow | undefined;

  if (existing) {
    touchPresence(existing.id, user.id);
    ensureVillageBroadcastChannel(existing.id, villageId);
    return getRoomById(existing.id)!;
  }

  const village = getVillage(villageId);
  const id = randomUUID();
  const title = village
    ? `${village.name} TV Lounge`
    : "Village TV Lounge";
  db.prepare(
    `INSERT INTO tv_rooms
      (id, scope, village_id, host_id, title)
     VALUES (?, 'village', ?, ?, ?)`
  ).run(id, villageId, user.id, title);
  touchPresence(id, user.id);
  ensureVillageBroadcastChannel(id, villageId);
  return getRoomById(id)!;
}

/** If the village set has no channel tuned, start the first scheduled lineup. */
function ensureVillageBroadcastChannel(roomId: string, villageId: string) {
  const db = getDb();
  const row = db
    .prepare(`SELECT current_channel_id FROM tv_rooms WHERE id = ?`)
    .get(roomId) as { current_channel_id: string | null } | undefined;
  if (!row || row.current_channel_id) return;

  const channels = listChannelsForVillage(villageId);
  const first = channels.find((c) => c.videos.length > 0);
  if (!first) return;
  ensureChannelSchedule(first.id);
  db.prepare(
    `UPDATE tv_rooms
     SET current_channel_id = ?,
         is_playing = 1,
         updated_at = datetime('now')
     WHERE id = ?`
  ).run(first.id, roomId);
}

export function createFriendsRoom(user: UserPublic, title?: string): TvRoomState {
  const db = getDb();
  const id = randomUUID();
  const roomTitle =
    (title || "").trim().slice(0, 60) ||
    `${user.displayName}'s couch`;
  db.prepare(
    `INSERT INTO tv_rooms
      (id, scope, village_id, host_id, title)
     VALUES (?, 'friends', ?, ?, ?)`
  ).run(id, user.villageId, user.id, roomTitle);
  touchPresence(id, user.id);
  return getRoomById(id)!;
}

export function listFriendRooms(user: UserPublic): TvRoomState[] {
  const db = getDb();
  const friends = listFriends(user.id);
  const hostIds = [user.id, ...friends.map((f) => f.id)];
  if (hostIds.length === 0) return [];

  const placeholders = hostIds.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT * FROM tv_rooms
       WHERE scope = 'friends'
         AND host_id IN (${placeholders})
         AND datetime(updated_at) >= datetime('now', '-12 hours')
       ORDER BY updated_at DESC
       LIMIT 20`
    )
    .all(...hostIds) as RoomRow[];

  return rows
    .map((row) => mapRoom(row, { includeMessages: false }))
    .filter((room) => canAccessRoom(user, room));
}

export function updateRoomPlayback(
  roomId: string,
  user: UserPublic,
  patch: {
    channelId?: string | null;
    videoId?: string | null;
    isPlaying?: boolean;
    positionMs?: number;
    title?: string;
  }
) {
  const room = getRoomById(roomId);
  if (!room) return { ok: false as const, error: "Room not found", status: 404 };
  if (!canAccessRoom(user, room)) {
    return { ok: false as const, error: "This couch is for other villagers", status: 403 };
  }

  const libraryVillage = channelLibraryVillageId(user, room);

  // Village lounge is a real TV broadcast — only channel changes are interactive.
  if (room.scope === "village") {
    let nextChannelId = room.currentChannelId;

    if (patch.channelId !== undefined) {
      if (patch.channelId === null) {
        nextChannelId = null;
      } else {
        const channel = getChannelById(patch.channelId);
        if (!channel || !channelUsableInVillage(channel, libraryVillage)) {
          return {
            ok: false as const,
            error: "That channel is not on this village dial",
            status: 400,
          };
        }
        nextChannelId = channel.id;
        ensureChannelSchedule(channel.id);
      }
    } else if (patch.videoId) {
      // Picking a clip on the shelf tunes that clip's channel (schedule keeps air time).
      const video = getVideoById(patch.videoId);
      if (
        !video ||
        !canAccessVideo(user, video) ||
        !videoUsableInVillage(video, libraryVillage) ||
        !video.channelId
      ) {
        return {
          ok: false as const,
          error: "That clip is not on this village dial",
          status: 400,
        };
      }
      nextChannelId = video.channelId;
      ensureChannelSchedule(video.channelId);
    }

    const db = getDb();
    db.prepare(
      `UPDATE tv_rooms
       SET current_channel_id = ?,
           current_video_id = NULL,
           is_playing = 1,
           position_ms = 0,
           position_updated_at = datetime('now'),
           updated_at = datetime('now')
       WHERE id = ?`
    ).run(nextChannelId, roomId);

    touchPresence(roomId, user.id);
    return { ok: true as const, room: getRoomById(roomId)! };
  }

  let nextChannelId = room.currentChannelId;
  let nextVideoId = room.currentVideoId;

  if (patch.channelId !== undefined) {
    if (patch.channelId === null) {
      nextChannelId = null;
      nextVideoId = null;
    } else {
      const channel = getChannelById(patch.channelId);
      if (!channel || !channelUsableInVillage(channel, libraryVillage)) {
        return {
          ok: false as const,
          error: "That channel is not on this village dial",
          status: 400,
        };
      }
      nextChannelId = channel.id;
      if (patch.videoId === undefined) {
        nextVideoId = channel.videos[0]?.id || null;
      }
    }
  }

  if (patch.videoId !== undefined) {
    if (patch.videoId === null) {
      nextVideoId = null;
    } else {
      const video = getVideoById(patch.videoId);
      if (
        !video ||
        !canAccessVideo(user, video) ||
        !videoUsableInVillage(video, libraryVillage)
      ) {
        return {
          ok: false as const,
          error: "That clip is not on this village dial",
          status: 400,
        };
      }
      nextVideoId = video.id;
      nextChannelId = video.channelId || nextChannelId;
    }
  }

  const isPlaying =
    patch.isPlaying === undefined ? (room.isPlaying ? 1 : 0) : patch.isPlaying ? 1 : 0;
  const positionMs =
    patch.positionMs === undefined
      ? estimatedPositionMs(room)
      : Math.max(0, Math.floor(patch.positionMs));
  const title =
    patch.title !== undefined
      ? patch.title.trim().slice(0, 60) || room.title
      : room.title;

  const db = getDb();
  db.prepare(
    `UPDATE tv_rooms
     SET current_channel_id = ?,
         current_video_id = ?,
         is_playing = ?,
         position_ms = ?,
         position_updated_at = datetime('now'),
         title = ?,
         updated_at = datetime('now')
     WHERE id = ?`
  ).run(nextChannelId, nextVideoId, isPlaying, positionMs, title, roomId);

  touchPresence(roomId, user.id);
  return { ok: true as const, room: getRoomById(roomId)! };
}

export const TV_MIME_EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/x-m4v": "mp4",
  "video/x-msvideo": "avi",
  "video/avi": "avi",
  "video/mpeg": "mpg",
  "video/x-matroska": "mkv",
};

export const TV_ALLOWED_MIME = new Set(Object.keys(TV_MIME_EXT));
/** Full movies welcome — up to 5GB per file. */
export const TV_MAX_BYTES = 5 * 1024 * 1024 * 1024;
export const TV_MAX_LABEL = "5GB";

const EXT_MIME: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/x-m4v",
  webm: "video/webm",
  mov: "video/quicktime",
  qt: "video/quicktime",
  avi: "video/x-msvideo",
  mpg: "video/mpeg",
  mpeg: "video/mpeg",
  mkv: "video/x-matroska",
};

export function resolveTvUpload(file: {
  name: string;
  type: string;
  size: number;
}): { ok: true; mime: string; ext: string } | { ok: false; error: string } {
  if (file.size <= 0) {
    return {
      ok: false,
      error: "That file looks empty — is it still downloading?",
    };
  }
  if (file.size > TV_MAX_BYTES) {
    return { ok: false, error: `Videos must be under ${TV_MAX_LABEL}` };
  }
  // Browsers usually send basename only; still strip Windows/mac paths if present.
  const baseName =
    file.name.replace(/\\/g, "/").split("/").pop()?.trim() || "clip.mp4";
  const extFromName = baseName.split(".").pop()?.toLowerCase() || "";
  const rawType = (file.type || "").toLowerCase().trim();
  const mimeFromType =
    (TV_ALLOWED_MIME.has(rawType) ? rawType : "") ||
    (rawType === "application/mp4" ? "video/mp4" : "") ||
    (rawType === "video/x-quicktime" ? "video/quicktime" : "");
  // Browsers often send octet-stream / blank type for downloaded movies —
  // fall back to the file extension.
  const mime = mimeFromType || EXT_MIME[extFromName] || "";
  if (!mime || !TV_ALLOWED_MIME.has(mime)) {
    return {
      ok: false,
      error: "Use MP4, WebM, MOV, M4V, AVI, MPEG, or MKV",
    };
  }
  const ext = TV_MIME_EXT[mime] || extFromName || "mp4";
  return { ok: true, mime, ext };
}

/** Basename only — strips C:\\Users\\...\\ prefixes from downloaders. */
export function safeUploadFilename(name: string) {
  const base =
    name.replace(/\\/g, "/").split("/").pop()?.trim() || "clip.mp4";
  return base.replace(/[^\w.\- ()[\]]+/g, "_").slice(0, 180) || "clip.mp4";
}

export function formatTvBytes(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}