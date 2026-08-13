#!/usr/bin/env node
/**
 * Reshuffle every TV channel lineup and reset the wall-clock epoch to now.
 * New video uploads also reshuffle automatically via addVideoToChannelSchedule.
 */
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const root = process.cwd();
const dbPath = path.join(root, "data", "whimpost.db");

if (!fs.existsSync(dbPath)) {
  console.error("No data/whimpost.db yet — start the app once first.");
  process.exit(1);
}

function shuffleIds(ids) {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

const db = new Database(dbPath);
const channels = db.prepare(`SELECT id, title FROM tv_channels`).all();
const now = Date.now();
let clips = 0;

const update = db.prepare(
  `UPDATE tv_channels
   SET schedule_epoch_ms = ?, schedule_order_json = ?
   WHERE id = ?`
);

for (const ch of channels) {
  const videos = db
    .prepare(
      `SELECT id FROM tv_videos
       WHERE channel_id = ?
         AND lower(coalesce(mime, '')) != 'video/youtube'
         AND (
           source_url IS NULL
           OR trim(source_url) = ''
           OR (
             lower(source_url) NOT LIKE '%youtube.com%'
             AND lower(source_url) NOT LIKE '%youtu.be%'
           )
         )
       ORDER BY created_at ASC`
    )
    .all(ch.id);
  const order = shuffleIds(videos.map((v) => v.id));
  update.run(now, JSON.stringify(order), ch.id);
  clips += order.length;
  console.log(`  ${ch.title}: ${order.length} clip(s)`);
}

db.close();
console.log(
  `Reshuffled ${channels.length} channel(s), ${clips} clip(s). Epoch = ${new Date(now).toISOString()}`
);
