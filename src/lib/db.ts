import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "whimpost.db");

const globalForDb = globalThis as unknown as { whimpostDb?: Database.Database };

function createDb() {
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      display_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      bio TEXT DEFAULT '',
      forest_name TEXT DEFAULT '',
      is_owner INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS friendships (
      id TEXT PRIMARY KEY,
      requester_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      addressee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'declined')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(requester_id, addressee_id)
    );

    CREATE TABLE IF NOT EXISTS letters (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      paper_style TEXT NOT NULL DEFAULT 'parchment',
      envelope_style TEXT NOT NULL DEFAULT 'kraft',
      wax_seal TEXT NOT NULL DEFAULT 'fern',
      stamp_style TEXT NOT NULL DEFAULT 'mushroom',
      stickers_json TEXT NOT NULL DEFAULT '[]',
      scrap_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL CHECK(status IN ('draft', 'sent')) DEFAULT 'sent',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      sent_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_letters_recipient ON letters(recipient_id, sent_at);
    CREATE INDEX IF NOT EXISTS idx_letters_sender ON letters(sender_id, sent_at);
    CREATE INDEX IF NOT EXISTS idx_friendships_users ON friendships(requester_id, addressee_id);
  `);

  // Migrate older databases that predate the owner flag.
  const cols = db.prepare(`PRAGMA table_info(users)`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === "is_owner")) {
    db.exec(`ALTER TABLE users ADD COLUMN is_owner INTEGER NOT NULL DEFAULT 0`);
  }

  return db;
}

export function getDb() {
  if (!globalForDb.whimpostDb) {
    globalForDb.whimpostDb = createDb();
  }
  return globalForDb.whimpostDb;
}
