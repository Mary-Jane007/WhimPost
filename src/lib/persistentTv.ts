import type { Database } from "better-sqlite3";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { parseTvLink } from "@/lib/tvLinks";

/** Git-tracked TV catalog (YouTube / direct links) so channels survive fresh servers. */
export const PERSISTENT_TV_PATH = path.join(
  process.cwd(),
  "data",
  "persistent-tv.json"
);

export type PersistentTvVideo = {
  title: string;
  sourceUrl: string;
  durationMs?: number;
};

export type PersistentTvChannel = {
  title: string;
  villageId: string;
  isGlobal?: boolean;
  videos: PersistentTvVideo[];
};

type PersistentTvFile = {
  version: 1;
  updatedAt: string;
  channels: PersistentTvChannel[];
};

function readFile(): PersistentTvFile | null {
  try {
    if (!fs.existsSync(PERSISTENT_TV_PATH)) return null;
    const raw = fs.readFileSync(PERSISTENT_TV_PATH, "utf8");
    if (!raw.trim()) return null;
    const parsed = JSON.parse(raw) as PersistentTvFile;
    if (!parsed || !Array.isArray(parsed.channels)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeFile(channels: PersistentTvChannel[]) {
  const dir = path.dirname(PERSISTENT_TV_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const payload: PersistentTvFile = {
    version: 1,
    updatedAt: new Date().toISOString(),
    channels: channels
      .map((ch) => ({
        ...ch,
        title: ch.title.trim(),
        videos: ch.videos.filter((v) => Boolean(v.sourceUrl?.trim())),
      }))
      .filter((ch) => ch.title && ch.videos.length > 0)
      .sort((a, b) => a.title.localeCompare(b.title)),
  };

  const tmp = `${PERSISTENT_TV_PATH}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.renameSync(tmp, PERSISTENT_TV_PATH);
}

/**
 * Snapshot link-based TV clips (not uploaded files — those stay local-only).
 * Keeps the cozy shelf alive across fresh cloud environments.
 */
export function exportPersistentTv(db: Database) {
  const channels = db
    .prepare(
      `SELECT id, title, village_id, is_global
       FROM tv_channels
       ORDER BY is_global DESC, title COLLATE NOCASE`
    )
    .all() as Array<{
    id: string;
    title: string;
    village_id: string;
    is_global: number;
  }>;

  const videoStmt = db.prepare(
    `SELECT title, source_url, duration_ms
     FROM tv_videos
     WHERE channel_id = ?
       AND source_url IS NOT NULL
       AND trim(source_url) != ''
     ORDER BY created_at ASC`
  );

  const snapshot: PersistentTvChannel[] = [];
  for (const ch of channels) {
    const videos = (
      videoStmt.all(ch.id) as Array<{
        title: string;
        source_url: string;
        duration_ms: number;
      }>
    ).map((v) => ({
      title: v.title,
      sourceUrl: v.source_url,
      durationMs: v.duration_ms > 0 ? v.duration_ms : undefined,
    }));
    if (videos.length === 0) continue;
    snapshot.push({
      title: ch.title,
      villageId: ch.village_id || "mosshollow",
      isGlobal: Boolean(ch.is_global),
      videos,
    });
  }

  writeFile(snapshot);
}

/**
 * Restore link-based channels/clips from the git-tracked catalog.
 * Skips duplicates matched by source_url. Creates channels when missing.
 */
export function importPersistentTv(db: Database) {
  const file = readFile();
  if (!file || file.channels.length === 0) return;

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
  const findVideoByUrl = db.prepare(
    `SELECT id FROM tv_videos WHERE source_url = ? LIMIT 1`
  );
  const insertVideo = db.prepare(
    `INSERT INTO tv_videos
      (id, title, filename, mime, size_bytes, duration_ms, uploader_id, village_id, channel_id, source_url)
     VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`
  );
  const updateVideo = db.prepare(
    `UPDATE tv_videos
     SET title = ?, duration_ms = ?, channel_id = ?
     WHERE id = ?`
  );

  const sync = db.transaction((channels: PersistentTvChannel[]) => {
    for (const channel of channels) {
      const title = String(channel.title || "").trim().slice(0, 80);
      if (!title || !Array.isArray(channel.videos) || channel.videos.length === 0) {
        continue;
      }

      const villageId = String(channel.villageId || "mosshollow").trim() || "mosshollow";
      const isGlobal =
        Boolean(channel.isGlobal) ||
        title.toLowerCase() === "cottage cartoons";

      let channelId = (findChannel.get(title) as { id: string } | undefined)?.id;
      if (!channelId) {
        channelId = randomUUID();
        insertChannel.run(
          channelId,
          title,
          villageId,
          uploaderId,
          isGlobal ? 1 : 0
        );
      } else if (isGlobal) {
        db.prepare(`UPDATE tv_channels SET is_global = 1 WHERE id = ?`).run(
          channelId
        );
      }

      for (const clip of channel.videos) {
        const sourceUrl = String(clip.sourceUrl || "").trim();
        if (!sourceUrl) continue;

        const parsed = parseTvLink(sourceUrl);
        if (!parsed.ok) continue;

        const durationMs =
          clip.durationMs && clip.durationMs > 0
            ? Math.floor(clip.durationMs)
            : 45 * 60 * 1000;
        const clipTitle =
          String(clip.title || "").trim().slice(0, 80) ||
          parsed.titleHint.slice(0, 80) ||
          "Linked clip";

        const existing = findVideoByUrl.get(sourceUrl) as
          | { id: string }
          | undefined;
        if (existing) {
          updateVideo.run(clipTitle, durationMs, channelId, existing.id);
          continue;
        }

        insertVideo.run(
          randomUUID(),
          clipTitle,
          `link-${randomUUID()}`,
          parsed.mime,
          durationMs,
          uploaderId,
          isGlobal ? null : villageId,
          channelId,
          parsed.sourceUrl
        );
      }
    }
  });

  sync(file.channels);

  // Refresh airtime epoch so restored shelves start a clean loop from now.
  for (const channel of file.channels) {
    const title = String(channel.title || "").trim();
    if (!title) continue;
    const row = findChannel.get(title) as { id: string } | undefined;
    if (!row) continue;
    const ids = (
      db
        .prepare(
          `SELECT id FROM tv_videos WHERE channel_id = ? ORDER BY created_at ASC`
        )
        .all(row.id) as Array<{ id: string }>
    ).map((v) => v.id);
    if (ids.length === 0) continue;
    db.prepare(
      `UPDATE tv_channels
       SET schedule_epoch_ms = ?, schedule_order_json = ?
       WHERE id = ?`
    ).run(Date.now(), JSON.stringify(ids), row.id);
  }
}
