import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import {
  CRAFTS,
  CREATIVE_PROMPTS,
  DISCOVERY_COLLECTIONS,
  LOCAL_WILDLIFE,
  OUTDOOR_SKILLS,
  PLANTS,
  QUEST_ITEMS,
  RECIPES,
  WEEKLY_EXPEDITIONS,
  WOODLAND_ADVENTURES,
  WOODLAND_DIY,
  WORKSHOP_XP,
  featuredCraft,
  featuredExpedition,
  featuredPrompt,
  titleForXp,
  type WorkshopTabId,
} from "@/lib/workshopContent";
import {
  WORKSHOP_XP_COLLECTIBLE_GIFTS,
  claimXpCollectibleGifts,
} from "@/lib/workshopXpGifts";
import type { CollectibleKind } from "@/lib/villages";

export type JournalEntry = {
  id: string;
  activityType: string;
  activityId: string;
  activityName: string;
  photoUrl: string | null;
  xpEarned: number;
  note: string;
  shared: boolean;
  createdAt: string;
};

export type WorkshopProgress = {
  xp: number;
  title: ReturnType<typeof titleForXp>;
  badges: string[];
  completed: Record<string, boolean>;
  photos: Record<string, string>;
  /** Woodland Adventures checklist (also stores legacy quest ids). */
  questChecks: Record<string, boolean>;
  questPhotos: Record<string, string>;
  plantId: string | null;
  plantWeeks: Record<string, string>;
  /** Wildlife + legacy bird sightings. */
  birds: Record<string, { spotted: boolean; photoUrl?: string }>;
  collections: Record<string, number>;
  journal: JournalEntry[];
  xpGiftsClaimed: string[];
  featured: {
    craftId: string;
    promptId: string;
    expeditionId: string;
  };
};

export type WorkshopActionResult = {
  progress: WorkshopProgress;
  grantedCollectibles: CollectibleKind[];
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
  xp_gifts_json?: string;
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
    .prepare(
      `SELECT user_id, xp, badges_json, completed_json, photos_json, quest_json,
              quest_photos_json, plant_id, plant_weeks_json, birds_json,
              broadcast_json, seasonal_json, xp_gifts_json, updated_at
       FROM workshop_progress WHERE user_id = ?`
    )
    .get(userId) as ProgressRow;
}

function listJournal(userId: string): JournalEntry[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, activity_type, activity_id, activity_name, photo_url, xp_earned, note, shared, created_at
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
    shared: number | null;
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
    shared: Boolean(r.shared),
    createdAt: r.created_at,
  }));
}

export function getWorkshopProgress(userId: string): WorkshopProgress {
  const row = readRow(userId);
  const xp = Number(row.xp) || 0;
  const broadcast = parseJson<{ collections?: Record<string, number> }>(
    row.broadcast_json,
    {}
  );
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
    collections: broadcast.collections || {},
    journal: listJournal(userId),
    xpGiftsClaimed: parseJson(row.xp_gifts_json, []),
    featured: {
      craftId: featuredCraft().id,
      promptId: featuredPrompt().id,
      expeditionId: featuredExpedition().id,
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
  shared?: boolean;
}) {
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO workshop_journal
      (id, user_id, activity_type, activity_id, activity_name, photo_url, xp_earned, note, shared)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.userId,
    input.activityType,
    input.activityId,
    input.activityName,
    input.photoUrl || null,
    input.xpEarned,
    input.note,
    input.shared ? 1 : 0
  );
  return id;
}

function shareJournalToVillageSquare(input: {
  userId: string;
  activityName: string;
  note: string;
  photoUrl?: string | null;
}) {
  const db = getDb();
  const user = db
    .prepare(`SELECT village_id FROM users WHERE id = ?`)
    .get(input.userId) as { village_id: string | null } | undefined;
  if (!user?.village_id) return false;

  const body = [
    `🧵 Workshop share · ${input.activityName}`,
    input.note.trim().slice(0, 220),
  ]
    .filter(Boolean)
    .join("\n");

  db.prepare(
    `INSERT INTO village_notes (id, village_id, author_id, body, anonymous, image_url)
     VALUES (?, ?, ?, ?, 0, ?)`
  ).run(
    randomUUID(),
    user.village_id,
    input.userId,
    body.slice(0, 280),
    input.photoUrl || null
  );
  return true;
}

export type WorkshopAction =
  | {
      type: "complete";
      key: string;
      activityType: string;
      activityId: string;
      activityName: string;
      xp: number;
      badge?: string;
      photoUrl?: string;
    }
  | { type: "photo"; key: string; photoUrl: string }
  | { type: "questToggle"; itemId: string; checked: boolean; photoUrl?: string }
  | { type: "choosePlant"; plantId: string }
  | { type: "plantWeek"; week: number; photoUrl: string }
  | { type: "bird"; birdId: string; photoUrl?: string }
  | { type: "wildlife"; wildlifeId: string; photoUrl?: string }
  | { type: "collectionBump"; collectionId: string }
  | {
      type: "journalEntry";
      activityId?: string;
      activityName: string;
      note: string;
      photoUrl?: string;
      markCraftComplete?: boolean;
      shareWithVillage?: boolean;
    }
  | { type: "shareJournal"; entryId: string };

export function applyWorkshopAction(
  userId: string,
  action: WorkshopAction
): WorkshopActionResult {
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
  const broadcast = parseJson<{ collections?: Record<string, number> }>(
    row.broadcast_json,
    {}
  );
  const collections = { ...(broadcast.collections || {}) };
  let xpGiftsClaimed = parseJson<string[]>(row.xp_gifts_json, []);

  if (action.type === "complete") {
    if (!completed[action.key]) {
      completed[action.key] = true;
      xp += action.xp;
      if (action.badge) badges = addBadge(badges, action.badge);
      if (action.photoUrl) photos[action.key] = action.photoUrl;
    } else if (action.photoUrl) {
      photos[action.key] = action.photoUrl;
    }
  } else if (action.type === "photo") {
    photos[action.key] = action.photoUrl;
  } else if (action.type === "questToggle") {
    const was = Boolean(questChecks[action.itemId]);
    questChecks[action.itemId] = action.checked;
    if (action.photoUrl) questPhotos[action.itemId] = action.photoUrl;
    if (action.checked && !was) {
      const isAdventure = WOODLAND_ADVENTURES.some((a) => a.id === action.itemId);
      xp += isAdventure ? WORKSHOP_XP.adventure : WORKSHOP_XP.questItem;
      const adventureDone = WOODLAND_ADVENTURES.every((a) => questChecks[a.id]);
      const questDone = QUEST_ITEMS.every((q) => questChecks[q.id]);
      if (adventureDone) badges = addBadge(badges, "Woodland Adventurer");
      if (questDone) badges = addBadge(badges, "Explorer");
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
      if (action.week === 1) badges = addBadge(badges, "Tiny Sprout");
      if (action.week === 3) badges = addBadge(badges, "Gardener");
      if (action.week === 4) {
        badges = addBadge(badges, "Green Thumb");
        xp += WORKSHOP_XP.growComplete;
      }
    } else {
      plantWeeks[weekKey] = action.photoUrl;
    }
  } else if (action.type === "bird" || action.type === "wildlife") {
    const id =
      action.type === "bird" ? action.birdId : action.wildlifeId;
    const prior = birds[id];
    if (!prior?.spotted) {
      birds[id] = {
        spotted: true,
        photoUrl: action.photoUrl,
      };
      xp +=
        action.type === "wildlife" ? WORKSHOP_XP.wildlife : WORKSHOP_XP.bird;
      const spottedCount = Object.values(birds).filter((b) => b.spotted).length;
      if (spottedCount >= 5) badges = addBadge(badges, "Field Guide Friend");
      if (
        LOCAL_WILDLIFE.every((w) => birds[w.id]?.spotted)
      ) {
        badges = addBadge(badges, "Local Wildlife Keeper");
      }
    } else if (action.photoUrl) {
      birds[id] = { spotted: true, photoUrl: action.photoUrl };
    }
  } else if (action.type === "collectionBump") {
    const meta = DISCOVERY_COLLECTIONS.find((c) => c.id === action.collectionId);
    if (meta) {
      const current = collections[meta.id] || 0;
      if (current < meta.goal) {
        collections[meta.id] = current + 1;
        xp += WORKSHOP_XP.collection;
        if (collections[meta.id] >= meta.goal) {
          badges = addBadge(badges, `${meta.title} Complete`);
        }
      }
    }
  } else if (action.type === "journalEntry") {
    const name = action.activityName.trim().slice(0, 120);
    const note = action.note.trim().slice(0, 2000);
    if (!name || !note) {
      return { progress: getWorkshopProgress(userId), grantedCollectibles: [] };
    }

    const craft = CRAFTS.find((c) => c.id === action.activityId);
    const diy = WOODLAND_DIY.find((c) => c.id === action.activityId);
    const recipe = RECIPES.find((r) => r.id === action.activityId);
    let xpEarned = WORKSHOP_XP.journal;
    const activityId = action.activityId || `custom-${Date.now()}`;
    const activityType = craft || diy ? "craft" : recipe ? "recipe" : "journal";

    if (action.markCraftComplete && (craft || diy)) {
      const item = craft || diy!;
      const key = `craft:${item.id}`;
      if (!completed[key]) {
        completed[key] = true;
        xpEarned += craft ? WORKSHOP_XP.craft : WORKSHOP_XP.diy;
        badges = addBadge(badges, "Craftsman Badge");
      }
    } else if (action.markCraftComplete && recipe) {
      const key = `recipe:${recipe.id}`;
      if (!completed[key]) {
        completed[key] = true;
        xpEarned += WORKSHOP_XP.recipe;
        badges = addBadge(badges, recipe.badge);
      }
    }

    if (action.photoUrl) {
      photos[`journal:${activityId}:${Date.now()}`] = action.photoUrl;
      if (craft) photos[`craft:${craft.id}`] = action.photoUrl;
      if (diy) photos[`diy:${diy.id}`] = action.photoUrl;
      if (recipe) photos[`recipe:${recipe.id}`] = action.photoUrl;
    }

    xp += xpEarned;
    const shareWithVillage = Boolean(action.shareWithVillage);
    insertJournal({
      userId,
      activityType,
      activityId,
      activityName: name,
      photoUrl: action.photoUrl,
      xpEarned,
      note,
      shared: shareWithVillage,
    });
    if (shareWithVillage) {
      shareJournalToVillageSquare({
        userId,
        activityName: name,
        note,
        photoUrl: action.photoUrl,
      });
    }
  } else if (action.type === "shareJournal") {
    const entry = db
      .prepare(
        `SELECT id, activity_name, note, photo_url, shared
         FROM workshop_journal
         WHERE id = ? AND user_id = ?`
      )
      .get(action.entryId, userId) as
      | {
          id: string;
          activity_name: string;
          note: string;
          photo_url: string | null;
          shared: number;
        }
      | undefined;
    if (entry && !entry.shared) {
      const ok = shareJournalToVillageSquare({
        userId,
        activityName: entry.activity_name,
        note: entry.note,
        photoUrl: entry.photo_url,
      });
      if (ok) {
        db.prepare(`UPDATE workshop_journal SET shared = 1 WHERE id = ?`).run(
          entry.id
        );
      }
    }
  }

  const giftResult = claimXpCollectibleGifts(
    db,
    userId,
    xp,
    WORKSHOP_XP_COLLECTIBLE_GIFTS,
    xpGiftsClaimed
  );
  xpGiftsClaimed = giftResult.claimed;
  const grantedCollectibles = giftResult.granted;

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
         xp_gifts_json = ?,
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
    JSON.stringify({ collections }),
    "{}",
    JSON.stringify(xpGiftsClaimed),
    userId
  );

  return {
    progress: getWorkshopProgress(userId),
    grantedCollectibles,
  };
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
    badge: "Craftsman Badge",
    photoUrl,
  };
}

export function diyCompletionPayload(diyId: string, photoUrl?: string) {
  const diy = WOODLAND_DIY.find((c) => c.id === diyId) || WOODLAND_DIY[0];
  return {
    type: "complete" as const,
    key: `diy:${diy.id}`,
    activityType: "diy",
    activityId: diy.id,
    activityName: diy.title,
    xp: WORKSHOP_XP.diy,
    badge: "Woodland Maker",
    photoUrl,
  };
}

export function skillCompletionPayload(skillId: string) {
  const skill = OUTDOOR_SKILLS.find((s) => s.id === skillId) || OUTDOOR_SKILLS[0];
  return {
    type: "complete" as const,
    key: `skill:${skill.id}`,
    activityType: "skill",
    activityId: skill.id,
    activityName: skill.title,
    xp: WORKSHOP_XP.skill,
    badge: "Outdoor Learner",
  };
}

export function expeditionCompletionPayload(expeditionId: string, photoUrl?: string) {
  const found =
    WEEKLY_EXPEDITIONS.find((e) => e.id === expeditionId) || featuredExpedition();
  return {
    type: "complete" as const,
    key: `expedition:${found.id}`,
    activityType: "expedition",
    activityId: found.id,
    activityName: found.title,
    xp: WORKSHOP_XP.expedition,
    badge: "Weekly Explorer",
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
    badge: "Creative Heart",
    photoUrl,
  };
}

export type { WorkshopTabId };
