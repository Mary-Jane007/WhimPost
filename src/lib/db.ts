import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "whimpost.db");

const globalForDb = globalThis as unknown as { whimpostDb?: Database.Database };

function ensureColumn(
  db: Database.Database,
  table: string,
  column: string,
  ddl: string
) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
  }>;
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

function migrate(db: Database.Database) {
  ensureColumn(db, "users", "is_owner", "is_owner INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "users", "village_id", "village_id TEXT");
  ensureColumn(db, "users", "reputation", "reputation INTEGER NOT NULL DEFAULT 0");
  ensureColumn(
    db,
    "users",
    "collectibles_json",
    "collectibles_json TEXT NOT NULL DEFAULT '{}'"
  );
  ensureColumn(db, "letters", "image_url", "image_url TEXT");
  ensureColumn(db, "letters", "image_json", "image_json TEXT");

  db.exec(`
    CREATE TABLE IF NOT EXISTS village_notes (
      id TEXT PRIMARY KEY,
      village_id TEXT NOT NULL,
      author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      anonymous INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_users_village ON users(village_id);
    CREATE INDEX IF NOT EXISTS idx_village_notes ON village_notes(village_id, created_at);

    CREATE TABLE IF NOT EXISTS welcome_letter_templates (
      village_id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
    );
  `);
}

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
      village_id TEXT,
      reputation INTEGER NOT NULL DEFAULT 0,
      collectibles_json TEXT NOT NULL DEFAULT '{}',
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
      stamp_style TEXT NOT NULL DEFAULT 'mushroom-amanita',
      stickers_json TEXT NOT NULL DEFAULT '[]',
      scrap_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL CHECK(status IN ('draft', 'sent')) DEFAULT 'sent',
      is_read INTEGER NOT NULL DEFAULT 0,
      image_url TEXT,
      image_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      sent_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_letters_recipient ON letters(recipient_id, sent_at);
    CREATE INDEX IF NOT EXISTS idx_letters_sender ON letters(sender_id, sent_at);
    CREATE INDEX IF NOT EXISTS idx_friendships_users ON friendships(requester_id, addressee_id);
  `);

  migrate(db);
  return db;
}

export function getDb() {
  if (!globalForDb.whimpostDb) {
    globalForDb.whimpostDb = createDb();
  } else {
    // Keep existing connections current when schema grows.
    migrate(globalForDb.whimpostDb);
  }
  return globalForDb.whimpostDb;
}
