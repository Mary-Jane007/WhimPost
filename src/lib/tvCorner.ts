import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import { mapUser } from "@/lib/auth";
import { areFriends, listFriends } from "@/lib/letters";
import type { UserPublic } from "@/lib/types";
import type { VillageId } from "@/lib/villages";
import { getVillage, isVillageId } from "@/lib/villages";
import { persistAllDurableState } from "@/lib/tvPersist";
import { isSharedTvChannelTitle } from "@/lib/persistentTvMedia";
import {
  addVideoToChannelSchedule,
  probeAndStoreDuration,
  removeVideoFromChannelSchedule,
  resolveChannelBroadcast,
  type TvScheduleSlot,
} from "@/lib/tvSchedule";

export type TvRoomScope = "village" | "friends";

export type TvVideo = {
  id: string;
  title: string;
  url: string;
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
  isGlobal: boolean;
  createdBy: string;
  createdAt: string;
  videos: TvVideo[];
};

export type TvWatcher = {
  user: UserPublic;
  lastSeenAt: string;
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
  airStartsAt: string | null;
  broadcastMode: "schedule" | "interactive";
  schedule: TvScheduleSlot[];
  updatedAt: string;
  createdAt: string;
  watchers: TvWatcher[];
};

type VideoRow = {
  id: string;
  title: string;
  filename: string;
  mime: string;
  size_bytes: number;
  duration_ms?: number | null;
  uploader_id: string;
  village_id: string | null;
  channel_id?: string | null;
  created_at: string;
  uploader_name?: string;
};

type ChannelRow = {
  id: string;
  title: string;
  village_id: string;
  created_by: string;
  is_global: number;
  created_at: string;
};

type RoomRow = {
  id: string;
  scope: TvRoomScope;
  village_id: string | null;
  host_id: string;
  title: string;
  current_channel_id?: string | null;
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
  return {
    id: row.id,
    title: row.title,
    url: videoUrl(row.filename),
    mime: row.mime,
    sizeBytes: Number(row.size_bytes) || 0,
    durationMs: Number(row.duration_ms) || 0,
    uploaderId: row.uploader_id,
    uploaderName: row.uploader_name || "Villager",
    villageId: row.village_id,
    channelId: row.channel_id || null,
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
  if (video.uploaderId === user.id) return true;
  if (video.villageId && user.villageId === video.villageId) return true;
  if (areFriends(user.id, video.uploaderId)) return true;
  // Global channel clips (villageId null) are for every lounge.
  if (!video.villageId && video.channelId) return true;
  return false;
}

function listVideosForChannel(channelId: string): TvVideo[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT v.*, u.display_name as uploader_name
       FROM tv_videos v
       JOIN users u ON u.id = v.uploader_id
       WHERE v.channel_id = ?
       ORDER BY v.created_at DESC`
    )
    .all(channelId) as VideoRow[];
  return rows.map(mapVideo);
}

function mapChannel(row: ChannelRow): TvChannel {
  return {
    id: row.id,
    title: row.title,
    villageId: row.village_id,
    isGlobal: Boolean(row.is_global),
    createdBy: row.created_by,
    createdAt: row.created_at,
    videos: listVideosForChannel(row.id),
  };
}

export function getChannelById(id: string): TvChannel | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM tv_channels WHERE id = ?`)
    .get(id) as ChannelRow | undefined;
  return row ? mapChannel(row) : null;
}

/** Channels the viewer can see: their village + global. */
export function listChannelsForUser(user: UserPublic): TvChannel[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM tv_channels
       WHERE is_global = 1
          OR village_id = ?
       ORDER BY is_global DESC, title COLLATE NOCASE ASC`
    )
    .all(user.villageId || "") as ChannelRow[];
  return rows.map(mapChannel);
}

export function listVideosForUser(user: UserPublic): TvVideo[] {
  return listChannelsForUser(user).flatMap((ch) => ch.videos);
}

export function createChannel(
  user: UserPublic,
  input: { title: string; villageId?: string; isGlobal?: boolean }
) {
  if (!user.isOwner) {
    return { ok: false as const, error: "Only the owner can make channels", status: 403 };
  }
  const title = input.title.trim().slice(0, 80);
  if (!title) {
    return { ok: false as const, error: "Give the channel a name", status: 400 };
  }
  const isGlobal =
    Boolean(input.isGlobal) || isSharedTvChannelTitle(title);
  const villageId = isGlobal
    ? user.villageId || "mosshollow"
    : String(input.villageId || user.villageId || "").trim();
  if (!isVillageId(villageId)) {
    return { ok: false as const, error: "Pick a village for this channel", status: 400 };
  }

  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO tv_channels (id, title, village_id, created_by, is_global)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, title, villageId, user.id, isGlobal ? 1 : 0);

  try {
    persistAllDurableState(db);
  } catch (err) {
    console.error("[tv] persist after channel create failed:", err);
  }

  return { ok: true as const, channel: getChannelById(id)! };
}

export function deleteChannel(channelId: string, user: UserPublic) {
  if (!user.isOwner) {
    return { ok: false as const, error: "Only the owner can remove channels", status: 403 };
  }
  const channel = getChannelById(channelId);
  if (!channel) {
    return { ok: false as const, error: "Channel not found", status: 404 };
  }

  const db = getDb();
  const filenames = (
    db
      .prepare(`SELECT filename FROM tv_videos WHERE channel_id = ?`)
      .all(channelId) as Array<{ filename: string }>
  ).map((r) => r.filename);

  db.prepare(
    `UPDATE tv_rooms SET current_channel_id = NULL, current_video_id = NULL
     WHERE current_channel_id = ?`
  ).run(channelId);
  db.prepare(`DELETE FROM tv_videos WHERE channel_id = ?`).run(channelId);
  db.prepare(`DELETE FROM tv_channels WHERE id = ?`).run(channelId);

  try {
    persistAllDurableState(db);
  } catch (err) {
    console.error("[tv] persist after channel delete failed:", err);
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
}): TvVideo {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO tv_videos
      (id, title, filename, mime, size_bytes, uploader_id, village_id, channel_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.title,
    input.filename,
    input.mime,
    input.sizeBytes,
    input.uploaderId,
    input.villageId,
    input.channelId
  );

  try {
    probeAndStoreDuration(id, input.filename);
  } catch {
    // Duration can fill in later from playback metadata.
  }

  addVideoToChannelSchedule(input.channelId, id);

  try {
    persistAllDurableState(db);
  } catch (err) {
    console.error("[tv] persist after create failed:", err);
  }
  return getVideoById(id)!;
}

export function deleteVideo(videoId: string, user: UserPublic) {
  const video = getVideoById(videoId);
  if (!video) return { ok: false as const, error: "Clip not found" };
  if (!user.isOwner && video.uploaderId !== user.id) {
    return {
      ok: false as const,
      error: "Only the owner or uploader can remove this clip",
    };
  }
  const db = getDb();
  const filename = video.url.replace("/api/uploads/", "");
  if (video.channelId) {
    removeVideoFromChannelSchedule(video.channelId, videoId);
  }
  db.prepare(
    `UPDATE tv_rooms SET current_video_id = NULL WHERE current_video_id = ?`
  ).run(videoId);
  db.prepare(`DELETE FROM tv_videos WHERE id = ?`).run(videoId);
  try {
    persistAllDurableState(db);
  } catch (err) {
    console.error("[tv] persist after delete failed:", err);
  }
  return { ok: true as const, filename };
}

export function renameVideo(
  videoId: string,
  titleRaw: string,
  user: UserPublic
) {
  const video = getVideoById(videoId);
  if (!video) return { ok: false as const, error: "Clip not found" };
  if (!user.isOwner) {
    return {
      ok: false as const,
      error: "Only the site owner can rename clips",
    };
  }
  const title = titleRaw.trim().slice(0, 80);
  if (!title) {
    return { ok: false as const, error: "Give the clip a name" };
  }
  const db = getDb();
  db.prepare(`UPDATE tv_videos SET title = ? WHERE id = ?`).run(title, videoId);
  try {
    persistAllDurableState(db);
  } catch (err) {
    console.error("[tv] persist after rename failed:", err);
  }
  const updated = getVideoById(videoId);
  if (!updated) return { ok: false as const, error: "Clip not found" };
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

function applyScheduleOverlay(room: TvRoomState): TvRoomState {
  if (room.scope !== "village" || !room.currentChannelId) {
    return {
      ...room,
      broadcastMode: "interactive",
      airStartsAt: null,
      schedule: [],
    };
  }

  const broadcast = resolveChannelBroadcast(room.currentChannelId);
  if (!broadcast) {
    return {
      ...room,
      currentVideoId: null,
      currentVideo: null,
      isPlaying: false,
      positionMs: 0,
      broadcastMode: "schedule",
      airStartsAt: null,
      schedule: [],
    };
  }

  const currentVideo = getVideoById(broadcast.videoId);
  return {
    ...room,
    currentVideoId: broadcast.videoId,
    currentVideo,
    isPlaying: broadcast.isPlaying,
    positionMs: broadcast.positionMs,
    positionUpdatedAt: broadcast.positionUpdatedAt,
    airStartsAt: broadcast.airStartsAt,
    broadcastMode: "schedule",
    schedule: broadcast.schedule,
  };
}

function mapRoom(row: RoomRow): TvRoomState {
  const base: TvRoomState = {
    id: row.id,
    scope: row.scope,
    villageId: row.village_id,
    hostId: row.host_id,
    title: row.title,
    currentChannelId: row.current_channel_id || null,
    currentVideoId: row.current_video_id,
    currentVideo: row.current_video_id
      ? getVideoById(row.current_video_id)
      : null,
    isPlaying: Boolean(row.is_playing),
    positionMs: Number(row.position_ms) || 0,
    positionUpdatedAt: row.position_updated_at,
    airStartsAt: null,
    broadcastMode: "interactive",
    schedule: [],
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    watchers: listWatchers(row.id),
  };
  return applyScheduleOverlay(base);
}

export function estimatedPositionMs(
  room: Pick<TvRoomState, "positionMs" | "isPlaying" | "positionUpdatedAt">
) {
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
    ensureVillageRoomHasChannel(existing.id, villageId);
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
  ensureVillageRoomHasChannel(id, villageId);
  return getRoomById(id)!;
}

/**
 * Keep the village set tuned so every neighbor sees Now Playing + the shuffle
 * guide as soon as they walk into the lounge.
 */
function ensureVillageRoomHasChannel(roomId: string, villageId: VillageId) {
  const db = getDb();
  const row = db
    .prepare(`SELECT current_channel_id FROM tv_rooms WHERE id = ?`)
    .get(roomId) as { current_channel_id: string | null } | undefined;
  if (!row) return;

  if (row.current_channel_id) {
    const stillThere = getChannelById(row.current_channel_id);
    if (stillThere) return;
  }

  const pick = db
    .prepare(
      `SELECT c.id
       FROM tv_channels c
       LEFT JOIN tv_videos v ON v.channel_id = c.id
       WHERE c.is_global = 1 OR c.village_id = ?
       GROUP BY c.id
       ORDER BY COUNT(v.id) DESC, c.is_global DESC, c.title COLLATE NOCASE ASC
       LIMIT 1`
    )
    .get(villageId) as { id: string } | undefined;
  if (!pick?.id) return;

  db.prepare(
    `UPDATE tv_rooms
     SET current_channel_id = ?,
         current_video_id = NULL,
         is_playing = 1,
         position_ms = 0,
         position_updated_at = datetime('now'),
         updated_at = datetime('now')
     WHERE id = ?`
  ).run(pick.id, roomId);
}

export function createFriendsRoom(user: UserPublic, title?: string): TvRoomState {
  const db = getDb();
  const id = randomUUID();
  const roomTitle =
    (title || "").trim().slice(0, 60) || `${user.displayName}'s couch`;
  db.prepare(
    `INSERT INTO tv_rooms
      (id, scope, village_id, host_id, title)
     VALUES (?, 'friends', NULL, ?, ?)`
  ).run(id, user.id, roomTitle);
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

  return rows.map(mapRoom).filter((room) => canAccessRoom(user, room));
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
    return {
      ok: false as const,
      error: "This couch is for other villagers",
      status: 403,
    };
  }

  const db = getDb();
  let nextChannelId =
    patch.channelId !== undefined ? patch.channelId : room.currentChannelId;

  if (patch.channelId) {
    const channel = getChannelById(patch.channelId);
    if (!channel) {
      return { ok: false as const, error: "Channel not found", status: 404 };
    }
    if (
      !channel.isGlobal &&
      room.scope === "village" &&
      room.villageId &&
      channel.villageId !== room.villageId &&
      !user.isOwner
    ) {
      return {
        ok: false as const,
        error: "That channel belongs to another village",
        status: 403,
      };
    }
  }

  // Village lounges follow the shuffle schedule once a channel is tuned.
  if (room.scope === "village" && nextChannelId) {
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

  let nextVideoId = room.currentVideoId;
  if (patch.videoId !== undefined) {
    if (patch.videoId === null) {
      nextVideoId = null;
    } else {
      const video = getVideoById(patch.videoId);
      if (!video || !canAccessVideo(user, video)) {
        return {
          ok: false as const,
          error: "That clip is not on this shelf",
          status: 400,
        };
      }
      nextVideoId = video.id;
      if (video.channelId) nextChannelId = video.channelId;
    }
  }

  const isPlaying =
    patch.isPlaying === undefined
      ? room.isPlaying
        ? 1
        : 0
      : patch.isPlaying
        ? 1
        : 0;
  const positionMs =
    patch.positionMs === undefined
      ? estimatedPositionMs(room)
      : Math.max(0, Math.floor(patch.positionMs));
  const title =
    patch.title !== undefined
      ? patch.title.trim().slice(0, 60) || room.title
      : room.title;

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
  "video/x-m4v": "m4v",
  "video/x-msvideo": "avi",
  "video/mpeg": "mpg",
  "video/x-matroska": "mkv",
};

export const TV_ALLOWED_MIME = new Set(Object.keys(TV_MIME_EXT));
export const TV_MAX_BYTES = 10 * 1024 * 1024 * 1024; // 10GB movies
export const TV_MAX_LABEL = "10GB";

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
  const baseName =
    file.name.replace(/\\/g, "/").split("/").pop()?.trim() || "clip.mp4";
  const extFromName = baseName.split(".").pop()?.toLowerCase() || "";
  const rawType = (file.type || "").toLowerCase().trim();
  const mimeFromType =
    (TV_ALLOWED_MIME.has(rawType) ? rawType : "") ||
    (rawType === "application/mp4" ? "video/mp4" : "") ||
    (rawType === "video/x-quicktime" ? "video/quicktime" : "");
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
