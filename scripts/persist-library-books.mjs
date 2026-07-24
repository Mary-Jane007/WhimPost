#!/usr/bin/env node
/**
 * Refresh git-tracked library book catalog from the local SQLite DB.
 * Run after owner uploads, then commit data/uploads + the catalog.
 */
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(root, "data", "whimpost.db");
const catalogPath = path.join(root, "data", "persistent-library-books.json");
const uploadDir = path.join(root, "data", "uploads");

if (!fs.existsSync(dbPath)) {
  console.error("No data/whimpost.db yet — start the app once first.");
  process.exit(1);
}

const db = new Database(dbPath, { readonly: true });
const rows = db
  .prepare(
    `SELECT id, shelf, title, author, description, minutes, cover_emoji AS coverEmoji,
            cover_url AS coverUrl, file_url AS fileUrl, file_name AS fileName,
            file_mime AS fileMime, quotes_json AS quotesJson,
            reflections_json AS reflectionsJson, category, difficulty, length,
            mood, themes_json AS themesJson, rating, published
     FROM library_books
     ORDER BY shelf ASC, created_at ASC`
  )
  .all();

const books = rows
  .filter((row) => {
    if (!row.fileUrl) return true;
    const match = /\/api\/uploads\/([a-f0-9-]+\.[a-z0-9]+)$/i.exec(row.fileUrl);
    if (!match) return true;
    return fs.existsSync(path.join(uploadDir, match[1]));
  })
  .map((row) => ({ ...row, published: Boolean(row.published) }))
  .sort((a, b) =>
    `${a.shelf}:${a.title}`.localeCompare(`${b.shelf}:${b.title}`)
  );

fs.writeFileSync(
  catalogPath,
  `${JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), books }, null, 2)}\n`,
  "utf8"
);
console.log(`Wrote ${catalogPath} (${books.length} books).`);
db.close();
