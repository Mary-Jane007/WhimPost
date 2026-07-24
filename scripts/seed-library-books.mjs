#!/usr/bin/env node
/**
 * Copy public-domain EPUBs into data/uploads and register them on the library shelves
 * (matching existing catalog ids so covers/files overlay the hardcoded entries).
 *
 * Usage: node scripts/seed-library-books.mjs
 * Optional: LIBRARY_SEED_DIR=/path/to/epubs node scripts/seed-library-books.mjs
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const uploadsDir = join(root, "data", "uploads");
const dbPath = join(root, "data", "whimpost.db");
const catalogPath = join(root, "data", "persistent-library-books.json");
const seedDir = process.env.LIBRARY_SEED_DIR || "/tmp/books";

const BOOKS = [
  {
    id: "secret-garden",
    shelf: "club",
    title: "The Secret Garden",
    author: "Frances Hodgson Burnett",
    description:
      "A neglected garden awakens with a lonely girl, a boy who speaks to earth, and the quiet miracle of tending what was forgotten.",
    minutes: 280,
    coverEmoji: "🌹",
    quotes: [
      "If you look the right way, you can see that the whole world is a garden.",
      "Where you tend a rose, my lad, a thistle cannot grow.",
    ],
    reflections: [
      "What neglected corner of your life could use a little care?",
      "Who helped you rediscover wonder?",
    ],
    sourceFile: "secret-garden.epub",
  },
  {
    id: "anne",
    shelf: "club",
    title: "Anne of Green Gables",
    author: "L.M. Montgomery",
    description:
      "Orphan Anne Shirley arrives with an imagination large enough for Avonlea — and a red-haired insistence that beauty belongs everywhere.",
    minutes: 320,
    coverEmoji: "🍒",
    quotes: [
      "Dear old world, you are very lovely, and I am glad to be alive in you.",
      "Kindred spirits are not so scarce as I used to think.",
    ],
    reflections: [
      "What place first felt like home because of imagination?",
      "Who is your kindred spirit?",
    ],
    sourceFile: "anne.epub",
  },
  {
    id: "rl-alice",
    shelf: "readinglist",
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    description:
      "A curious tumble down the rabbit hole into riddles, tea, and impossible manners.",
    minutes: 160,
    coverEmoji: "🐇",
    category: "Classic Literature",
    difficulty: "Gentle",
    length: "Short",
    mood: "Whimsical",
    themes: ["curiosity", "nonsense", "adventure"],
    rating: 4.8,
    sourceFile: "alice.epub",
  },
];

mkdirSync(uploadsDir, { recursive: true });

if (!existsSync(dbPath)) {
  console.error(`Database not found at ${dbPath}. Start the app once first.`);
  process.exit(1);
}

const db = new Database(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS library_books (
    id TEXT PRIMARY KEY,
    shelf TEXT NOT NULL CHECK(shelf IN ('club', 'readinglist')),
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    minutes INTEGER NOT NULL DEFAULT 120,
    cover_emoji TEXT NOT NULL DEFAULT '📖',
    cover_url TEXT,
    file_url TEXT,
    file_name TEXT,
    file_mime TEXT,
    quotes_json TEXT NOT NULL DEFAULT '[]',
    reflections_json TEXT NOT NULL DEFAULT '[]',
    category TEXT,
    difficulty TEXT,
    length TEXT,
    mood TEXT NOT NULL DEFAULT '',
    themes_json TEXT NOT NULL DEFAULT '[]',
    rating REAL NOT NULL DEFAULT 4.5,
    published INTEGER NOT NULL DEFAULT 1,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const owner =
  db
    .prepare(
      `SELECT id FROM users WHERE is_owner = 1
       ORDER BY CASE WHEN username = 'Mary_Jane' THEN 0 ELSE 1 END, created_at ASC
       LIMIT 1`
    )
    .get() || db.prepare(`SELECT id FROM users ORDER BY created_at ASC LIMIT 1`).get();

const upsert = db.prepare(`
  INSERT INTO library_books (
    id, shelf, title, author, description, minutes, cover_emoji, cover_url,
    file_url, file_name, file_mime, quotes_json, reflections_json, category,
    difficulty, length, mood, themes_json, rating, published, created_by
  ) VALUES (
    @id, @shelf, @title, @author, @description, @minutes, @cover_emoji, NULL,
    @file_url, @file_name, @file_mime, @quotes_json, @reflections_json, @category,
    @difficulty, @length, @mood, @themes_json, @rating, 1, @created_by
  )
  ON CONFLICT(id) DO UPDATE SET
    shelf = excluded.shelf,
    title = excluded.title,
    author = excluded.author,
    description = excluded.description,
    minutes = excluded.minutes,
    cover_emoji = excluded.cover_emoji,
    file_url = excluded.file_url,
    file_name = excluded.file_name,
    file_mime = excluded.file_mime,
    quotes_json = excluded.quotes_json,
    reflections_json = excluded.reflections_json,
    category = excluded.category,
    difficulty = excluded.difficulty,
    length = excluded.length,
    mood = excluded.mood,
    themes_json = excluded.themes_json,
    rating = excluded.rating,
    published = 1
`);

let seeded = 0;

for (const book of BOOKS) {
  const source = join(seedDir, book.sourceFile);
  if (!existsSync(source)) {
    console.warn(`Skip ${book.title}: missing ${source}`);
    continue;
  }

  const existing = db
    .prepare(`SELECT file_url FROM library_books WHERE id = ?`)
    .get(book.id);
  let storedName = null;
  if (existing?.file_url) {
    const match = /\/api\/uploads\/([a-f0-9-]+\.epub)$/i.exec(existing.file_url);
    if (match && existsSync(join(uploadsDir, match[1]))) {
      storedName = match[1];
    }
  }
  if (!storedName) storedName = `${randomUUID()}.epub`;

  copyFileSync(source, join(uploadsDir, storedName));
  upsert.run({
    id: book.id,
    shelf: book.shelf,
    title: book.title,
    author: book.author,
    description: book.description,
    minutes: book.minutes || 120,
    cover_emoji: book.coverEmoji || "📖",
    file_url: `/api/uploads/${storedName}`,
    file_name: book.sourceFile,
    file_mime: "application/epub+zip",
    quotes_json: JSON.stringify(book.quotes || []),
    reflections_json: JSON.stringify(book.reflections || []),
    category: book.category || null,
    difficulty: book.difficulty || null,
    length: book.length || null,
    mood: book.mood || "",
    themes_json: JSON.stringify(book.themes || []),
    rating: book.rating || 4.5,
    created_by: owner?.id || null,
  });
  console.log(`Shelved ${book.title} → ${storedName}`);
  seeded += 1;
}

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
  .all()
  .map((row) => ({
    ...row,
    published: Boolean(row.published),
  }));

writeFileSync(
  catalogPath,
  `${JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), books: rows }, null, 2)}\n`,
  "utf8"
);
console.log(`Wrote ${catalogPath} (${rows.length} books). Seeded ${seeded} from ${seedDir}.`);
db.close();
