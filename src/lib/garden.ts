import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import {
  BLOOM_FLOWERS,
  GARDEN_COLLECTIONS,
  GARDEN_XP,
  KINDNESS_MISSIONS,
  SPOT_FLOWERS,
  WILD_VISITORS,
  bloomFlowerForKey,
  dailyTasksForDay,
  featuredJoySeed,
  titleForGardenXp,
  weeklyKindness,
} from "@/lib/gardenContent";

export type GardenJournalEntry = {
  id: string;
  activityType: string;
  activityId: string;
  activityName: string;
  flower: string;
  note: string;
  mood: string;
  photoUrl: string | null;
  xpEarned: number;
  createdAt: string;
};

export type GardenWish = {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
  gestures: Record<string, number>;
};

export type JoyPetal = {
  id: string;
  promptId: string;
  body: string;
  createdAt: string;
};

export type GardenProgress = {
  xp: number;
  title: ReturnType<typeof titleForGardenXp>;
  badges: string[];
  decorations: string[];
  blooms: number;
  dailyDone: Record<string, boolean>;
  spotted: Record<string, { photoUrl?: string }>;
  kindnessDone: Record<string, boolean>;
  rareFlowers: string[];
  visitors: Record<string, boolean>;
  collections: Record<string, number>;
  wishId: string | null;
  wishWeek: number;
  journal: GardenJournalEntry[];
  wishes: GardenWish[];
  petals: JoyPetal[];
  communityBlooms: number;
  communityKindness: number;
  featured: {
    dailyIds: string[];
    kindnessIds: string[];
    joySeedId: string;
  };
};

type ProgressRow = {
  user_id: string;
  xp: number;
  badges_json: string;
  decorations_json: string;
  blooms: number;
  daily_json: string;
  spotted_json: string;
  kindness_json: string;
  rare_json: string;
  visitors_json: string;
  collections_json: string;
  wish_id: string | null;
  wish_week: number;
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
    .prepare(`SELECT user_id FROM garden_progress WHERE user_id = ?`)
    .get(userId) as { user_id: string } | undefined;
  if (existing) return;
  db.prepare(`INSERT INTO garden_progress (user_id, xp, blooms) VALUES (?, 0, 1)`).run(
    userId
  );
}

function ensureCommunityRow() {
  const db = getDb();
  const row = db
    .prepare(`SELECT id FROM garden_community WHERE id = 'clovermeadow'`)
    .get() as { id: string } | undefined;
  if (row) return;
  db.prepare(
    `INSERT INTO garden_community (id, blooms, kindness) VALUES ('clovermeadow', 0, 0)`
  ).run();
}

function readCommunity() {
  ensureCommunityRow();
  const db = getDb();
  return db
    .prepare(`SELECT blooms, kindness FROM garden_community WHERE id = 'clovermeadow'`)
    .get() as { blooms: number; kindness: number };
}

function bumpCommunity(blooms = 0, kindness = 0) {
  ensureCommunityRow();
  const db = getDb();
  db.prepare(
    `UPDATE garden_community
     SET blooms = blooms + ?, kindness = kindness + ?, updated_at = datetime('now')
     WHERE id = 'clovermeadow'`
  ).run(blooms, kindness);
}

function readRow(userId: string): ProgressRow {
  ensureProgressRow(userId);
  const db = getDb();
  return db
    .prepare(`SELECT * FROM garden_progress WHERE user_id = ?`)
    .get(userId) as ProgressRow;
}

function listJournal(userId: string): GardenJournalEntry[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, activity_type, activity_id, activity_name, flower, note, mood, photo_url, xp_earned, created_at
       FROM garden_journal WHERE user_id = ?
       ORDER BY created_at DESC LIMIT 80`
    )
    .all(userId) as Array<{
    id: string;
    activity_type: string;
    activity_id: string;
    activity_name: string;
    flower: string;
    note: string;
    mood: string;
    photo_url: string | null;
    xp_earned: number;
    created_at: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    activityType: r.activity_type,
    activityId: r.activity_id,
    activityName: r.activity_name,
    flower: r.flower,
    note: r.note,
    mood: r.mood,
    photoUrl: r.photo_url,
    xpEarned: r.xp_earned,
    createdAt: r.created_at,
  }));
}

function listWishes(): GardenWish[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT w.id, w.body, w.gestures_json, w.created_at, u.display_name
       FROM garden_wishes w
       JOIN users u ON u.id = w.user_id
       ORDER BY w.created_at DESC
       LIMIT 40`
    )
    .all() as Array<{
    id: string;
    body: string;
    gestures_json: string;
    created_at: string;
    display_name: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    authorName: r.display_name,
    createdAt: r.created_at,
    gestures: parseJson(r.gestures_json, {}),
  }));
}

function listPetals(promptId: string): JoyPetal[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, prompt_id, body, created_at
       FROM garden_petals WHERE prompt_id = ?
       ORDER BY created_at DESC LIMIT 50`
    )
    .all(promptId) as Array<{
    id: string;
    prompt_id: string;
    body: string;
    created_at: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    promptId: r.prompt_id,
    body: r.body,
    createdAt: r.created_at,
  }));
}

function insertJournal(input: {
  userId: string;
  activityType: string;
  activityId: string;
  activityName: string;
  flower?: string;
  note?: string;
  mood?: string;
  photoUrl?: string | null;
  xpEarned: number;
}) {
  const db = getDb();
  db.prepare(
    `INSERT INTO garden_journal
      (id, user_id, activity_type, activity_id, activity_name, flower, note, mood, photo_url, xp_earned)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    randomUUID(),
    input.userId,
    input.activityType,
    input.activityId,
    input.activityName,
    input.flower || "",
    (input.note || "").slice(0, 2000),
    (input.mood || "").slice(0, 80),
    input.photoUrl || null,
    input.xpEarned
  );
}

function addBadge(badges: string[], badge: string) {
  if (!badges.includes(badge)) badges.push(badge);
  return badges;
}

function currentWishWeek(now = new Date()) {
  return Math.floor(now.getTime() / (7 * 86_400_000));
}

export function getGardenProgress(userId: string): GardenProgress {
  const row = readRow(userId);
  const community = readCommunity();
  const daily = dailyTasksForDay();
  const kindness = weeklyKindness();
  const seed = featuredJoySeed();

  return {
    xp: Number(row.xp) || 0,
    title: titleForGardenXp(Number(row.xp) || 0),
    badges: parseJson(row.badges_json, []),
    decorations: parseJson(row.decorations_json, []),
    blooms: Number(row.blooms) || 1,
    dailyDone: parseJson(row.daily_json, {}),
    spotted: parseJson(row.spotted_json, {}),
    kindnessDone: parseJson(row.kindness_json, {}),
    rareFlowers: parseJson(row.rare_json, []),
    visitors: parseJson(row.visitors_json, {}),
    collections: parseJson(row.collections_json, {}),
    wishId: row.wish_id,
    wishWeek: Number(row.wish_week) || 0,
    journal: listJournal(userId),
    wishes: listWishes(),
    petals: listPetals(seed.id),
    communityBlooms: Number(community.blooms) || 0,
    communityKindness: Number(community.kindness) || 0,
    featured: {
      dailyIds: daily.map((d) => d.id),
      kindnessIds: kindness.map((k) => k.id),
      joySeedId: seed.id,
    },
  };
}

export type GardenAction =
  | { type: "completeDaily"; taskId: string; note?: string; mood?: string }
  | {
      type: "spotFlower";
      flowerId: string;
      photoUrl?: string;
      note?: string;
      mood?: string;
    }
  | { type: "completeKindness"; missionId: string; note?: string; mood?: string }
  | { type: "submitSeed"; promptId: string; body: string }
  | { type: "hangWish"; body: string }
  | { type: "encourageWish"; wishId: string; gesture: string }
  | {
      type: "journalEntry";
      activityName: string;
      note: string;
      mood?: string;
      flower?: string;
      photoUrl?: string;
    };

export function applyGardenAction(
  userId: string,
  action: GardenAction
): GardenProgress {
  const db = getDb();
  ensureProgressRow(userId);
  const row = readRow(userId);
  let xp = Number(row.xp) || 0;
  let badges = parseJson<string[]>(row.badges_json, []);
  let decorations = parseJson<string[]>(row.decorations_json, []);
  let blooms = Number(row.blooms) || 1;
  const dailyDone = parseJson<Record<string, boolean>>(row.daily_json, {});
  const spotted = parseJson<Record<string, { photoUrl?: string }>>(
    row.spotted_json,
    {}
  );
  const kindnessDone = parseJson<Record<string, boolean>>(row.kindness_json, {});
  let rareFlowers = parseJson<string[]>(row.rare_json, []);
  const visitors = parseJson<Record<string, boolean>>(row.visitors_json, {});
  const collections = parseJson<Record<string, number>>(
    row.collections_json,
    {}
  );
  let wishId = row.wish_id;
  let wishWeek = Number(row.wish_week) || 0;

  const bumpCollection = (id: string, by = 1) => {
    collections[id] = (collections[id] || 0) + by;
    const meta = GARDEN_COLLECTIONS.find((c) => c.id === id);
    if (meta && collections[id] >= meta.need) {
      if (!decorations.includes(meta.decoration)) {
        decorations = [...decorations, meta.decoration];
      }
      badges = addBadge(badges, `${meta.title} Collection`);
    }
  };

  const refreshVisitors = () => {
    for (const v of WILD_VISITORS) {
      if (blooms >= v.needBlooms) visitors[v.id] = true;
    }
  };

  const bloomOne = (key: string) => {
    blooms += 1;
    bumpCommunity(1, 0);
    return bloomFlowerForKey(key);
  };

  if (action.type === "completeDaily") {
    const todays = dailyTasksForDay();
    const task = todays.find((t) => t.id === action.taskId);
    const dayKey = `${Math.floor(Date.now() / 86_400_000)}:${action.taskId}`;
    if (task && !dailyDone[dayKey]) {
      dailyDone[dayKey] = true;
      const flower = bloomOne(dayKey);
      xp += GARDEN_XP.daily;
      bumpCollection("wildflowers");
      refreshVisitors();
      insertJournal({
        userId,
        activityType: "daily",
        activityId: action.taskId,
        activityName: task.label,
        flower,
        note: action.note || "A small kindness made the meadow brighter.",
        mood: action.mood || "gentle",
        xpEarned: GARDEN_XP.daily,
      });
    }
  } else if (action.type === "spotFlower") {
    const flower = SPOT_FLOWERS.find((f) => f.id === action.flowerId);
    if (flower && !spotted[flower.id]) {
      spotted[flower.id] = { photoUrl: action.photoUrl };
      const bloomName = bloomOne(`spot:${flower.id}`);
      xp += GARDEN_XP.spotting;
      if (["daisy", "dandelion", "clover", "bluebell"].includes(flower.id)) {
        bumpCollection("wildflowers");
      }
      if (["tulip", "bluebell", "cherry-blossom"].includes(flower.id)) {
        bumpCollection("spring");
      }
      if (["sunflower", "lavender", "hibiscus"].includes(flower.id)) {
        bumpCollection("summer");
      }
      if (["hydrangea", "rose"].includes(flower.id)) bumpCollection("autumn");
      if (["lavender", "clover"].includes(flower.id)) bumpCollection("herbs");
      if (["hibiscus", "bougainvillea", "cherry-blossom"].includes(flower.id)) {
        bumpCollection("rare");
      }
      refreshVisitors();
      insertJournal({
        userId,
        activityType: "spotting",
        activityId: flower.id,
        activityName: `Spotted · ${flower.name}`,
        flower: bloomName,
        note:
          action.note ||
          `${flower.facts} Symbolism: ${flower.symbolism}.`,
        mood: action.mood || "wonder",
        photoUrl: action.photoUrl,
        xpEarned: GARDEN_XP.spotting,
      });
    }
  } else if (action.type === "completeKindness") {
    const mission =
      weeklyKindness().find((m) => m.id === action.missionId) ||
      KINDNESS_MISSIONS.find((m) => m.id === action.missionId);
    if (mission && !kindnessDone[mission.id]) {
      kindnessDone[mission.id] = true;
      const flower = bloomOne(`kind:${mission.id}`);
      if (!rareFlowers.includes(mission.rareFlower)) {
        rareFlowers = [...rareFlowers, mission.rareFlower];
      }
      xp += GARDEN_XP.kindness;
      bumpCommunity(1, 1);
      bumpCollection("rare");
      refreshVisitors();
      insertJournal({
        userId,
        activityType: "kindness",
        activityId: mission.id,
        activityName: mission.label,
        flower: `${flower} · ${mission.rareFlower}`,
        note: action.note || mission.detail,
        mood: action.mood || "warm",
        xpEarned: GARDEN_XP.kindness,
      });
    }
  } else if (action.type === "submitSeed") {
    const body = action.body.trim().slice(0, 500);
    if (body.length >= 3) {
      db.prepare(
        `INSERT INTO garden_petals (id, user_id, prompt_id, body)
         VALUES (?, ?, ?, ?)`
      ).run(randomUUID(), userId, action.promptId, body);
      const flower = bloomOne(`seed:${Date.now()}`);
      xp += GARDEN_XP.seed;
      refreshVisitors();
      insertJournal({
        userId,
        activityType: "seed",
        activityId: action.promptId,
        activityName: "Seed of Joy",
        flower,
        note: body,
        mood: "joyful",
        xpEarned: GARDEN_XP.seed,
      });
    }
  } else if (action.type === "hangWish") {
    const week = currentWishWeek();
    const body = action.body.trim().slice(0, 280);
    if (body.length >= 8 && (wishWeek !== week || !wishId)) {
      const id = randomUUID();
      db.prepare(
        `INSERT INTO garden_wishes (id, user_id, body, gestures_json)
         VALUES (?, ?, ?, '{}')`
      ).run(id, userId, body);
      wishId = id;
      wishWeek = week;
      xp += GARDEN_XP.wish;
      const flower = bloomOne(`wish:${id}`);
      insertJournal({
        userId,
        activityType: "wish",
        activityId: id,
        activityName: "Wish Tree",
        flower,
        note: body,
        mood: "hopeful",
        xpEarned: GARDEN_XP.wish,
      });
    }
  } else if (action.type === "encourageWish") {
    const wish = db
      .prepare(`SELECT id, gestures_json, user_id FROM garden_wishes WHERE id = ?`)
      .get(action.wishId) as
      | { id: string; gestures_json: string; user_id: string }
      | undefined;
    if (wish && wish.user_id !== userId) {
      const gestures = parseJson<Record<string, number>>(wish.gestures_json, {});
      gestures[action.gesture] = (gestures[action.gesture] || 0) + 1;
      db.prepare(`UPDATE garden_wishes SET gestures_json = ? WHERE id = ?`).run(
        JSON.stringify(gestures),
        wish.id
      );
      xp += GARDEN_XP.encourage;
    }
  } else if (action.type === "journalEntry") {
    const note = action.note.trim().slice(0, 2000);
    const name = action.activityName.trim().slice(0, 120);
    if (name && note) {
      xp += GARDEN_XP.journal;
      insertJournal({
        userId,
        activityType: "journal",
        activityId: `custom-${Date.now()}`,
        activityName: name,
        flower: action.flower || BLOOM_FLOWERS[0],
        note,
        mood: action.mood || "soft",
        photoUrl: action.photoUrl,
        xpEarned: GARDEN_XP.journal,
      });
    }
  }

  // Community milestone badges for this villager when thresholds crossed.
  const community = readCommunity();
  if (community.blooms >= 10000) badges = addBadge(badges, "Meadow Butterfly Badge");
  if (community.kindness >= 25000) badges = addBadge(badges, "Cherry Blossom Badge");
  if (community.blooms >= 50000) badges = addBadge(badges, "Fountain Keeper Badge");
  if (community.blooms >= 100000) badges = addBadge(badges, "Clover Festival Badge");

  db.prepare(
    `UPDATE garden_progress SET
      xp = ?,
      badges_json = ?,
      decorations_json = ?,
      blooms = ?,
      daily_json = ?,
      spotted_json = ?,
      kindness_json = ?,
      rare_json = ?,
      visitors_json = ?,
      collections_json = ?,
      wish_id = ?,
      wish_week = ?,
      updated_at = datetime('now')
     WHERE user_id = ?`
  ).run(
    xp,
    JSON.stringify(badges),
    JSON.stringify(decorations),
    blooms,
    JSON.stringify(dailyDone),
    JSON.stringify(spotted),
    JSON.stringify(kindnessDone),
    JSON.stringify(rareFlowers),
    JSON.stringify(visitors),
    JSON.stringify(collections),
    wishId,
    wishWeek,
    userId
  );

  return getGardenProgress(userId);
}
