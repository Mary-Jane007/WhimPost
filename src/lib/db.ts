import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { importPersistentAccounts } from "@/lib/persistentAccounts";

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
  ensureColumn(
    db,
    "users",
    "notifications_json",
    "notifications_json TEXT NOT NULL DEFAULT '{}'"
  );
  ensureColumn(db, "letters", "image_url", "image_url TEXT");
  ensureColumn(db, "letters", "image_json", "image_json TEXT");
  ensureColumn(
    db,
    "letters",
    "font_style",
    "font_style TEXT NOT NULL DEFAULT 'quill'"
  );

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

    CREATE TABLE IF NOT EXISTS tv_videos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      filename TEXT NOT NULL UNIQUE,
      mime TEXT NOT NULL,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      uploader_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      village_id TEXT,
      channel_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_tv_videos_village
      ON tv_videos(village_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_tv_videos_uploader
      ON tv_videos(uploader_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_tv_videos_channel
      ON tv_videos(channel_id, created_at);

    CREATE TABLE IF NOT EXISTS tv_channels (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      village_id TEXT NOT NULL,
      created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      is_global INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_tv_channels_village
      ON tv_channels(village_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_tv_channels_global
      ON tv_channels(is_global, created_at);

    CREATE TABLE IF NOT EXISTS tv_rooms (
      id TEXT PRIMARY KEY,
      scope TEXT NOT NULL CHECK(scope IN ('village', 'friends')),
      village_id TEXT,
      host_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT 'Watch party',
      current_channel_id TEXT,
      current_video_id TEXT REFERENCES tv_videos(id) ON DELETE SET NULL,
      is_playing INTEGER NOT NULL DEFAULT 0,
      position_ms INTEGER NOT NULL DEFAULT 0,
      position_updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_tv_rooms_scope
      ON tv_rooms(scope, village_id, updated_at);

    CREATE TABLE IF NOT EXISTS tv_presence (
      room_id TEXT NOT NULL REFERENCES tv_rooms(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (room_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_tv_presence_seen
      ON tv_presence(room_id, last_seen_at);

    CREATE TABLE IF NOT EXISTS tv_chat_messages (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL REFERENCES tv_rooms(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_tv_chat_room
      ON tv_chat_messages(room_id, created_at);

    CREATE TABLE IF NOT EXISTS workshop_progress (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      xp INTEGER NOT NULL DEFAULT 0,
      badges_json TEXT NOT NULL DEFAULT '[]',
      completed_json TEXT NOT NULL DEFAULT '{}',
      photos_json TEXT NOT NULL DEFAULT '{}',
      quest_json TEXT NOT NULL DEFAULT '{}',
      quest_photos_json TEXT NOT NULL DEFAULT '{}',
      plant_id TEXT,
      plant_weeks_json TEXT NOT NULL DEFAULT '{}',
      birds_json TEXT NOT NULL DEFAULT '{}',
      broadcast_json TEXT NOT NULL DEFAULT '{}',
      seasonal_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workshop_journal (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_type TEXT NOT NULL,
      activity_id TEXT NOT NULL,
      activity_name TEXT NOT NULL,
      photo_url TEXT,
      xp_earned INTEGER NOT NULL DEFAULT 0,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_workshop_journal_user
      ON workshop_journal(user_id, created_at);

    CREATE TABLE IF NOT EXISTS library_progress (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      xp INTEGER NOT NULL DEFAULT 0,
      badges_json TEXT NOT NULL DEFAULT '[]',
      stamps_json TEXT NOT NULL DEFAULT '[]',
      book_progress_json TEXT NOT NULL DEFAULT '{}',
      finished_json TEXT NOT NULL DEFAULT '{}',
      wishlist_json TEXT NOT NULL DEFAULT '{}',
      reading_status_json TEXT NOT NULL DEFAULT '{}',
      curiosity_json TEXT NOT NULL DEFAULT '{}',
      mystery_json TEXT NOT NULL DEFAULT '{}',
      challenges_json TEXT NOT NULL DEFAULT '{}',
      archives_json TEXT NOT NULL DEFAULT '{}',
      collections_json TEXT NOT NULL DEFAULT '{}',
      secrets_json TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS library_journal (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_type TEXT NOT NULL,
      activity_id TEXT NOT NULL,
      activity_name TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      quote TEXT NOT NULL DEFAULT '',
      photo_url TEXT,
      xp_earned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_library_journal_user
      ON library_journal(user_id, created_at);

    CREATE TABLE IF NOT EXISTS library_thoughts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      prompt_id TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_library_thoughts_prompt
      ON library_thoughts(prompt_id, created_at);

    CREATE TABLE IF NOT EXISTS garden_progress (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      xp INTEGER NOT NULL DEFAULT 0,
      badges_json TEXT NOT NULL DEFAULT '[]',
      decorations_json TEXT NOT NULL DEFAULT '[]',
      blooms INTEGER NOT NULL DEFAULT 1,
      daily_json TEXT NOT NULL DEFAULT '{}',
      spotted_json TEXT NOT NULL DEFAULT '{}',
      kindness_json TEXT NOT NULL DEFAULT '{}',
      rare_json TEXT NOT NULL DEFAULT '[]',
      visitors_json TEXT NOT NULL DEFAULT '{}',
      collections_json TEXT NOT NULL DEFAULT '{}',
      wish_id TEXT,
      wish_week INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS garden_journal (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_type TEXT NOT NULL,
      activity_id TEXT NOT NULL,
      activity_name TEXT NOT NULL,
      flower TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      mood TEXT NOT NULL DEFAULT '',
      photo_url TEXT,
      xp_earned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_garden_journal_user
      ON garden_journal(user_id, created_at);

    CREATE TABLE IF NOT EXISTS garden_wishes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      gestures_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_garden_wishes_created
      ON garden_wishes(created_at);

    CREATE TABLE IF NOT EXISTS garden_petals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      prompt_id TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_garden_petals_prompt
      ON garden_petals(prompt_id, created_at);

    CREATE TABLE IF NOT EXISTS hearth_progress (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      xp INTEGER NOT NULL DEFAULT 0,
      badges_json TEXT NOT NULL DEFAULT '[]',
      rituals_json TEXT NOT NULL DEFAULT '{}',
      favorite_recipes_json TEXT NOT NULL DEFAULT '{}',
      kindling_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS hearth_notes (
      id TEXT PRIMARY KEY,
      body TEXT NOT NULL,
      author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      favorite_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_hearth_notes_created
      ON hearth_notes(created_at);

    CREATE TABLE IF NOT EXISTS moon_progress (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      xp INTEGER NOT NULL DEFAULT 0,
      badges_json TEXT NOT NULL DEFAULT '[]',
      rituals_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS moon_dreams (
      id TEXT PRIMARY KEY,
      body TEXT NOT NULL,
      theme TEXT NOT NULL,
      author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_moon_dreams_theme
      ON moon_dreams(theme, created_at);

    CREATE TABLE IF NOT EXISTS moon_journal (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      prompt_id TEXT NOT NULL,
      prompt TEXT NOT NULL,
      body TEXT NOT NULL,
      day_key INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_moon_journal_user
      ON moon_journal(user_id, created_at);

    CREATE TABLE IF NOT EXISTS moon_playlist_sounds (
      playlist_id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL DEFAULT '',
      uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_moon_playlist_sounds_filename
      ON moon_playlist_sounds(filename);

    CREATE TABLE IF NOT EXISTS chronicle_pages (
      id TEXT PRIMARY KEY,
      village_id TEXT NOT NULL,
      page_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      illustration_url TEXT NOT NULL DEFAULT '',
      unlock_key TEXT NOT NULL,
      unlock_count INTEGER NOT NULL DEFAULT 1,
      published INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(village_id, page_number)
    );
    CREATE INDEX IF NOT EXISTS idx_chronicle_pages_village
      ON chronicle_pages(village_id, page_number);

    CREATE TABLE IF NOT EXISTS chronicle_progress (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      village_id TEXT NOT NULL,
      unlocked_json TEXT NOT NULL DEFAULT '{}',
      activity_json TEXT NOT NULL DEFAULT '{}',
      completed INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, village_id)
    );

    CREATE TABLE IF NOT EXISTS garden_community (
      id TEXT PRIMARY KEY,
      blooms INTEGER NOT NULL DEFAULT 0,
      kindness INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Column backfills must run after CREATE TABLE so fresh DBs don't fail.
  ensureColumn(db, "tv_videos", "channel_id", "channel_id TEXT");
  ensureColumn(
    db,
    "tv_videos",
    "duration_ms",
    "duration_ms INTEGER NOT NULL DEFAULT 0"
  );
  ensureColumn(db, "tv_videos", "source_url", "source_url TEXT");
  ensureColumn(db, "tv_rooms", "current_channel_id", "current_channel_id TEXT");
  ensureColumn(
    db,
    "tv_channels",
    "schedule_epoch_ms",
    "schedule_epoch_ms INTEGER"
  );
  ensureColumn(
    db,
    "tv_channels",
    "schedule_order_json",
    "schedule_order_json TEXT"
  );
  ensureColumn(
    db,
    "tv_channels",
    "is_global",
    "is_global INTEGER NOT NULL DEFAULT 0"
  );
  ensureColumn(db, "village_notes", "image_url", "image_url TEXT");
  ensureColumn(
    db,
    "workshop_journal",
    "shared",
    "shared INTEGER NOT NULL DEFAULT 0"
  );

  // Fold any pre-channel clips into a village channel so the dial stays usable.
  const orphans = db
    .prepare(
      `SELECT id, title, village_id, uploader_id
       FROM tv_videos
       WHERE channel_id IS NULL AND village_id IS NOT NULL`
    )
    .all() as Array<{
    id: string;
    title: string;
    village_id: string;
    uploader_id: string;
  }>;

  for (const video of orphans) {
    const channelId = randomUUID();
    db.prepare(
      `INSERT INTO tv_channels (id, title, village_id, created_by)
       VALUES (?, ?, ?, ?)`
    ).run(
      channelId,
      video.title.slice(0, 80) || "Village channel",
      video.village_id,
      video.uploader_id
    );
    db.prepare(`UPDATE tv_videos SET channel_id = ? WHERE id = ?`).run(
      channelId,
      video.id
    );
  }
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
      notifications_json TEXT NOT NULL DEFAULT '{}',
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
      font_style TEXT NOT NULL DEFAULT 'quill',
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
  // Restore accounts saved in git so logins work on fresh servers.
  importPersistentAccounts(db);
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
