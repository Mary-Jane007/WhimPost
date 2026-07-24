#!/usr/bin/env node
/**
 * Refresh git-tracked TV catalogs from the local SQLite DB.
 * Run after uploading clips, then commit data/uploads + catalogs.
 */
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const root = process.cwd();
const dbPath = path.join(root, "data", "whimpost.db");
const uploadDir = path.join(root, "data", "uploads");
const linksPath = path.join(root, "data", "persistent-tv.json");
const mediaPath = path.join(root, "data", "persistent-tv-media.json");

if (!fs.existsSync(dbPath)) {
  console.error("No data/whimpost.db yet — start the app once first.");
  process.exit(1);
}

const db = new Database(dbPath, { readonly: true });

const channels = db
  .prepare(
    `SELECT id, title, village_id, is_global FROM tv_channels ORDER BY title COLLATE NOCASE`
  )
  .all();

const linkChannels = [];
for (const ch of channels) {
  const videos = db
    .prepare(
      `SELECT title, source_url, duration_ms FROM tv_videos
       WHERE channel_id = ? AND source_url IS NOT NULL AND trim(source_url) != ''
       ORDER BY created_at ASC`
    )
    .all(ch.id)
    .map((v) => ({
      title: v.title,
      sourceUrl: v.source_url,
      durationMs: v.duration_ms > 0 ? v.duration_ms : undefined,
    }));
  if (!videos.length) continue;
  linkChannels.push({
    title: ch.title,
    villageId: ch.village_id || "mosshollow",
    isGlobal: Boolean(ch.is_global),
    videos,
  });
}

fs.writeFileSync(
  linksPath,
  `${JSON.stringify(
    { version: 1, updatedAt: new Date().toISOString(), channels: linkChannels },
    null,
    2
  )}\n`
);

const mediaClips = [];
for (const ch of channels) {
  const rows = db
    .prepare(
      `SELECT title, filename, mime, size_bytes, duration_ms, village_id
       FROM tv_videos
       WHERE channel_id = ?
         AND (source_url IS NULL OR trim(source_url) = '')
       ORDER BY created_at ASC`
    )
    .all(ch.id);
  for (const row of rows) {
    if (String(row.filename).startsWith("link-")) continue;
    const filePath = path.join(uploadDir, row.filename);
    if (!fs.existsSync(filePath)) continue;
    mediaClips.push({
      title: row.title,
      filename: row.filename,
      mime: row.mime || "video/mp4",
      sizeBytes: row.size_bytes || 0,
      durationMs: row.duration_ms > 0 ? row.duration_ms : undefined,
      channelTitle: ch.title,
      villageId: row.village_id,
      isGlobal: Boolean(ch.is_global),
    });
  }
}

fs.writeFileSync(
  mediaPath,
  `${JSON.stringify(
    { version: 1, updatedAt: new Date().toISOString(), clips: mediaClips },
    null,
    2
  )}\n`
);

db.close();
console.log(
  `Wrote ${linkChannels.reduce((n, c) => n + c.videos.length, 0)} link clip(s) → data/persistent-tv.json`
);
console.log(
  `Wrote ${mediaClips.length} file clip(s) → data/persistent-tv-media.json`
);
console.log(
  "Next: git add data/uploads data/persistent-tv.json data/persistent-tv-media.json && git commit && git push"
);
