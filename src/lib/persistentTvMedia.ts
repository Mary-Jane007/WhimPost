import type { Database } from "better-sqlite3";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { isPlayableMediaFile } from "@/lib/lfsPointer";
import { UPLOAD_DIR } from "@/lib/uploadPaths";
import {
  PERSISTENT_TV_MEDIA_PATH,
  TV_CACHE_DIR,
} from "@/lib/tvMediaPaths";
import {
  isProtectedTvChannelTitle,
  isSharedTvChannelTitle,
  PROTECTED_SHARED_TV_TITLES,
} from "@/lib/tvProtectedChannels";
import { readLockedTvMediaClips } from "@/lib/lockedMain";

/**
 * Git-tracked catalog of uploaded TV files (metadata only).
 */
export { PERSISTENT_TV_MEDIA_PATH } from "@/lib/tvMediaPaths";
export {
  isProtectedTvChannelTitle,
  isSharedTvChannelTitle,
  PROTECTED_SHARED_TV_TITLES,
} from "@/lib/tvProtectedChannels";

export type PersistentTvMediaClip = {
  title: string;
  filename: string;
  mime: string;
  sizeBytes: number;
  durationMs?: number;
  channelTitle: string;
  villageId: string | null;
  isGlobal?: boolean;
};

/**
 * True when catalog bytes are watchable locally — either a real upload or a
 * tv-cache stand-in (used when Git LFS / media-release bytes are unavailable).
 */
function clipBytesPresent(filename: string) {
  const safe = path.basename(filename);
  if (!safe || safe !== filename) return false;
  const uploadPath = path.join(UPLOAD_DIR, safe);
  if (fs.existsSync(uploadPath)) return true;
  return isPlayableMediaFile(path.join(TV_CACHE_DIR, safe));
}

/**
 * Promote shared channels (Cottage Cartoons, Storybook Cinema) to every-village
 * and clear village locks on their clips so all lounges can tune in.
 */
export function ensureSharedTvChannelsGlobal(db: Database) {
  const channels = db
    .prepare(`SELECT id, title, is_global FROM tv_channels`)
    .all() as Array<{ id: string; title: string; is_global: number }>;

  let changed = 0;
  for (const ch of channels) {
    if (!isSharedTvChannelTitle(ch.title)) continue;
    if (!ch.is_global) {
      db.prepare(`UPDATE tv_channels SET is_global = 1 WHERE id = ?`).run(ch.id);
      changed += 1;
    }
    const locked = db
      .prepare(
        `UPDATE tv_videos
         SET village_id = NULL
         WHERE channel_id = ? AND village_id IS NOT NULL`
      )
      .run(ch.id).changes;
    changed += locked;
  }
  return changed;
}

/**
 * Always create protected shared channel rows — even before clip bytes land —
 * so The Storybook Cinema never vanishes from the lounge dial.
 */
export function ensureProtectedTvChannels(db: Database) {
  const owner = db
    .prepare(
      `SELECT id FROM users
       WHERE is_owner = 1
       ORDER BY CASE WHEN username = 'Mary_Jane' THEN 0 ELSE 1 END, created_at ASC
       LIMIT 1`
    )
    .get() as { id: string } | undefined;
  const anyUser = db.prepare(`SELECT id FROM users LIMIT 1`).get() as
    | { id: string }
    | undefined;
  const creatorId = owner?.id || anyUser?.id;
  if (!creatorId) return 0;

  const findChannel = db.prepare(
    `SELECT id FROM tv_channels
     WHERE lower(trim(title)) = lower(?)
     ORDER BY is_global DESC, created_at ASC
     LIMIT 1`
  );
  const insertChannel = db.prepare(
    `INSERT INTO tv_channels (id, title, village_id, created_by, is_global)
     VALUES (?, ?, ?, ?, 1)`
  );

  const titles = ["Cottage Cartoons", "The Storybook Cinema"];
  let created = 0;
  for (const title of titles) {
    const existing = findChannel.get(title) as { id: string } | undefined;
    if (existing) {
      db.prepare(`UPDATE tv_channels SET is_global = 1 WHERE id = ?`).run(
        existing.id
      );
      continue;
    }
    insertChannel.run(randomUUID(), title, "mosshollow", creatorId);
    created += 1;
  }
  ensureSharedTvChannelsGlobal(db);
  return created;
}

type PersistentTvMediaFile = {
  version: 1;
  updatedAt: string;
  clips: PersistentTvMediaClip[];
};

function readFile(): PersistentTvMediaFile | null {
  try {
    if (!fs.existsSync(PERSISTENT_TV_MEDIA_PATH)) return null;
    const raw = fs.readFileSync(PERSISTENT_TV_MEDIA_PATH, "utf8");
    if (!raw.trim()) return null;
    const parsed = JSON.parse(raw) as PersistentTvMediaFile;
    if (!parsed || !Array.isArray(parsed.clips)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeFile(clips: PersistentTvMediaClip[]) {
  const dir = path.dirname(PERSISTENT_TV_MEDIA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const payload: PersistentTvMediaFile = {
    version: 1,
    updatedAt: new Date().toISOString(),
    clips: clips
      .filter((c) => c.filename && c.title && c.channelTitle)
      .sort((a, b) =>
        `${a.channelTitle}:${a.title}`.localeCompare(
          `${b.channelTitle}:${b.title}`
        )
      ),
  };

  const tmp = `${PERSISTENT_TV_MEDIA_PATH}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.renameSync(tmp, PERSISTENT_TV_MEDIA_PATH);
}

function shuffleIds(ids: string[]): string[] {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/** Snapshot uploaded (file) TV clips so fresh servers can restore them. */
export function exportPersistentTvMedia(db: Database) {
  const previous = readFile();
  const rows = db
    .prepare(
      `SELECT v.title, v.filename, v.mime, v.size_bytes, v.duration_ms,
              v.village_id, c.title AS channel_title, c.is_global
       FROM tv_videos v
       LEFT JOIN tv_channels c ON c.id = v.channel_id
       WHERE v.source_url IS NULL OR trim(v.source_url) = ''
       ORDER BY v.created_at ASC`
    )
    .all() as Array<{
    title: string;
    filename: string;
    mime: string;
    size_bytes: number;
    duration_ms: number;
    village_id: string | null;
    channel_title: string | null;
    is_global: number | null;
  }>;

  const byFilename = new Map<string, PersistentTvMediaClip>();
  for (const row of rows) {
    if (row.filename.startsWith("link-")) continue;
    const filePath = path.join(UPLOAD_DIR, row.filename);
    if (!fs.existsSync(filePath) && !clipBytesPresent(row.filename)) continue;
    byFilename.set(row.filename, {
      title: row.title,
      filename: row.filename,
      mime: row.mime || "video/mp4",
      sizeBytes: row.size_bytes || 0,
      durationMs: row.duration_ms > 0 ? row.duration_ms : undefined,
      channelTitle: row.channel_title || "Clip shelf",
      villageId: row.village_id,
      isGlobal:
        Boolean(row.is_global) ||
        isSharedTvChannelTitle(row.channel_title || ""),
    });
  }

  // Never thin the git catalog. Keep EVERY prior clip (all villages + forever
  // lounges) when a temporary empty DB or missing local bytes would drop them.
  const floorClips = [
    ...(previous?.clips || []),
    ...readLockedTvMediaClips(),
  ];
  for (const clip of floorClips) {
    if (!clip.filename || byFilename.has(clip.filename)) continue;
    const protectedChannel = isProtectedTvChannelTitle(clip.channelTitle);
    byFilename.set(clip.filename, {
      ...clip,
      isGlobal:
        Boolean(clip.isGlobal) ||
        protectedChannel ||
        isSharedTvChannelTitle(clip.channelTitle),
      villageId: protectedChannel ? null : clip.villageId ?? null,
      channelTitle:
        clip.channelTitle.trim() ||
        (protectedChannel ? "The Storybook Cinema" : "Clip shelf"),
    });
  }

  writeFile(Array.from(byFilename.values()));
}

/** Restore uploaded clips into owner channels (and seed shuffle schedules). */
export function importPersistentTvMedia(db: Database) {
  ensureProtectedTvChannels(db);
  const file = readFile();
  if (!file || file.clips.length === 0) {
    ensureSharedTvChannelsGlobal(db);
    return;
  }

  const owner = db
    .prepare(
      `SELECT id FROM users
       WHERE is_owner = 1
       ORDER BY CASE WHEN username = 'Mary_Jane' THEN 0 ELSE 1 END, created_at ASC
       LIMIT 1`
    )
    .get() as { id: string } | undefined;
  const anyUser = db.prepare(`SELECT id FROM users LIMIT 1`).get() as
    | { id: string }
    | undefined;
  const uploaderId = owner?.id || anyUser?.id;
  if (!uploaderId) return;

  const findChannel = db.prepare(
    `SELECT id FROM tv_channels
     WHERE lower(trim(title)) = lower(?)
     ORDER BY is_global DESC, created_at ASC
     LIMIT 1`
  );
  const insertChannel = db.prepare(
    `INSERT INTO tv_channels (id, title, village_id, created_by, is_global)
     VALUES (?, ?, ?, ?, ?)`
  );
  const findByFilename = db.prepare(
    `SELECT id FROM tv_videos WHERE filename = ? LIMIT 1`
  );
  const insertVideo = db.prepare(
    `INSERT INTO tv_videos
      (id, title, filename, mime, size_bytes, duration_ms, uploader_id, village_id, channel_id, source_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`
  );
  const updateVideo = db.prepare(
    `UPDATE tv_videos
     SET title = ?, mime = ?, size_bytes = ?, duration_ms = ?, village_id = ?, channel_id = ?
     WHERE id = ?`
  );

  const touched = new Set<string>();
  let restored = 0;
  let skippedMissing = 0;

  const sync = db.transaction((clips: PersistentTvMediaClip[]) => {
    for (const clip of clips) {
      const filename = String(clip.filename || "").trim();
      const title = String(clip.title || "").trim().slice(0, 80);
      const channelTitle =
        String(clip.channelTitle || "Clip shelf").trim().slice(0, 80) ||
        "Clip shelf";
      if (!filename || !title) continue;
      if (filename.startsWith("link-") || filename.includes("..")) continue;

      if (!clipBytesPresent(filename)) {
        skippedMissing += 1;
        continue;
      }

      const uploadPath = path.join(UPLOAD_DIR, filename);
      const sizeBytes =
        clip.sizeBytes > 0
          ? clip.sizeBytes
          : fs.existsSync(uploadPath)
            ? fs.statSync(uploadPath).size
            : 0;
      const villageId =
        String(clip.villageId || "mosshollow").trim() || "mosshollow";
      const isGlobal =
        Boolean(clip.isGlobal) || isSharedTvChannelTitle(channelTitle);
      const durationMs =
        clip.durationMs && clip.durationMs > 0
          ? Math.floor(clip.durationMs)
          : 0;

      let channelId = (
        findChannel.get(channelTitle) as { id: string } | undefined
      )?.id;
      if (!channelId) {
        channelId = randomUUID();
        insertChannel.run(
          channelId,
          channelTitle,
          villageId,
          uploaderId,
          isGlobal ? 1 : 0
        );
      } else if (isGlobal) {
        db.prepare(`UPDATE tv_channels SET is_global = 1 WHERE id = ?`).run(
          channelId
        );
      }

      const existing = findByFilename.get(filename) as
        | { id: string }
        | undefined;
      if (existing) {
        updateVideo.run(
          title,
          clip.mime || "video/mp4",
          sizeBytes,
          durationMs,
          isGlobal ? null : villageId,
          channelId,
          existing.id
        );
      } else {
        insertVideo.run(
          randomUUID(),
          title,
          filename,
          clip.mime || "video/mp4",
          sizeBytes,
          durationMs,
          uploaderId,
          isGlobal ? null : villageId,
          channelId
        );
      }
      touched.add(channelId);
      restored += 1;
    }
  });

  sync(file.clips);

  // Seed / heal shuffle order so newly restored clips join the lineup.
  for (const channelId of touched) {
    const row = db
      .prepare(
        `SELECT schedule_epoch_ms, schedule_order_json FROM tv_channels WHERE id = ?`
      )
      .get(channelId) as
      | { schedule_epoch_ms: number | null; schedule_order_json: string | null }
      | undefined;
    const ids = (
      db
        .prepare(
          `SELECT id FROM tv_videos WHERE channel_id = ? ORDER BY created_at ASC`
        )
        .all(channelId) as Array<{ id: string }>
    ).map((v) => v.id);
    if (ids.length === 0) continue;
    let order: string[] = [];
    try {
      const parsed = JSON.parse(row?.schedule_order_json || "[]");
      if (Array.isArray(parsed)) {
        order = parsed.filter(
          (id): id is string => typeof id === "string" && ids.includes(id)
        );
      }
    } catch {
      order = [];
    }
    const missing = ids.filter((id) => !order.includes(id));
    if (order.length === 0 || !row?.schedule_epoch_ms) {
      db.prepare(
        `UPDATE tv_channels
         SET schedule_epoch_ms = ?, schedule_order_json = ?
         WHERE id = ?`
      ).run(Date.now(), JSON.stringify(shuffleIds(ids)), channelId);
    } else if (missing.length > 0) {
      db.prepare(
        `UPDATE tv_channels SET schedule_order_json = ? WHERE id = ?`
      ).run(JSON.stringify([...order, ...missing]), channelId);
    }
  }

  if (skippedMissing > 0) {
    console.warn(
      `[persistent-tv-media] restored ${restored} clip(s); skipped ${skippedMissing} missing upload file(s)`
    );
  } else if (restored > 0) {
    console.info(`[persistent-tv-media] restored ${restored} uploaded clip(s)`);
  }

  ensureSharedTvChannelsGlobal(db);
}
