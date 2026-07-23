import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import {
  COZY_RECIPES,
  HEARTH_XP,
  SAMPLE_FIRESIDE_NOTES,
  dailyRituals,
  titleForHearthXp,
  todaysHerb,
  todaysInspiration,
} from "@/lib/hearthContent";

export type HearthNote = {
  id: string;
  body: string;
  createdAt: string;
  favoriteCount: number;
};

export type HearthProgress = {
  xp: number;
  title: ReturnType<typeof titleForHearthXp>;
  badges: string[];
  ritualsDone: Record<string, boolean>;
  favoriteRecipes: Record<string, boolean>;
  kindling: Record<string, boolean>;
  notes: HearthNote[];
  featured: {
    ritualIds: string[];
    herbId: string;
    inspiration: ReturnType<typeof todaysInspiration>;
  };
};

type ProgressRow = {
  user_id: string;
  xp: number;
  badges_json: string;
  rituals_json: string;
  favorite_recipes_json: string;
  kindling_json: string;
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
    .prepare(`SELECT user_id FROM hearth_progress WHERE user_id = ?`)
    .get(userId) as { user_id: string } | undefined;
  if (existing) return;
  db.prepare(`INSERT INTO hearth_progress (user_id, xp) VALUES (?, 0)`).run(
    userId
  );
}

function seedNotesIfEmpty() {
  const db = getDb();
  const count = db
    .prepare(`SELECT COUNT(*) as c FROM hearth_notes`)
    .get() as { c: number };
  if (count.c > 0) return;
  const insert = db.prepare(
    `INSERT INTO hearth_notes (id, body, author_id, favorite_count)
     VALUES (?, ?, NULL, ?)`
  );
  for (const body of SAMPLE_FIRESIDE_NOTES) {
    insert.run(randomUUID(), body, Math.floor(Math.random() * 4));
  }
}

function listNotes(): HearthNote[] {
  seedNotesIfEmpty();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, body, created_at, favorite_count
       FROM hearth_notes
       ORDER BY created_at DESC
       LIMIT 60`
    )
    .all() as Array<{
    id: string;
    body: string;
    created_at: string;
    favorite_count: number;
  }>;
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.created_at,
    favoriteCount: Number(r.favorite_count) || 0,
  }));
}

function readRow(userId: string): ProgressRow {
  ensureProgressRow(userId);
  const db = getDb();
  return db
    .prepare(
      `SELECT user_id, xp, badges_json, rituals_json, favorite_recipes_json, kindling_json
       FROM hearth_progress WHERE user_id = ?`
    )
    .get(userId) as ProgressRow;
}

function addBadge(badges: string[], badge: string) {
  if (!badges.includes(badge)) badges.push(badge);
  return badges;
}

export function getHearthProgress(userId: string): HearthProgress {
  const row = readRow(userId);
  const rituals = dailyRituals();
  const herb = todaysHerb();
  const inspiration = todaysInspiration();

  // Prune ritual keys older than today from the response view
  const day = Math.floor(Date.now() / 86_400_000);
  const ritualsDone = parseJson<Record<string, boolean>>(row.rituals_json, {});
  const todaysRituals: Record<string, boolean> = {};
  for (const r of rituals) {
    const key = `${day}:${r.id}`;
    if (ritualsDone[key]) todaysRituals[key] = true;
  }

  return {
    xp: Number(row.xp) || 0,
    title: titleForHearthXp(Number(row.xp) || 0),
    badges: parseJson(row.badges_json, []),
    ritualsDone: todaysRituals,
    favoriteRecipes: parseJson(row.favorite_recipes_json, {}),
    kindling: parseJson(row.kindling_json, {}),
    notes: listNotes(),
    featured: {
      ritualIds: rituals.map((r) => r.id),
      herbId: herb.id,
      inspiration,
    },
  };
}

export type HearthAction =
  | { type: "completeRitual"; ritualId: string }
  | { type: "leaveNote"; body: string }
  | { type: "toggleRecipeFavorite"; recipeId: string }
  | { type: "toggleKindling"; noteId: string };

export function applyHearthAction(
  userId: string,
  action: HearthAction
): HearthProgress {
  const db = getDb();
  ensureProgressRow(userId);
  const row = readRow(userId);
  let xp = Number(row.xp) || 0;
  let badges = parseJson<string[]>(row.badges_json, []);
  const ritualsDone = parseJson<Record<string, boolean>>(row.rituals_json, {});
  const favoriteRecipes = parseJson<Record<string, boolean>>(
    row.favorite_recipes_json,
    {}
  );
  const kindling = parseJson<Record<string, boolean>>(row.kindling_json, {});

  if (action.type === "completeRitual") {
    const todays = dailyRituals();
    const ritual = todays.find((r) => r.id === action.ritualId);
    const day = Math.floor(Date.now() / 86_400_000);
    const key = `${day}:${action.ritualId}`;
    if (ritual && !ritualsDone[key]) {
      ritualsDone[key] = true;
      xp += HEARTH_XP.ritual;
      const doneToday = todays.filter((r) => ritualsDone[`${day}:${r.id}`]).length;
      if (doneToday >= 5) badges = addBadge(badges, "Full Fireside Day");
      if (doneToday >= 3) badges = addBadge(badges, "Gentle Ritualist");
    }
  } else if (action.type === "leaveNote") {
    const body = action.body.trim().slice(0, 280);
    if (body.length >= 8) {
      db.prepare(
        `INSERT INTO hearth_notes (id, body, author_id, favorite_count)
         VALUES (?, ?, ?, 0)`
      ).run(randomUUID(), body, userId);
      xp += HEARTH_XP.note;
      badges = addBadge(badges, "Kindling Author");
    }
  } else if (action.type === "toggleRecipeFavorite") {
    const recipe = COZY_RECIPES.find((r) => r.id === action.recipeId);
    if (recipe) {
      if (favoriteRecipes[recipe.id]) {
        delete favoriteRecipes[recipe.id];
      } else {
        favoriteRecipes[recipe.id] = true;
        xp += HEARTH_XP.favoriteRecipe;
        if (Object.keys(favoriteRecipes).length >= 5) {
          badges = addBadge(badges, "Recipe Collector");
        }
      }
    }
  } else if (action.type === "toggleKindling") {
    const note = db
      .prepare(`SELECT id FROM hearth_notes WHERE id = ?`)
      .get(action.noteId) as { id: string } | undefined;
    if (note) {
      if (kindling[note.id]) {
        delete kindling[note.id];
        db.prepare(
          `UPDATE hearth_notes
           SET favorite_count = CASE WHEN favorite_count > 0 THEN favorite_count - 1 ELSE 0 END
           WHERE id = ?`
        ).run(note.id);
      } else {
        kindling[note.id] = true;
        db.prepare(
          `UPDATE hearth_notes SET favorite_count = favorite_count + 1 WHERE id = ?`
        ).run(note.id);
        xp += HEARTH_XP.kindling;
        if (Object.keys(kindling).length >= 5) {
          badges = addBadge(badges, "Kindling Keeper");
        }
      }
    }
  }

  db.prepare(
    `UPDATE hearth_progress SET
      xp = ?,
      badges_json = ?,
      rituals_json = ?,
      favorite_recipes_json = ?,
      kindling_json = ?,
      updated_at = datetime('now')
     WHERE user_id = ?`
  ).run(
    xp,
    JSON.stringify(badges),
    JSON.stringify(ritualsDone),
    JSON.stringify(favoriteRecipes),
    JSON.stringify(kindling),
    userId
  );

  return getHearthProgress(userId);
}
