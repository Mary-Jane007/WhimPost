import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import {
  MOON_XP,
  SAMPLE_DREAMS,
  SAMPLE_WISHES,
  dailyRituals,
  titleForMoonXp,
  todaysInspiration,
  todaysJournalPrompt,
  type DreamTheme,
} from "@/lib/moonContent";

export type MoonWish = {
  id: string;
  body: string;
  createdAt: string;
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
  stardust: Record<string, boolean>;
  wishes: MoonWish[];
  dreams: MoonDream[];
  journal: MoonJournalEntry[];
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
  stardust_json: string;
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

function seedWishesIfEmpty() {
  const db = getDb();
  const count = db
    .prepare(`SELECT COUNT(*) as c FROM moon_wishes`)
    .get() as { c: number };
  if (count.c > 0) return;
  const insert = db.prepare(
    `INSERT INTO moon_wishes (id, body, author_id) VALUES (?, ?, NULL)`
  );
  for (const body of SAMPLE_WISHES) {
    insert.run(randomUUID(), body);
  }
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

function listWishes(): MoonWish[] {
  seedWishesIfEmpty();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, body, created_at FROM moon_wishes
       ORDER BY created_at DESC LIMIT 80`
    )
    .all() as Array<{ id: string; body: string; created_at: string }>;
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.created_at,
  }));
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

function readRow(userId: string): ProgressRow {
  ensureProgressRow(userId);
  const db = getDb();
  return db
    .prepare(
      `SELECT user_id, xp, badges_json, rituals_json, stardust_json
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
    stardust: parseJson(row.stardust_json, {}),
    wishes: listWishes(),
    dreams: listDreams(),
    journal: listJournal(userId),
    featured: {
      ritualIds: rituals.map((r) => r.id),
      inspiration,
    },
  };
}

export type MoonAction =
  | { type: "completeRitual"; ritualId: string }
  | { type: "saveJournal"; body: string }
  | { type: "submitDream"; body: string; theme: DreamTheme }
  | { type: "makeWish"; body: string }
  | { type: "toggleStardust"; wishId: string };

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
  const stardust = parseJson<Record<string, boolean>>(row.stardust_json, {});

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
  } else if (action.type === "makeWish") {
    const body = action.body.trim().slice(0, 200);
    if (body.length >= 6) {
      db.prepare(
        `INSERT INTO moon_wishes (id, body, author_id) VALUES (?, ?, ?)`
      ).run(randomUUID(), body, userId);
      xp += MOON_XP.wish;
      badges = addBadge(badges, "Wish Weaver");
    }
  } else if (action.type === "toggleStardust") {
    const wish = db
      .prepare(`SELECT id FROM moon_wishes WHERE id = ?`)
      .get(action.wishId) as { id: string } | undefined;
    if (wish) {
      if (stardust[wish.id]) {
        delete stardust[wish.id];
      } else {
        stardust[wish.id] = true;
        xp += MOON_XP.stardust;
        if (Object.keys(stardust).length >= 5) {
          badges = addBadge(badges, "Stardust Keeper");
        }
      }
    }
  }

  db.prepare(
    `UPDATE moon_progress SET
      xp = ?,
      badges_json = ?,
      rituals_json = ?,
      stardust_json = ?,
      updated_at = datetime('now')
     WHERE user_id = ?`
  ).run(
    xp,
    JSON.stringify(badges),
    JSON.stringify(ritualsDone),
    JSON.stringify(stardust),
    userId
  );

  return getMoonProgress(userId);
}
