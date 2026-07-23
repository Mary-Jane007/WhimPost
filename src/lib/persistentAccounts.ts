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

/** Write every local user into the git-tracked snapshot. */
export function exportPersistentAccounts(db: Database) {
  writeFile(listUsersFromDb(db));
}

/**
 * Restore accounts from the snapshot into SQLite.
 * Inserts missing users and refreshes credentials / profile fields for known ids
 * so a new empty server can accept the same logins.
 */
export function importPersistentAccounts(db: Database) {
  const file = readFile();
  if (!file || file.accounts.length === 0) return;

  const insert = db.prepare(
    `INSERT INTO users (
      id, username, display_name, email, password_hash, bio, forest_name,
      is_owner, village_id, reputation, collectibles_json, created_at
    ) VALUES (
      @id, @username, @display_name, @email, @password_hash, @bio, @forest_name,
      @is_owner, @village_id, @reputation, @collectibles_json, @created_at
    )
    ON CONFLICT(id) DO UPDATE SET
      username = excluded.username,
      display_name = excluded.display_name,
      email = excluded.email,
      password_hash = excluded.password_hash,
      bio = excluded.bio,
      forest_name = excluded.forest_name,
      is_owner = excluded.is_owner,
      village_id = excluded.village_id,
      reputation = excluded.reputation,
      collectibles_json = excluded.collectibles_json`
  );

  const sync = db.transaction((accounts: PersistentAccount[]) => {
    for (const account of accounts) {
      insert.run({
        id: account.id,
        username: account.username,
        display_name: account.display_name,
        email: account.email,
        password_hash: account.password_hash,
        bio: account.bio ?? "",
        forest_name: account.forest_name ?? "",
        is_owner: account.is_owner ? 1 : 0,
        village_id: account.village_id,
        reputation: account.reputation ?? 0,
        collectibles_json: account.collectibles_json || "{}",
        created_at: account.created_at || new Date().toISOString(),
      });
    }
  });

  sync(file.accounts);
}
