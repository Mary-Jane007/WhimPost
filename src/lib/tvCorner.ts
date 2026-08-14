import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import { mapUser } from "@/lib/auth";
import { areFriends, listFriends } from "@/lib/letters";
import type { UserPublic } from "@/lib/types";
import type { VillageId } from "@/lib/villages";
import { getVillage } from "@/lib/villages";
import { persistAllDurableState } from "@/lib/tvPersist";

export type TvRoomScope = "village" | "friends";

export type TvVideo = {
  id: string;
  title: string;
  url: string;
  mime: string;
  sizeBytes: number;
  uploaderId: string;
  uploaderName: string;
  villageId: string | null;
  createdAt: string;
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
  currentVideoId: string | null;
  currentVideo: TvVideo | null;
  isPlaying: boolean;
  positionMs: number;
  positionUpdatedAt: string;
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
  uploader_id: string;
  village_id: string | null;
  created_at: string;
  uploader_name?: string;
};

type RoomRow = {
  id: string;
  scope: TvRoomScope;
  village_id: string | null;
  host_id: string;
  title: string;
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
    uploaderId: row.uploader_id,
    uploaderName: row.uploader_name || "Villager",
    villageId: row.village_id,
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
  return false;
}

export function listVideosForUser(user: UserPublic): TvVideo[] {
  const db = getDb();
  const friends = listFriends(user.id);
  const friendIds = friends.map((f) => f.id);

  const rows = db
    .prepare(
      `SELECT v.*, u.display_name as uploader_name
       FROM tv_videos v
       JOIN users u ON u.id = v.uploader_id
       ORDER BY v.created_at DESC
       LIMIT 80`
    )
    .all() as VideoRow[];

  return rows
    .map(mapVideo)
    .filter((video) => {
      if (user.isOwner || video.uploaderId === user.id) return true;
      if (video.villageId && user.villageId === video.villageId) return true;
      if (friendIds.includes(video.uploaderId)) return true;
      return false;
    });
}

export function createVideo(input: {
  title: string;
  filename: string;
  mime: string;
  sizeBytes: number;
  uploaderId: string;
  villageId: string | null;
}): TvVideo {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO tv_videos
      (id, title, filename, mime, size_bytes, uploader_id, village_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.title,
    input.filename,
    input.mime,
    input.sizeBytes,
    input.uploaderId,
    input.villageId
  );
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
    return { ok: false as const, error: "Only the uploader can remove this clip" };
  }
  const db = getDb();
  const filename = video.url.replace("/api/uploads/", "");
  db.prepare(`UPDATE tv_rooms SET current_video_id = NULL WHERE current_video_id = ?`).run(
    videoId
  );
  db.prepare(`DELETE FROM tv_videos WHERE id = ?`).run(videoId);
  try {
    persistAllDurableState(db);
  } catch (err) {
    console.error("[tv] persist after delete failed:", err);
  }
  return { ok: true as const, filename };
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

function mapRoom(row: RoomRow): TvRoomState {
  const currentVideo = row.current_video_id
    ? getVideoById(row.current_video_id)
    : null;
  return {
    id: row.id,
    scope: row.scope,
    villageId: row.village_id,
    hostId: row.host_id,
    title: row.title,
    currentVideoId: row.current_video_id,
    currentVideo,
    isPlaying: Boolean(row.is_playing),
    positionMs: Number(row.position_ms) || 0,
    positionUpdatedAt: row.position_updated_at,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    watchers: listWatchers(row.id),
  };
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
    return mapRoom(existing);
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
  return getRoomById(id)!;
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

  let nextVideoId = room.currentVideoId;
  if (patch.videoId !== undefined) {
    if (patch.videoId === null) {
      nextVideoId = null;
    } else {
      const video = getVideoById(patch.videoId);
      if (!video || !canAccessVideo(user, video)) {
        return { ok: false as const, error: "That clip is not on this shelf", status: 400 };
      }
      nextVideoId = video.id;
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
     SET current_video_id = ?,
         is_playing = ?,
         position_ms = ?,
         position_updated_at = datetime('now'),
         title = ?,
         updated_at = datetime('now')
     WHERE id = ?`
  ).run(nextVideoId, isPlaying, positionMs, title, roomId);

  touchPresence(roomId, user.id);
  return { ok: true as const, room: getRoomById(roomId)! };
}

export const TV_MIME_EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export const TV_ALLOWED_MIME = new Set(Object.keys(TV_MIME_EXT));
export const TV_MAX_BYTES = 80 * 1024 * 1024; // 80MB
