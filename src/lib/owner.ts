import type { Database } from "better-sqlite3";

/** Persist the signed-in account as site owner when none exists yet. */
export function claimOwnerIfUnset(db: Database, userId: string): boolean {
  const existing = db
    .prepare(`SELECT id FROM users WHERE is_owner = 1 LIMIT 1`)
    .get() as { id: string } | undefined;

  if (existing) {
    return existing.id === userId;
  }

  db.prepare(`UPDATE users SET is_owner = 1 WHERE id = ?`).run(userId);
  return true;
}

export function isSiteOwner(db: Database, userId: string): boolean {
  const row = db
    .prepare(`SELECT is_owner FROM users WHERE id = ?`)
    .get(userId) as { is_owner: number } | undefined;
  return Boolean(row?.is_owner);
}
