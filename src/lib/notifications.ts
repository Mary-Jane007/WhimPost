import type Database from "better-sqlite3";
import {
  COTTAGE_DECOR,
  isDecorUnlocked,
  type CottageDecorId,
} from "@/lib/cottageDecor";
import { parseCollectibles } from "@/lib/villages";

export type NavBadges = {
  inbox: number;
  friends: number;
  unlocks: number;
};

type NotificationsState = {
  seenUnlockIds: CottageDecorId[];
};

function parseNotifications(raw: string | null | undefined): NotificationsState {
  try {
    const parsed = JSON.parse(raw || "{}") as { seenUnlockIds?: unknown };
    const seen = Array.isArray(parsed.seenUnlockIds)
      ? parsed.seenUnlockIds.filter(
          (id): id is CottageDecorId =>
            typeof id === "string" &&
            COTTAGE_DECOR.some((d) => d.id === id)
        )
      : [];
    return { seenUnlockIds: seen };
  } catch {
    return { seenUnlockIds: [] };
  }
}

export function countUnreadLetters(db: Database.Database, userId: string) {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS n FROM letters
       WHERE recipient_id = ? AND status = 'sent' AND is_read = 0`
    )
    .get(userId) as { n: number };
  return Number(row?.n) || 0;
}

export function countPendingFriendRequests(
  db: Database.Database,
  userId: string
) {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS n FROM friendships
       WHERE addressee_id = ? AND status = 'pending'`
    )
    .get(userId) as { n: number };
  return Number(row?.n) || 0;
}

function unlockedEarnableIds(
  reputation: number,
  collectiblesJson: string
): CottageDecorId[] {
  const bag = parseCollectibles(collectiblesJson);
  return COTTAGE_DECOR.filter(
    (d) =>
      d.unlock.type !== "always" && isDecorUnlocked(d, reputation, bag)
  ).map((d) => d.id);
}

export function countUnseenUnlocks(db: Database.Database, userId: string) {
  const user = db
    .prepare(
      `SELECT reputation, collectibles_json, notifications_json
       FROM users WHERE id = ?`
    )
    .get(userId) as
    | {
        reputation: number;
        collectibles_json: string;
        notifications_json: string | null;
      }
    | undefined;
  if (!user) return 0;

  const unlocked = unlockedEarnableIds(
    user.reputation,
    user.collectibles_json
  );
  const seen = new Set(parseNotifications(user.notifications_json).seenUnlockIds);
  return unlocked.filter((id) => !seen.has(id)).length;
}

/** Acknowledge current cottage unlocks so the Village badge clears. */
export function markUnlocksSeen(db: Database.Database, userId: string) {
  const user = db
    .prepare(
      `SELECT reputation, collectibles_json, notifications_json
       FROM users WHERE id = ?`
    )
    .get(userId) as
    | {
        reputation: number;
        collectibles_json: string;
        notifications_json: string | null;
      }
    | undefined;
  if (!user) return;

  const unlocked = unlockedEarnableIds(
    user.reputation,
    user.collectibles_json
  );
  const prev = parseNotifications(user.notifications_json);
  const merged = Array.from(new Set([...prev.seenUnlockIds, ...unlocked]));
  db.prepare(
    `UPDATE users SET notifications_json = ? WHERE id = ?`
  ).run(JSON.stringify({ seenUnlockIds: merged }), userId);
}

export function getNavBadges(
  db: Database.Database,
  userId: string
): NavBadges {
  return {
    inbox: countUnreadLetters(db, userId),
    friends: countPendingFriendRequests(db, userId),
    unlocks: countUnseenUnlocks(db, userId),
  };
}
