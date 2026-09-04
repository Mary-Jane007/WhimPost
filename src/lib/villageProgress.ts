import type { Database } from "better-sqlite3";
import {
  COLLECTIBLE_META,
  collectiblesForVillage,
  emptyCollectibles,
  parseCollectibles,
  rankFromRep,
  REP_REWARDS,
  type CollectibleKind,
  type VillageId,
} from "./villages";

export function addReputation(db: Database, userId: string, amount: number) {
  db.prepare(
    `UPDATE users SET reputation = reputation + ? WHERE id = ?`
  ).run(amount, userId);
}

function getUserVillageId(db: Database, userId: string): VillageId | null {
  const row = db
    .prepare(`SELECT village_id FROM users WHERE id = ?`)
    .get(userId) as { village_id: string | null } | undefined;
  return (row?.village_id as VillageId) || null;
}

export function grantCollectible(
  db: Database,
  userId: string,
  kind: CollectibleKind,
  amount = 1
) {
  const row = db
    .prepare(`SELECT collectibles_json FROM users WHERE id = ?`)
    .get(userId) as { collectibles_json: string } | undefined;
  if (!row) return;
  const bag = parseCollectibles(row.collectibles_json);
  const max = COLLECTIBLE_META[kind].max;
  bag[kind] = Math.min(max, bag[kind] + amount);
  db.prepare(`UPDATE users SET collectibles_json = ? WHERE id = ?`).run(
    JSON.stringify(bag),
    userId
  );
}

function grantFromVillagePack(
  db: Database,
  userId: string,
  villageId: VillageId | null,
  index: number
): CollectibleKind | null {
  const pack = collectiblesForVillage(villageId);
  if (pack.length === 0) return null;
  const kind = pack[index % pack.length];
  grantCollectible(db, userId, kind);
  return kind;
}

export type LetterRewardResult = {
  reputationGained: number;
  collectibles: CollectibleKind[];
};

/** Rewards for sending a letter — reputation + chance at village collectibles. */
export function rewardLetterSent(
  db: Database,
  userId: string,
  bodyLength: number
): LetterRewardResult {
  const villageId = getUserVillageId(db, userId);
  let reputationGained = REP_REWARDS.sendLetter;
  addReputation(db, userId, REP_REWARDS.sendLetter);
  const collectibles: CollectibleKind[] = [];

  if (bodyLength >= 280) {
    addReputation(db, userId, REP_REWARDS.longLetter);
    reputationGained += REP_REWARDS.longLetter;
    const a = grantFromVillagePack(db, userId, villageId, 0);
    const b = grantFromVillagePack(db, userId, villageId, 2);
    if (a) collectibles.push(a);
    if (b) collectibles.push(b);
  }
  if (bodyLength >= 120) {
    const c = grantFromVillagePack(db, userId, villageId, 1);
    if (c) collectibles.push(c);
  }

  const roll = bodyLength % 7;
  if (roll <= 3) {
    const d = grantFromVillagePack(db, userId, villageId, 3 + roll);
    if (d) collectibles.push(d);
  }

  return { reputationGained, collectibles };
}

export function rewardWelcome(db: Database, userId: string): LetterRewardResult {
  const villageId = getUserVillageId(db, userId);
  addReputation(db, userId, REP_REWARDS.welcomeFriend);
  const kind = grantFromVillagePack(db, userId, villageId, 0);
  return {
    reputationGained: REP_REWARDS.welcomeFriend,
    collectibles: kind ? [kind] : [],
  };
}

export function getVillageReputation(db: Database, villageId: VillageId) {
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(reputation), 0) as total FROM users WHERE village_id = ?`
    )
    .get(villageId) as { total: number };
  return Number(row.total) || 0;
}

export function getVillageMemberCount(db: Database, villageId: VillageId) {
  const row = db
    .prepare(`SELECT COUNT(*) as c FROM users WHERE village_id = ?`)
    .get(villageId) as { c: number };
  return Number(row.c) || 0;
}

export function getUserVillageStats(db: Database, userId: string) {
  const row = db
    .prepare(
      `SELECT village_id, home_village_id, reputation, collectibles_json FROM users WHERE id = ?`
    )
    .get(userId) as
    | {
        village_id: string | null;
        home_village_id: string | null;
        reputation: number;
        collectibles_json: string;
      }
    | undefined;

  if (!row) {
    return {
      villageId: null as VillageId | null,
      homeVillageId: null as VillageId | null,
      reputation: 0,
      collectibles: emptyCollectibles(),
      rank: rankFromRep(0),
    };
  }

  const reputation = Number(row.reputation) || 0;
  const villageId = (row.village_id as VillageId) || null;
  const homeVillageId =
    (row.home_village_id as VillageId) || villageId || null;
  return {
    villageId,
    homeVillageId,
    reputation,
    collectibles: parseCollectibles(row.collectibles_json),
    rank: rankFromRep(reputation),
  };
}

export function villageUnlockLevel(villageRep: number) {
  if (villageRep >= 200) return 4;
  if (villageRep >= 100) return 3;
  if (villageRep >= 40) return 2;
  if (villageRep >= 15) return 1;
  return 0;
}
