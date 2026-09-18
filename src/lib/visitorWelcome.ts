import type Database from "better-sqlite3";
import { exportPersistentAccounts } from "@/lib/persistentAccounts";
import {
  getVillage,
  isVillageId,
  type VillageId,
} from "@/lib/villages";

export type VisitorWelcomeGreeting = {
  villageId: VillageId;
  kicker: string;
  title: string;
  body: string;
  closing: string;
  cta: string;
};

const VISITOR_GREETINGS: Record<VillageId, Omit<VisitorWelcomeGreeting, "villageId">> = {
  mosshollow: {
    kicker: "A soft hello from the shelves",
    title: "Welcome, wandering reader",
    body: `You've stepped beneath Mosshollow's oaks as a guest, not a resident — and that is exactly right.

The library keeps every story that arrives, even the ones that only stay for an afternoon. Wander the quiet aisles, borrow a little hush from the moss, and leave when the path calls you onward.

Your home village still holds your permanent belonging. Here, you are simply welcome to browse.`,
    closing: "May a forgotten page find you before you go.",
    cta: "Wander on",
  },
  clovermeadow: {
    kicker: "A wave from the meadow gate",
    title: "Welcome, kind visitor",
    body: `Clovermeadow opens its lanes to travelers the way flowers open to morning light.

You needn't put down roots to enjoy the bloom. Stroll the paths, smile at a neighbor, and carry a little warmth with you when you return home.

Your own village remains your belonging — this meadow is simply glad you passed through.`,
    closing: "May kindness travel with you between the hedges.",
    cta: "Keep wandering",
  },
  moonmere: {
    kicker: "A lantern for the lakeshore",
    title: "Welcome beneath the visiting moon",
    body: `Moonmere receives night-walkers and daydreamers alike.

You are not asked to stay forever — only to notice the water's quiet, the silver hush of the dock, and whatever thought arrives after sunset. When you are ready, your home village will still be waiting.

Wander freely. The stars do not mind company that comes and goes.`,
    closing: "May a soft reflection keep you company on the path home.",
    cta: "Continue wandering",
  },
  bramblewood: {
    kicker: "A nod from the trailhead",
    title: "Welcome, trail-curious visitor",
    body: `Bramblewood loves a guest who arrives with muddy boots and unanswered questions.

The dens and winding paths are open to explorers who call another village home. Follow a fox-track, poke at a mystery, then turn back toward your own hearth whenever you like.

You belong elsewhere — and still, you are welcome on this adventure.`,
    closing: "May curiosity mark the map between villages.",
    cta: "Explore onward",
  },
  hearthwick: {
    kicker: "A seat by the visiting fire",
    title: "Welcome, warm-hearted guest",
    body: `Hearthwick always keeps a spare chair for someone just passing through.

You need not claim this village as home to share a cup, a story, or a quiet moment by the fire. Stay as long as the kettle sings, then return to the place that holds your name.

Visitors are cherished here — then sent onward with full hearts.`,
    closing: "May every village you visit feel a little like coming home.",
    cta: "Return to wandering",
  },
};

function parseVillageIdList(raw: string | null | undefined): VillageId[] {
  try {
    const parsed = JSON.parse(raw || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is VillageId => typeof id === "string" && isVillageId(id));
  } catch {
    return [];
  }
}

export function getVisitorWelcomeGreeting(
  villageId: VillageId
): VisitorWelcomeGreeting | null {
  const copy = VISITOR_GREETINGS[villageId];
  const village = getVillage(villageId);
  if (!copy || !village) return null;
  return { villageId, ...copy };
}

export function getSeenVisitorWelcomes(
  db: Database.Database,
  userId: string
): VillageId[] {
  const row = db
    .prepare(
      `SELECT COALESCE(visitor_welcomes_json, '[]') AS visitor_welcomes_json
       FROM users WHERE id = ?`
    )
    .get(userId) as { visitor_welcomes_json: string } | undefined;
  return parseVillageIdList(row?.visitor_welcomes_json);
}

export function hasSeenVisitorWelcome(
  db: Database.Database,
  userId: string,
  villageId: VillageId
) {
  return getSeenVisitorWelcomes(db, userId).includes(villageId);
}

export function markVisitorWelcomeSeen(
  db: Database.Database,
  userId: string,
  villageId: VillageId
) {
  if (!isVillageId(villageId)) return false;
  const current = getSeenVisitorWelcomes(db, userId);
  if (current.includes(villageId)) return false;
  const next = [...current, villageId].sort();
  db.prepare(`UPDATE users SET visitor_welcomes_json = ? WHERE id = ?`).run(
    JSON.stringify(next),
    userId
  );
  try {
    exportPersistentAccounts(db);
  } catch (err) {
    console.error("[visitor-welcome] persist failed:", err);
  }
  return true;
}

/**
 * Pending visitor greeting when the villager is away from home
 * and has not yet dismissed this village's wanderer welcome.
 */
export function getPendingVisitorWelcome(
  db: Database.Database,
  userId: string,
  villageId: string | null | undefined,
  homeVillageId: string | null | undefined
): VisitorWelcomeGreeting | null {
  if (!villageId || !isVillageId(villageId)) return null;
  const home =
    homeVillageId && isVillageId(homeVillageId) ? homeVillageId : null;
  // Home villagers get the letter, not the visitor popup.
  if (!home || home === villageId) return null;
  if (hasSeenVisitorWelcome(db, userId, villageId)) return null;
  return getVisitorWelcomeGreeting(villageId);
}

export function mergeVisitorWelcomesJson(
  a: string | null | undefined,
  b: string | null | undefined
) {
  const set = new Set([
    ...parseVillageIdList(a),
    ...parseVillageIdList(b),
  ]);
  return JSON.stringify([...set].sort());
}
