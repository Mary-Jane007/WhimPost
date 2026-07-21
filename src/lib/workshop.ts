import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import {
  CRAFTS,
  CREATIVE_PROMPTS,
  PLANTS,
  QUEST_ITEMS,
  RECIPES,
  SEASONAL_PANELS,
  WORKSHOP_XP,
  featuredCraft,
  featuredPrompt,
  featuredPuzzle,
  titleForXp,
  type WorkshopTabId,
} from "@/lib/workshopContent";

export type JournalEntry = {
  id: string;
  activityType: string;
  activityId: string;
  activityName: string;
  photoUrl: string | null;
  xpEarned: number;
  note: string;
  createdAt: string;
};

export type WorkshopProgress = {
  xp: number;
  title: ReturnType<typeof titleForXp>;
  badges: string[];
  completed: Record<string, boolean>;
  photos: Record<string, string>;
  questChecks: Record<string, boolean>;
  questPhotos: Record<string, string>;
  plantId: string | null;
  plantWeeks: Record<string, string>;
  birds: Record<string, { spotted: boolean; photoUrl?: string }>;
  broadcast: Record<
    string,
    { favorite: boolean; completed: boolean; progress: number }
  >;
  seasonal: Record<string, boolean>;
  journal: JournalEntry[];
  featured: {
    craftId: string;
    promptId: string;
    puzzleId: string;
  };
};

type ProgressRow = {
  user_id: string;
  xp: number;
  badges_json: string;
  completed_json: string;
  photos_json: string;
  quest_json: string;
  quest_photos_json: string;
  plant_id: string | null;
  plant_weeks_json: string;
  birds_json: string;
  broadcast_json: string;
  seasonal_json: string;
  updated_at: string;
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
    .prepare(`SELECT user_id FROM workshop_progress WHERE user_id = ?`)
    .get(userId) as { user_id: string } | undefined;
  if (existing) return;
  db.prepare(
    `INSERT INTO workshop_progress (user_id, xp)
     VALUES (?, 0)`
  ).run(userId);
}

function readRow(userId: string): ProgressRow {
  ensureProgressRow(userId);
  const db = getDb();
  return db
    .prepare(`SELECT * FROM workshop_progress WHERE user_id = ?`)
    .get(userId) as ProgressRow;
}

function listJournal(userId: string): JournalEntry[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, activity_type, activity_id, activity_name, photo_url, xp_earned, note, created_at
       FROM workshop_journal
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 80`
    )
    .all(userId) as Array<{
    id: string;
    activity_type: string;
    activity_id: string;
    activity_name: string;
    photo_url: string | null;
    xp_earned: number;
    note: string;
    created_at: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    activityType: r.activity_type,
    activityId: r.activity_id,
    activityName: r.activity_name,
    photoUrl: r.photo_url,
    xpEarned: r.xp_earned,
    note: r.note,
    createdAt: r.created_at,
  }));
}

export function getWorkshopProgress(userId: string): WorkshopProgress {
  const row = readRow(userId);
  const xp = Number(row.xp) || 0;
  return {
    xp,
    title: titleForXp(xp),
    badges: parseJson<string[]>(row.badges_json, []),
    completed: parseJson<Record<string, boolean>>(row.completed_json, {}),
    photos: parseJson<Record<string, string>>(row.photos_json, {}),
    questChecks: parseJson<Record<string, boolean>>(row.quest_json, {}),
    questPhotos: parseJson<Record<string, string>>(row.quest_photos_json, {}),
    plantId: row.plant_id,
    plantWeeks: parseJson<Record<string, string>>(row.plant_weeks_json, {}),
    birds: parseJson(row.birds_json, {}),
    broadcast: parseJson(row.broadcast_json, {}),
    seasonal: parseJson(row.seasonal_json, {}),
    journal: listJournal(userId),
    featured: {
      craftId: featuredCraft().id,
      promptId: featuredPrompt().id,
      puzzleId: featuredPuzzle().id,
    },
  };
}

function addBadge(badges: string[], badge: string) {
  if (!badges.includes(badge)) badges.push(badge);
  return badges;
}

function insertJournal(input: {
  userId: string;
  activityType: string;
  activityId: string;
  activityName: string;
  photoUrl?: string | null;
  xpEarned: number;
  note: string;
}) {
  const db = getDb();
  db.prepare(
    `INSERT INTO workshop_journal
      (id, user_id, activity_type, activity_id, activity_name, photo_url, xp_earned, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    randomUUID(),
    input.userId,
    input.activityType,
    input.activityId,
    input.activityName,
    input.photoUrl || null,
    input.xpEarned,
    input.note
  );
}

export type WorkshopAction =
  | {
      type: "complete";
      key: string;
      activityType: string;
      activityId: string;
      activityName: string;
      xp: number;
      note: string;
      badge?: string;
      photoUrl?: string;
    }
  | { type: "photo"; key: string; photoUrl: string }
  | { type: "questToggle"; itemId: string; checked: boolean; photoUrl?: string }
  | { type: "choosePlant"; plantId: string }
  | { type: "plantWeek"; week: number; photoUrl: string }
  | { type: "bird"; birdId: string; photoUrl?: string }
  | {
      type: "broadcast";
      videoId: string;
      favorite?: boolean;
      completed?: boolean;
      progress?: number;
    }
  | { type: "seasonal"; eventId: string; taskIndex: number };

export function applyWorkshopAction(
  userId: string,
  action: WorkshopAction
): WorkshopProgress {
  const db = getDb();
  ensureProgressRow(userId);
  const row = readRow(userId);
  let xp = Number(row.xp) || 0;
  let badges = parseJson<string[]>(row.badges_json, []);
  const completed = parseJson<Record<string, boolean>>(row.completed_json, {});
  const photos = parseJson<Record<string, string>>(row.photos_json, {});
  const questChecks = parseJson<Record<string, boolean>>(row.quest_json, {});
  const questPhotos = parseJson<Record<string, string>>(
    row.quest_photos_json,
    {}
  );
  let plantId = row.plant_id;
  const plantWeeks = parseJson<Record<string, string>>(
    row.plant_weeks_json,
    {}
  );
  const birds = parseJson<
    Record<string, { spotted: boolean; photoUrl?: string }>
  >(row.birds_json, {});
  const broadcast = parseJson<
    Record<string, { favorite: boolean; completed: boolean; progress: number }>
  >(row.broadcast_json, {});
  const seasonal = parseJson<Record<string, boolean>>(row.seasonal_json, {});

  if (action.type === "complete") {
    if (!completed[action.key]) {
      completed[action.key] = true;
      xp += action.xp;
      if (action.badge) badges = addBadge(badges, action.badge);
      if (action.photoUrl) photos[action.key] = action.photoUrl;
      insertJournal({
        userId,
        activityType: action.activityType,
        activityId: action.activityId,
        activityName: action.activityName,
        photoUrl: action.photoUrl,
        xpEarned: action.xp,
        note: action.note,
      });
    } else if (action.photoUrl) {
      photos[action.key] = action.photoUrl;
    }
  } else if (action.type === "photo") {
    photos[action.key] = action.photoUrl;
  } else if (action.type === "questToggle") {
    const key = `quest:${action.itemId}`;
    const was = Boolean(questChecks[action.itemId]);
    questChecks[action.itemId] = action.checked;
    if (action.photoUrl) questPhotos[action.itemId] = action.photoUrl;
    if (action.checked && !was) {
      xp += WORKSHOP_XP.questItem;
      insertJournal({
        userId,
        activityType: "quest",
        activityId: action.itemId,
        activityName:
          QUEST_ITEMS.find((q) => q.id === action.itemId)?.label ||
          "Woodland discovery",
        photoUrl: action.photoUrl,
        xpEarned: WORKSHOP_XP.questItem,
        note: "Another soft discovery for the explorer’s satchel.",
      });
      const done = QUEST_ITEMS.every((q) => questChecks[q.id]);
      if (done) badges = addBadge(badges, "Explorer");
    }
    if (!action.checked && was) {
      // Do not claw back XP; keep journal history.
      void key;
    }
  } else if (action.type === "choosePlant") {
    if (PLANTS.some((p) => p.id === action.plantId)) {
      plantId = action.plantId;
    }
  } else if (action.type === "plantWeek") {
    const weekKey = String(action.week);
    if (!plantWeeks[weekKey]) {
      plantWeeks[weekKey] = action.photoUrl;
      xp += WORKSHOP_XP.growWeek;
      const plantName =
        PLANTS.find((p) => p.id === plantId)?.name || "your plant";
      insertJournal({
        userId,
        activityType: "grow",
        activityId: `${plantId || "plant"}-week-${action.week}`,
        activityName: `${plantName} · Week ${action.week}`,
        photoUrl: action.photoUrl,
        xpEarned: WORKSHOP_XP.growWeek,
        note: `Week ${action.week} — the green things keep surprising me.`,
      });
      if (action.week === 1) badges = addBadge(badges, "Tiny Sprout");
      if (action.week === 3) badges = addBadge(badges, "Gardener");
      if (action.week === 4) {
        badges = addBadge(badges, "Green Thumb");
        xp += WORKSHOP_XP.growComplete;
      }
    } else {
      plantWeeks[weekKey] = action.photoUrl;
    }
  } else if (action.type === "bird") {
    const prior = birds[action.birdId];
    if (!prior?.spotted) {
      birds[action.birdId] = {
        spotted: true,
        photoUrl: action.photoUrl,
      };
      xp += WORKSHOP_XP.bird;
      insertJournal({
        userId,
        activityType: "bird",
        activityId: action.birdId,
        activityName: `Spotted a bird`,
        photoUrl: action.photoUrl,
        xpEarned: WORKSHOP_XP.bird,
        note: "A quick wingbeat and the field guide gained a new mark.",
      });
      if (Object.values(birds).filter((b) => b.spotted).length >= 5) {
        badges = addBadge(badges, "Bird Watcher");
      }
    } else if (action.photoUrl) {
      birds[action.birdId] = { spotted: true, photoUrl: action.photoUrl };
    }
  } else if (action.type === "broadcast") {
    const cur = broadcast[action.videoId] || {
      favorite: false,
      completed: false,
      progress: 0,
    };
    if (action.favorite !== undefined) cur.favorite = action.favorite;
    if (action.progress !== undefined) {
      cur.progress = Math.max(0, Math.min(100, Math.floor(action.progress)));
    }
    if (action.completed && !cur.completed) {
      cur.completed = true;
      cur.progress = 100;
      xp += WORKSHOP_XP.broadcast;
      insertJournal({
        userId,
        activityType: "broadcast",
        activityId: action.videoId,
        activityName: "Bramblewood Broadcast",
        xpEarned: WORKSHOP_XP.broadcast,
        note: "I watched something gentle on the village channel.",
      });
    } else if (action.completed === false) {
      cur.completed = false;
    } else if (action.completed) {
      cur.completed = true;
      cur.progress = 100;
    }
    broadcast[action.videoId] = cur;
  } else if (action.type === "seasonal") {
    const key = `${action.eventId}:${action.taskIndex}`;
    if (!seasonal[key]) {
      seasonal[key] = true;
      xp += WORKSHOP_XP.seasonal;
      const panel = SEASONAL_PANELS.find((p) => p.id === action.eventId);
      const task = panel?.tasks[action.taskIndex] || "Seasonal task";
      insertJournal({
        userId,
        activityType: "seasonal",
        activityId: key,
        activityName: `${panel?.title || "Season"} · ${task}`,
        xpEarned: WORKSHOP_XP.seasonal,
        note: "A seasonal ritual for Bramblewood’s calendar.",
      });
      const allDone =
        panel &&
        panel.tasks.every((_, i) => seasonal[`${action.eventId}:${i}`]);
      if (allDone && panel) badges = addBadge(badges, panel.reward);
    }
  }

  db.prepare(
    `UPDATE workshop_progress
     SET xp = ?,
         badges_json = ?,
         completed_json = ?,
         photos_json = ?,
         quest_json = ?,
         quest_photos_json = ?,
         plant_id = ?,
         plant_weeks_json = ?,
         birds_json = ?,
         broadcast_json = ?,
         seasonal_json = ?,
         updated_at = datetime('now')
     WHERE user_id = ?`
  ).run(
    xp,
    JSON.stringify(badges),
    JSON.stringify(completed),
    JSON.stringify(photos),
    JSON.stringify(questChecks),
    JSON.stringify(questPhotos),
    plantId,
    JSON.stringify(plantWeeks),
    JSON.stringify(birds),
    JSON.stringify(broadcast),
    JSON.stringify(seasonal),
    userId
  );

  return getWorkshopProgress(userId);
}

export function craftCompletionPayload(craftId: string, photoUrl?: string) {
  const craft = CRAFTS.find((c) => c.id === craftId) || featuredCraft();
  return {
    type: "complete" as const,
    key: `craft:${craft.id}`,
    activityType: "craft",
    activityId: craft.id,
    activityName: craft.title,
    xp: WORKSHOP_XP.craft,
    note: craft.note,
    badge: "Craftsman Badge",
    photoUrl,
  };
}

export function recipeCompletionPayload(recipeId: string, photoUrl?: string) {
  const recipe = RECIPES.find((r) => r.id === recipeId)!;
  return {
    type: "complete" as const,
    key: `recipe:${recipe.id}`,
    activityType: "recipe",
    activityId: recipe.id,
    activityName: recipe.title,
    xp: WORKSHOP_XP.recipe,
    note: recipe.note,
    badge: recipe.badge,
    photoUrl,
  };
}

export function promptCompletionPayload(promptId: string, photoUrl?: string) {
  const prompt =
    CREATIVE_PROMPTS.find((p) => p.id === promptId) || featuredPrompt();
  return {
    type: "complete" as const,
    key: `prompt:${prompt.id}`,
    activityType: "prompt",
    activityId: prompt.id,
    activityName: prompt.text,
    xp: WORKSHOP_XP.prompt,
    note: prompt.note,
    badge: "Creative Heart",
    photoUrl,
  };
}

export function puzzleCompletionPayload(puzzleId: string) {
  const puzzle = featuredPuzzle();
  const match = puzzle.id === puzzleId ? puzzle : puzzle;
  return {
    type: "complete" as const,
    key: `puzzle:${puzzleId}`,
    activityType: "puzzle",
    activityId: puzzleId,
    activityName: match.title,
    xp: WORKSHOP_XP.puzzle,
    note: "A quiet puzzle afternoon by the workshop window.",
    badge: "Puzzle Fox",
  };
}

export type { WorkshopTabId };
