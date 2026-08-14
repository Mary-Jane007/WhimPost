import type { Database } from "better-sqlite3";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { UPLOAD_DIR } from "@/lib/uploadPaths";
import { PERSISTENT_TV_MEDIA_PATH } from "@/lib/tvMediaPaths";

/**
 * Git-tracked catalog of uploaded TV files (metadata only).
 */
export { PERSISTENT_TV_MEDIA_PATH } from "@/lib/tvMediaPaths";

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

/** Channels that should always play in every village lounge. */
export function isSharedTvChannelTitle(title: string) {
  return title.trim().toLowerCase() === "cottage cartoons";
}

/**
 * Promote shared channels (Cottage Cartoons) to every-village and clear
 * village locks on their clips so all lounges can tune in.
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

  const clips: PersistentTvMediaClip[] = [];
  for (const row of rows) {
    if (row.filename.startsWith("link-")) continue;
    const filePath = path.join(UPLOAD_DIR, row.filename);
    if (!fs.existsSync(filePath)) continue;
    clips.push({
      title: row.title,
      filename: row.filename,
      mime: row.mime || "video/mp4",
      sizeBytes: row.size_bytes || 0,
      durationMs: row.duration_ms > 0 ? row.duration_ms : undefined,
      channelTitle: row.channel_title || "Clip shelf",
      villageId: row.village_id,
      isGlobal: Boolean(row.is_global),
    });
  }

  writeFile(clips);
}

/** Restore uploaded clips into owner channels (and seed shuffle schedules). */
export function importPersistentTvMedia(db: Database) {
  const file = readFile();
  if (!file || file.clips.length === 0) return;

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

      const filePath = path.join(UPLOAD_DIR, filename);
      if (!fs.existsSync(filePath)) {
        skippedMissing += 1;
        continue;
      }

      const sizeBytes =
        clip.sizeBytes > 0 ? clip.sizeBytes : fs.statSync(filePath).size;
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

  // Seed a shuffle order for each restored channel if empty.
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
    const hasOrder =
      Boolean(row?.schedule_order_json) &&
      Array.isArray(
        (() => {
          try {
            return JSON.parse(row?.schedule_order_json || "[]");
          } catch {
            return null;
          }
        })()
      ) &&
      (JSON.parse(row?.schedule_order_json || "[]") as unknown[]).length > 0;
    if (!hasOrder || !row?.schedule_epoch_ms) {
      db.prepare(
        `UPDATE tv_channels
         SET schedule_epoch_ms = ?, schedule_order_json = ?
         WHERE id = ?`
      ).run(Date.now(), JSON.stringify(shuffleIds(ids)), channelId);
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
