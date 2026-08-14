import type { Database } from "better-sqlite3";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

/**
 * Git-tracked catalog of uploaded TV files (metadata only).
 * Fresh-start TV Corner uses a flat clip shelf (no channels).
 */
export const PERSISTENT_TV_MEDIA_PATH = path.join(
  process.cwd(),
  "data",
  "persistent-tv-media.json"
);

export const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export type PersistentTvMediaClip = {
  title: string;
  filename: string;
  mime: string;
  sizeBytes: number;
  durationMs?: number;
  /** Kept for catalog compatibility; unused by the flat shelf UI. */
  channelTitle: string;
  villageId: string | null;
  isGlobal?: boolean;
};

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
      .filter((c) => c.filename && c.title)
      .sort((a, b) => a.title.localeCompare(b.title)),
  };

  const tmp = `${PERSISTENT_TV_MEDIA_PATH}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.renameSync(tmp, PERSISTENT_TV_MEDIA_PATH);
}

/** Snapshot uploaded (file) TV clips so fresh servers can restore them. */
export function exportPersistentTvMedia(db: Database) {
  const rows = db
    .prepare(
      `SELECT v.title, v.filename, v.mime, v.size_bytes, v.duration_ms,
              v.village_id
       FROM tv_videos v
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
      channelTitle: "Clip shelf",
      villageId: row.village_id,
      isGlobal: false,
    });
  }

  writeFile(clips);
}

/** Restore file-based TV clips onto the flat shelf when upload bytes exist. */
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

  const findByFilename = db.prepare(
    `SELECT id FROM tv_videos WHERE filename = ? LIMIT 1`
  );
  const insertVideo = db.prepare(
    `INSERT INTO tv_videos
      (id, title, filename, mime, size_bytes, duration_ms, uploader_id, village_id, channel_id, source_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`
  );
  const updateVideo = db.prepare(
    `UPDATE tv_videos
     SET title = ?, mime = ?, size_bytes = ?, duration_ms = ?, village_id = ?
     WHERE id = ?`
  );

  let restored = 0;
  let skippedMissing = 0;

  const sync = db.transaction((clips: PersistentTvMediaClip[]) => {
    for (const clip of clips) {
      const filename = String(clip.filename || "").trim();
      const title = String(clip.title || "").trim().slice(0, 80);
      if (!filename || !title) continue;
      if (filename.startsWith("link-") || filename.includes("..")) continue;

      const filePath = path.join(UPLOAD_DIR, filename);
      if (!fs.existsSync(filePath)) {
        skippedMissing += 1;
        continue;
      }

      const sizeBytes =
        clip.sizeBytes > 0 ? clip.sizeBytes : fs.statSync(filePath).size;
      const villageId = clip.villageId
        ? String(clip.villageId).trim() || null
        : null;
      const durationMs =
        clip.durationMs && clip.durationMs > 0
          ? Math.floor(clip.durationMs)
          : 0;
      const existing = findByFilename.get(filename) as
        | { id: string }
        | undefined;
      if (existing) {
        updateVideo.run(
          title,
          clip.mime || "video/mp4",
          sizeBytes,
          durationMs,
          villageId,
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
          villageId
        );
      }
      restored += 1;
    }
  });

  sync(file.clips);

  if (skippedMissing > 0) {
    console.warn(
      `[persistent-tv-media] restored ${restored} clip(s); skipped ${skippedMissing} missing upload file(s)`
    );
  } else if (restored > 0) {
    console.info(`[persistent-tv-media] restored ${restored} uploaded clip(s)`);
  }
}
