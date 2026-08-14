import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { getDb } from "@/lib/db";
import {
  CELESTIAL_PLAYLISTS,
  MOON_XP,
  SAMPLE_DREAMS,
  dailyRituals,
  titleForMoonXp,
  todaysInspiration,
  todaysJournalPrompt,
  type DreamTheme,
} from "@/lib/moonContent";
import { MOON_SOUND_DIR } from "@/lib/moonPaths";
import { persistAllDurableState } from "@/lib/tvPersist";

export { MOON_SOUND_DIR } from "@/lib/moonPaths";

export const MOON_SOUND_MAX_BYTES = 25 * 1024 * 1024;
export const MOON_SOUND_TYPES: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/ogg": "ogg",
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
};

export type MoonDream = {
  id: string;
  body: string;
  theme: DreamTheme;
  createdAt: string;
};

export type MoonJournalEntry = {
  id: string;
  promptId: string;
  prompt: string;
  body: string;
  dayKey: number;
  createdAt: string;
};

export type MoonProgress = {
  xp: number;
  title: ReturnType<typeof titleForMoonXp>;
  badges: string[];
  ritualsDone: Record<string, boolean>;
  dreams: MoonDream[];
  journal: MoonJournalEntry[];
  /** playlistId → playable sound URL */
  playlistSounds: Record<string, string>;
  featured: {
    ritualIds: string[];
    inspiration: ReturnType<typeof todaysInspiration>;
  };
};

type ProgressRow = {
  user_id: string;
  xp: number;
  badges_json: string;
  rituals_json: string;
};

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function ensureProgressRow(userId: string) {
  const db = getDb();
  const existing = db
    .prepare(`SELECT user_id FROM moon_progress WHERE user_id = ?`)
    .get(userId) as { user_id: string } | undefined;
  if (existing) return;
  db.prepare(`INSERT INTO moon_progress (user_id, xp) VALUES (?, 0)`).run(
    userId
  );
}

function seedDreamsIfEmpty() {
  const db = getDb();
  const count = db
    .prepare(`SELECT COUNT(*) as c FROM moon_dreams`)
    .get() as { c: number };
  if (count.c > 0) return;
  const insert = db.prepare(
    `INSERT INTO moon_dreams (id, body, theme, author_id) VALUES (?, ?, ?, NULL)`
  );
  for (const dream of SAMPLE_DREAMS) {
    insert.run(randomUUID(), dream.body, dream.theme);
  }
}

function listDreams(): MoonDream[] {
  seedDreamsIfEmpty();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, body, theme, created_at FROM moon_dreams
       ORDER BY created_at DESC LIMIT 80`
    )
    .all() as Array<{
    id: string;
    body: string;
    theme: string;
    created_at: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    theme: r.theme as DreamTheme,
    createdAt: r.created_at,
  }));
}

function listJournal(userId: string): MoonJournalEntry[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, prompt_id, prompt, body, day_key, created_at
       FROM moon_journal WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 40`
    )
    .all(userId) as Array<{
    id: string;
    prompt_id: string;
    prompt: string;
    body: string;
    day_key: number;
    created_at: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    promptId: r.prompt_id,
    prompt: r.prompt,
    body: r.body,
    dayKey: Number(r.day_key) || 0,
    createdAt: r.created_at,
  }));
}

export function listPlaylistSounds(): Record<string, string> {
  const db = getDb();
  const rows = db
    .prepare(`SELECT playlist_id, filename FROM moon_playlist_sounds`)
    .all() as Array<{ playlist_id: string; filename: string }>;
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.playlist_id] = `/api/moon/sounds/${row.filename}`;
  }
  return map;
}

function ensureSoundDir() {
  if (!fs.existsSync(MOON_SOUND_DIR)) {
    fs.mkdirSync(MOON_SOUND_DIR, { recursive: true });
  }
}

function deleteSoundFile(filename: string) {
  const filePath = path.join(MOON_SOUND_DIR, filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch {
      /* ignore */
    }
  }
}

export function getPlaylistSoundRow(playlistId: string) {
  const db = getDb();
  return db
    .prepare(
      `SELECT playlist_id, filename, original_name, uploaded_by, updated_at
       FROM moon_playlist_sounds WHERE playlist_id = ?`
    )
    .get(playlistId) as
    | {
        playlist_id: string;
        filename: string;
        original_name: string;
        uploaded_by: string | null;
        updated_at: string;
      }
    | undefined;
}

export function setPlaylistSound(input: {
  playlistId: string;
  filename: string;
  originalName: string;
  uploadedBy: string;
}) {
  const playlist = CELESTIAL_PLAYLISTS.find((p) => p.id === input.playlistId);
  if (!playlist) return { ok: false as const, error: "Unknown playlist" };

  const db = getDb();
  const existing = getPlaylistSoundRow(input.playlistId);
  if (existing) deleteSoundFile(existing.filename);

  db.prepare(
    `INSERT INTO moon_playlist_sounds (playlist_id, filename, original_name, uploaded_by, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(playlist_id) DO UPDATE SET
       filename = excluded.filename,
       original_name = excluded.original_name,
       uploaded_by = excluded.uploaded_by,
       updated_at = datetime('now')`
  ).run(
    input.playlistId,
    input.filename,
    input.originalName.slice(0, 180),
    input.uploadedBy
  );

  try {
    persistAllDurableState(db);
  } catch (err) {
    console.error("[persistent-moon-sounds] export failed:", err);
  }

  return {
    ok: true as const,
    url: `/api/moon/sounds/${input.filename}`,
    playlistSounds: listPlaylistSounds(),
  };
}

export function removePlaylistSound(playlistId: string) {
  const playlist = CELESTIAL_PLAYLISTS.find((p) => p.id === playlistId);
  if (!playlist) return { ok: false as const, error: "Unknown playlist" };

  const existing = getPlaylistSoundRow(playlistId);
  if (!existing) {
    return { ok: true as const, playlistSounds: listPlaylistSounds() };
  }

  const db = getDb();
  db.prepare(`DELETE FROM moon_playlist_sounds WHERE playlist_id = ?`).run(
    playlistId
  );
  deleteSoundFile(existing.filename);

  try {
    persistAllDurableState(db);
  } catch (err) {
    console.error("[persistent-moon-sounds] export failed:", err);
  }

  return { ok: true as const, playlistSounds: listPlaylistSounds() };
}

export function savePlaylistSoundFile(
  playlistId: string,
  file: File,
  uploadedBy: string
) {
  const playlist = CELESTIAL_PLAYLISTS.find((p) => p.id === playlistId);
  if (!playlist) return { ok: false as const, error: "Unknown playlist" };

  const ext = MOON_SOUND_TYPES[file.type];
  if (!ext) {
    return {
      ok: false as const,
      error: "Use MP3, WAV, OGG, M4A, AAC, or WebM audio",
    };
  }
  if (file.size <= 0 || file.size > MOON_SOUND_MAX_BYTES) {
    return { ok: false as const, error: "Audio must be under 25MB" };
  }

  ensureSoundDir();
  const filename = `${randomUUID()}.${ext}`;
  return (async () => {
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(MOON_SOUND_DIR, filename), buffer);
    return setPlaylistSound({
      playlistId,
      filename,
      originalName: file.name || `sound.${ext}`,
      uploadedBy,
    });
  })();
}

function readRow(userId: string): ProgressRow {
  ensureProgressRow(userId);
  const db = getDb();
  return db
    .prepare(
      `SELECT user_id, xp, badges_json, rituals_json
       FROM moon_progress WHERE user_id = ?`
    )
    .get(userId) as ProgressRow;
}

function addBadge(badges: string[], badge: string) {
  if (!badges.includes(badge)) badges.push(badge);
  return badges;
}

export function getMoonProgress(userId: string): MoonProgress {
  const row = readRow(userId);
  const rituals = dailyRituals();
  const inspiration = todaysInspiration();
  const day = Math.floor(Date.now() / 86_400_000);
  const ritualsDone = parseJson<Record<string, boolean>>(row.rituals_json, {});
  const todaysRituals: Record<string, boolean> = {};
  for (const r of rituals) {
    const key = `${day}:${r.id}`;
    if (ritualsDone[key]) todaysRituals[key] = true;
  }

  return {
    xp: Number(row.xp) || 0,
    title: titleForMoonXp(Number(row.xp) || 0),
    badges: parseJson(row.badges_json, []),
    ritualsDone: todaysRituals,
    dreams: listDreams(),
    journal: listJournal(userId),
    playlistSounds: listPlaylistSounds(),
    featured: {
      ritualIds: rituals.map((r) => r.id),
      inspiration,
    },
  };
}

export type MoonAction =
  | { type: "completeRitual"; ritualId: string }
  | { type: "saveJournal"; body: string }
  | { type: "submitDream"; body: string; theme: DreamTheme };

export function applyMoonAction(
  userId: string,
  action: MoonAction
): MoonProgress {
  const db = getDb();
  ensureProgressRow(userId);
  const row = readRow(userId);
  let xp = Number(row.xp) || 0;
  let badges = parseJson<string[]>(row.badges_json, []);
  const ritualsDone = parseJson<Record<string, boolean>>(row.rituals_json, {});

  if (action.type === "completeRitual") {
    const todays = dailyRituals();
    const ritual = todays.find((r) => r.id === action.ritualId);
    const day = Math.floor(Date.now() / 86_400_000);
    const key = `${day}:${action.ritualId}`;
    if (ritual && !ritualsDone[key]) {
      ritualsDone[key] = true;
      xp += MOON_XP.ritual;
      const doneToday = todays.filter(
        (r) => ritualsDone[`${day}:${r.id}`]
      ).length;
      if (doneToday >= 3) badges = addBadge(badges, "Gentle Nightwalker");
      if (doneToday >= 5) badges = addBadge(badges, "Full Moonmere Night");
    }
  } else if (action.type === "saveJournal") {
    const body = action.body.trim().slice(0, 800);
    if (body.length >= 8) {
      const prompt = todaysJournalPrompt();
      const day = Math.floor(Date.now() / 86_400_000);
      db.prepare(
        `INSERT INTO moon_journal (id, user_id, prompt_id, prompt, body, day_key)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(randomUUID(), userId, prompt.id, prompt.prompt, body, day);
      xp += MOON_XP.journal;
      badges = addBadge(badges, "Moon Scribe");
      const journalCount = (
        db
          .prepare(`SELECT COUNT(*) as c FROM moon_journal WHERE user_id = ?`)
          .get(userId) as { c: number }
      ).c;
      if (journalCount >= 5) {
        badges = addBadge(badges, "Quiet Chronicler");
      }
    }
  } else if (action.type === "submitDream") {
    const body = action.body.trim().slice(0, 400);
    const theme = action.theme;
    if (body.length >= 12 && theme) {
      db.prepare(
        `INSERT INTO moon_dreams (id, body, theme, author_id)
         VALUES (?, ?, ?, ?)`
      ).run(randomUUID(), body, theme, userId);
      xp += MOON_XP.dream;
      badges = addBadge(badges, "Dream Bottler");
    }
  }

  db.prepare(
    `UPDATE moon_progress SET
      xp = ?,
      badges_json = ?,
      rituals_json = ?,
      updated_at = datetime('now')
     WHERE user_id = ?`
  ).run(xp, JSON.stringify(badges), JSON.stringify(ritualsDone), userId);

  return getMoonProgress(userId);
}
