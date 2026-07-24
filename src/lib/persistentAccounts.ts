import type { Database } from "better-sqlite3";
import fs from "fs";
import path from "path";

/** Git-tracked account snapshot so logins survive fresh servers / empty SQLite. */
export const PERSISTENT_ACCOUNTS_PATH = path.join(
  process.cwd(),
  "data",
  "persistent-accounts.json"
);

export type PersistentAccount = {
  id: string;
  username: string;
  display_name: string;
  email: string;
  password_hash: string;
  bio: string;
  forest_name: string;
  is_owner: number;
  village_id: string | null;
  reputation: number;
  collectibles_json: string;
  created_at: string;
};

type PersistentAccountsFile = {
  version: 1;
  updatedAt: string;
  accounts: PersistentAccount[];
};

function readFile(): PersistentAccountsFile | null {
  try {
    if (!fs.existsSync(PERSISTENT_ACCOUNTS_PATH)) return null;
    const raw = fs.readFileSync(PERSISTENT_ACCOUNTS_PATH, "utf8");
    if (!raw.trim()) return null;
    const parsed = JSON.parse(raw) as PersistentAccountsFile;
    if (!parsed || !Array.isArray(parsed.accounts)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeFile(accounts: PersistentAccount[]) {
  const dir = path.dirname(PERSISTENT_ACCOUNTS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const payload: PersistentAccountsFile = {
    version: 1,
    updatedAt: new Date().toISOString(),
    accounts: accounts.sort((a, b) => a.username.localeCompare(b.username)),
  };

  const tmp = `${PERSISTENT_ACCOUNTS_PATH}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.renameSync(tmp, PERSISTENT_ACCOUNTS_PATH);
}

function listUsersFromDb(db: Database): PersistentAccount[] {
  return db
    .prepare(
      `SELECT id, username, display_name, email, password_hash, bio, forest_name,
              is_owner, village_id, reputation, collectibles_json, created_at
       FROM users`
    )
    .all() as PersistentAccount[];
}

/**
 * Persist owner + village system senders only.
 * Ephemeral test/register accounts stay local so they don't pollute the snapshot.
 */
export function exportPersistentAccounts(db: Database) {
  const keep = listUsersFromDb(db).filter(
    (u) => u.is_owner || String(u.id).startsWith("system-")
  );
  writeFile(keep);
}

/**
 * Restore accounts from the snapshot into SQLite.
 * Matches by id, username, or email so a local user with a different UUID still
 * gets credentials refreshed (keeps the local id for foreign-key integrity).
 * Inserts only when no matching account exists.
 */
export function importPersistentAccounts(db: Database) {
  const file = readFile();
  if (!file || file.accounts.length === 0) return;

  const findMatch = db.prepare(
    `SELECT id FROM users
     WHERE id = ?
        OR lower(username) = lower(?)
        OR lower(email) = lower(?)
     LIMIT 1`
  );

  const insert = db.prepare(
    `INSERT INTO users (
      id, username, display_name, email, password_hash, bio, forest_name,
      is_owner, village_id, reputation, collectibles_json, created_at
    ) VALUES (
      @id, @username, @display_name, @email, @password_hash, @bio, @forest_name,
      @is_owner, @village_id, @reputation, @collectibles_json, @created_at
    )`
  );

  const update = db.prepare(
    `UPDATE users SET
      username = @username,
      display_name = @display_name,
      email = @email,
      password_hash = @password_hash,
      bio = @bio,
      forest_name = @forest_name,
      is_owner = @is_owner,
      village_id = @village_id,
      reputation = @reputation,
      collectibles_json = @collectibles_json
     WHERE id = @id`
  );

  const sync = db.transaction((accounts: PersistentAccount[]) => {
    for (const account of accounts) {
      const username = String(account.username || "").trim();
      const email = String(account.email || "").trim();
      if (!username || !email || !account.password_hash) continue;

      const matched = findMatch.get(account.id, username, email) as
        | { id: string }
        | undefined;

      const row = {
        id: matched?.id ?? account.id,
        username,
        display_name: account.display_name || username,
        email,
        password_hash: account.password_hash,
        bio: account.bio ?? "",
        forest_name: account.forest_name ?? "",
        is_owner: account.is_owner ? 1 : 0,
        village_id: account.village_id,
        reputation: account.reputation ?? 0,
        collectibles_json: account.collectibles_json || "{}",
        created_at: account.created_at || new Date().toISOString(),
      };

      if (matched) {
        update.run(row);
      } else {
        insert.run(row);
      }
    }
  });

  sync(file.accounts);
}
