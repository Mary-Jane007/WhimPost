import type { Database } from "better-sqlite3";
import fs from "fs";
import path from "path";
import { CELESTIAL_PLAYLISTS } from "@/lib/moonContent";
import { MOON_SOUND_DIR } from "@/lib/moonPaths";

/**
 * Git-tracked catalog of owner-uploaded Celestial Sounds (Observatory).
 * Audio bytes live under data/uploads/moon-sounds/ and are mirrored to the
 * whimpost-media GitHub Release so they restore on any server.
 */
export const PERSISTENT_MOON_SOUNDS_PATH = path.join(
  process.cwd(),
  "data",
  "persistent-moon-sounds.json"
);

export type PersistentMoonSound = {
  playlistId: string;
  filename: string;
  originalName: string;
  sizeBytes?: number;
};

type PersistentMoonSoundsFile = {
  version: 1;
  updatedAt: string;
  sounds: PersistentMoonSound[];
};

function readFile(): PersistentMoonSoundsFile | null {
  try {
    if (!fs.existsSync(PERSISTENT_MOON_SOUNDS_PATH)) return null;
    const raw = fs.readFileSync(PERSISTENT_MOON_SOUNDS_PATH, "utf8");
    if (!raw.trim()) return null;
    const parsed = JSON.parse(raw) as PersistentMoonSoundsFile;
    if (!parsed || !Array.isArray(parsed.sounds)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeFile(sounds: PersistentMoonSound[]) {
  const dir = path.dirname(PERSISTENT_MOON_SOUNDS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const known = new Set(CELESTIAL_PLAYLISTS.map((p) => p.id));
  const payload: PersistentMoonSoundsFile = {
    version: 1,
    updatedAt: new Date().toISOString(),
    sounds: sounds
      .filter(
        (s) =>
          s.playlistId &&
          known.has(s.playlistId) &&
          s.filename &&
          !s.filename.includes("..") &&
          /^[a-f0-9-]+\.(mp3|wav|ogg|webm|m4a|aac)$/i.test(s.filename)
      )
      .sort((a, b) => a.playlistId.localeCompare(b.playlistId)),
  };

  const tmp = `${PERSISTENT_MOON_SOUNDS_PATH}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.renameSync(tmp, PERSISTENT_MOON_SOUNDS_PATH);
}

/** Release asset name for a moon sound file (flat — GitHub Releases have no folders). */
export function moonSoundReleaseName(filename: string) {
  return `moon-sounds--${path.basename(filename)}`;
}

export function moonSoundAbsolutePath(filename: string) {
  return path.join(MOON_SOUND_DIR, path.basename(filename));
}

/** Snapshot Celestial Sounds so fresh servers can restore with release bytes. */
export function exportPersistentMoonSounds(db: Database) {
  const rows = db
    .prepare(
      `SELECT playlist_id, filename, original_name
       FROM moon_playlist_sounds
       ORDER BY playlist_id ASC`
    )
    .all() as Array<{
    playlist_id: string;
    filename: string;
    original_name: string;
  }>;

  const sounds: PersistentMoonSound[] = [];
  for (const row of rows) {
    const filename = String(row.filename || "").trim();
    if (!filename) continue;
    const abs = moonSoundAbsolutePath(filename);
    if (!fs.existsSync(abs)) continue;
    let sizeBytes = 0;
    try {
      sizeBytes = fs.statSync(abs).size;
    } catch {
      sizeBytes = 0;
    }
    if (sizeBytes < 256) continue;
    sounds.push({
      playlistId: row.playlist_id,
      filename,
      originalName: row.original_name || filename,
      sizeBytes,
    });
  }

  writeFile(sounds);
  return sounds.length;
}

/**
 * Restore Celestial Sounds rows when the audio file is present
 * (from GitHub Release / prior upload).
 */
export function importPersistentMoonSounds(db: Database) {
  const file = readFile();
  if (!file || file.sounds.length === 0) return 0;

  const owner =
    (db
      .prepare(
        `SELECT id FROM users WHERE is_owner = 1
         ORDER BY CASE WHEN username = 'Mary_Jane' THEN 0 ELSE 1 END, created_at ASC
         LIMIT 1`
      )
      .get() as { id: string } | undefined) ||
    (db
      .prepare(`SELECT id FROM users ORDER BY created_at ASC LIMIT 1`)
      .get() as { id: string } | undefined);
  if (!owner) return 0;

  const known = new Set(CELESTIAL_PLAYLISTS.map((p) => p.id));
  const upsert = db.prepare(
    `INSERT INTO moon_playlist_sounds (playlist_id, filename, original_name, uploaded_by, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(playlist_id) DO UPDATE SET
       filename = excluded.filename,
       original_name = excluded.original_name,
       uploaded_by = excluded.uploaded_by,
       updated_at = datetime('now')`
  );

  let restored = 0;
  const tx = db.transaction(() => {
    for (const sound of file.sounds) {
      const playlistId = String(sound.playlistId || "").trim();
      const filename = String(sound.filename || "").trim();
      if (!playlistId || !known.has(playlistId) || !filename) continue;
      if (!/^[a-f0-9-]+\.(mp3|wav|ogg|webm|m4a|aac)$/i.test(filename)) continue;
      const abs = moonSoundAbsolutePath(filename);
      if (!fs.existsSync(abs)) continue;
      try {
        if (fs.statSync(abs).size < 256) continue;
      } catch {
        continue;
      }
      upsert.run(
        playlistId,
        filename,
        String(sound.originalName || filename).slice(0, 180),
        owner.id
      );
      restored += 1;
    }
  });
  tx();

  if (restored > 0) {
    console.info(`[persistent-moon-sounds] restored ${restored} celestial sound(s)`);
  }
  return restored;
}
