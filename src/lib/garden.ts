import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import {
  BLOOM_FLOWERS,
  GARDEN_COLLECTIONS,
  GARDEN_XP,
  KINDNESS_MISSIONS,
  NATURE_JOURNAL_REWARDS,
  SPOT_FLOWERS,
  bloomFlowerForKey,
  currentGardenSeason,
  dailyTasksForDay,
  evaluateWildVisitors,
  featuredJoySeed,
  natureJournalProgress,
  syncBloomDecorations,
  titleForGardenXp,
  weeklyKindness,
} from "@/lib/gardenContent";
import {
  GARDEN_XP_COLLECTIBLE_GIFTS,
  claimXpCollectibleGifts,
} from "@/lib/workshopXpGifts";
import type { CollectibleKind } from "@/lib/villages";

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
  journal: GardenJournalEntry[];
  petals: JoyPetal[];
  communityBlooms: number;
  communityKindness: number;
  xpGiftsClaimed: string[];
  featured: {
    dailyIds: string[];
    kindnessIds: string[];
    joySeedId: string;
  };
};

export type GardenActionResult = {
  progress: GardenProgress;
  grantedCollectibles: CollectibleKind[];
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
  xp_gifts_json?: string;
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
    .prepare(
      `SELECT user_id, xp, badges_json, decorations_json, blooms, daily_json,
              spotted_json, kindness_json, rare_json, visitors_json,
              collections_json, wish_id, wish_week, xp_gifts_json
       FROM garden_progress WHERE user_id = ?`
    )
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

function persistAttractors(
  userId: string,
  input: {
    badges: string[];
    decorations: string[];
    visitors: Record<string, boolean>;
  }
) {
  const db = getDb();
  db.prepare(
    `UPDATE garden_progress SET
      badges_json = ?,
      decorations_json = ?,
      visitors_json = ?,
      updated_at = datetime('now')
     WHERE user_id = ?`
  ).run(
    JSON.stringify(input.badges),
    JSON.stringify(input.decorations),
    JSON.stringify(input.visitors),
    userId
  );
}

function syncAttractorsForUser(userId: string) {
  const row = readRow(userId);
  const community = readCommunity();
  let badges = parseJson<string[]>(row.badges_json, []);
  let decorations = parseJson<string[]>(row.decorations_json, []);
  const visitors = parseJson<Record<string, boolean>>(row.visitors_json, {});
  const spotted = parseJson<Record<string, unknown>>(row.spotted_json, {});
  const collections = parseJson<Record<string, number>>(
    row.collections_json,
    {}
  );
  const blooms = Number(row.blooms) || 1;

  decorations = syncBloomDecorations(blooms, decorations);
  const arrived = evaluateWildVisitors({
    blooms,
    decorations,
    spotted,
    collections,
    communityBlooms: Number(community.blooms) || 0,
    communityKindness: Number(community.kindness) || 0,
    season: currentGardenSeason(),
  });
  let changed = false;
  for (const [id, on] of Object.entries(arrived)) {
    if (on && !visitors[id]) {
      visitors[id] = true;
      changed = true;
    }
  }
  const beforeDeco = parseJson<string[]>(row.decorations_json, []);
  if (decorations.length !== beforeDeco.length) changed = true;

  const journal = natureJournalProgress(visitors);
  if (journal.complete) {
    if (!decorations.includes(NATURE_JOURNAL_REWARDS.decoration)) {
      decorations = [...decorations, NATURE_JOURNAL_REWARDS.decoration];
      changed = true;
    }
    if (!decorations.includes(NATURE_JOURNAL_REWARDS.lookout)) {
      decorations = [...decorations, NATURE_JOURNAL_REWARDS.lookout];
      changed = true;
    }
    const beforeBadges = badges.length;
    badges = addBadge(badges, NATURE_JOURNAL_REWARDS.badge);
    if (badges.length !== beforeBadges) changed = true;
  }

  if (changed) {
    persistAttractors(userId, { badges, decorations, visitors });
  }

  return { badges, decorations, visitors };
}

export function getGardenProgress(userId: string): GardenProgress {
  const synced = syncAttractorsForUser(userId);
  const row = readRow(userId);
  const community = readCommunity();
  const daily = dailyTasksForDay();
  const kindness = weeklyKindness();
  const seed = featuredJoySeed();

  return {
    xp: Number(row.xp) || 0,
    title: titleForGardenXp(Number(row.xp) || 0),
    badges: synced.badges,
    decorations: synced.decorations,
    blooms: Number(row.blooms) || 1,
    dailyDone: parseJson(row.daily_json, {}),
    spotted: parseJson(row.spotted_json, {}),
    kindnessDone: parseJson(row.kindness_json, {}),
    rareFlowers: parseJson(row.rare_json, []),
    visitors: synced.visitors,
    collections: parseJson(row.collections_json, {}),
    journal: listJournal(userId),
    petals: listPetals(seed.id),
    communityBlooms: Number(community.blooms) || 0,
    communityKindness: Number(community.kindness) || 0,
    xpGiftsClaimed: parseJson(row.xp_gifts_json, []),
    featured: {
      dailyIds: daily.map((d) => d.id),
      kindnessIds: kindness.map((k) => k.id),
      joySeedId: seed.id,
    },
  };
}

export type GardenAction =
  | { type: "completeDaily"; taskId: string; note?: string; mood?: string; photoUrl?: string }
  | {
      type: "spotFlower";
      flowerId: string;
      photoUrl?: string;
      note?: string;
      mood?: string;
    }
  | { type: "completeKindness"; missionId: string; note?: string; mood?: string }
  | { type: "submitSeed"; promptId: string; body: string }
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
): GardenActionResult {
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
  const wishId = row.wish_id;
  const wishWeek = Number(row.wish_week) || 0;
  let xpGiftsClaimed = parseJson<string[]>(row.xp_gifts_json, []);

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
    decorations = syncBloomDecorations(blooms, decorations);
    const community = readCommunity();
    const arrived = evaluateWildVisitors({
      blooms,
      decorations,
      spotted,
      collections,
      communityBlooms: Number(community.blooms) || 0,
      communityKindness: Number(community.kindness) || 0,
      season: currentGardenSeason(),
    });
    for (const [id, on] of Object.entries(arrived)) {
      if (on) visitors[id] = true;
    }
    const journal = natureJournalProgress(visitors);
    if (journal.complete) {
      if (!decorations.includes(NATURE_JOURNAL_REWARDS.decoration)) {
        decorations = [...decorations, NATURE_JOURNAL_REWARDS.decoration];
      }
      if (!decorations.includes(NATURE_JOURNAL_REWARDS.lookout)) {
        decorations = [...decorations, NATURE_JOURNAL_REWARDS.lookout];
      }
      badges = addBadge(badges, NATURE_JOURNAL_REWARDS.badge);
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
      if (task.allowsPhoto && !action.photoUrl) {
        // Photo tasks need an upload; leave incomplete.
      } else {
        dailyDone[dayKey] = true;
        const flower = bloomOne(dayKey);
        let earned = GARDEN_XP.daily;
        if (task.communityBonus) {
          earned += 15;
          bumpCommunity(2, 1);
        }
        xp += earned;
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
          photoUrl: action.photoUrl,
          xpEarned: earned,
        });
      }
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

  const giftResult = claimXpCollectibleGifts(
    db,
    userId,
    xp,
    GARDEN_XP_COLLECTIBLE_GIFTS,
    xpGiftsClaimed
  );
  xpGiftsClaimed = giftResult.claimed;
  const grantedCollectibles = giftResult.granted;

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
      xp_gifts_json = ?,
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
    JSON.stringify(xpGiftsClaimed),
    userId
  );

  return {
    progress: getGardenProgress(userId),
    grantedCollectibles,
  };
}
