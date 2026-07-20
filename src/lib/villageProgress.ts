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
) {
  const pack = collectiblesForVillage(villageId);
  if (pack.length === 0) return;
  grantCollectible(db, userId, pack[index % pack.length]);
}

/** Rewards for sending a letter — reputation + chance at village collectibles. */
export function rewardLetterSent(
  db: Database,
  userId: string,
  bodyLength: number
) {
  const villageId = getUserVillageId(db, userId);
  addReputation(db, userId, REP_REWARDS.sendLetter);

  if (bodyLength >= 280) {
    addReputation(db, userId, REP_REWARDS.longLetter);
    grantFromVillagePack(db, userId, villageId, 0);
    grantFromVillagePack(db, userId, villageId, 2);
  }
  if (bodyLength >= 120) {
    grantFromVillagePack(db, userId, villageId, 1);
  }

  const roll = bodyLength % 7;
  if (roll <= 3) {
    grantFromVillagePack(db, userId, villageId, 3 + roll);
  }
}

export function rewardWelcome(db: Database, userId: string) {
  const villageId = getUserVillageId(db, userId);
  addReputation(db, userId, REP_REWARDS.welcomeFriend);
  // First keepsake in the village pack (butterflies / pink butterflies)
  grantFromVillagePack(db, userId, villageId, 0);
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
      `SELECT village_id, reputation, collectibles_json FROM users WHERE id = ?`
    )
    .get(userId) as
    | {
        village_id: string | null;
        reputation: number;
        collectibles_json: string;
      }
    | undefined;

  if (!row) {
    return {
      villageId: null as VillageId | null,
      reputation: 0,
      collectibles: emptyCollectibles(),
      rank: rankFromRep(0),
    };
  }

  const reputation = Number(row.reputation) || 0;
  return {
    villageId: (row.village_id as VillageId) || null,
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
