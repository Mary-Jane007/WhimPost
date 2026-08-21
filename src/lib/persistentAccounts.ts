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
  home_village_id?: string | null;
  reputation: number;
  collectibles_json: string;
  /** Villages this account has already received a welcome letter for. */
  visited_villages_json: string;
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
              is_owner, village_id, home_village_id, reputation, collectibles_json,
              COALESCE(visited_villages_json, '[]') AS visited_villages_json,
              created_at
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
      is_owner, village_id, home_village_id, reputation, collectibles_json, visited_villages_json,
      created_at
    ) VALUES (
      @id, @username, @display_name, @email, @password_hash, @bio, @forest_name,
      @is_owner, @village_id, @home_village_id, @reputation, @collectibles_json, @visited_villages_json,
      @created_at
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
      home_village_id = @home_village_id,
      reputation = @reputation,
      collectibles_json = @collectibles_json,
      visited_villages_json = @visited_villages_json
     WHERE id = @id`
  );

  const readVisited = db.prepare(
    `SELECT COALESCE(visited_villages_json, '[]') AS visited_villages_json
     FROM users WHERE id = ?`
  );

  const sync = db.transaction((accounts: PersistentAccount[]) => {
    for (const account of accounts) {
      const username = String(account.username || "").trim();
      const email = String(account.email || "").trim();
      if (!username || !email || !account.password_hash) continue;

      const matched = findMatch.get(account.id, username, email) as
        | { id: string }
        | undefined;

      let visited = account.visited_villages_json || "[]";
      if (matched) {
        const local = readVisited.get(matched.id) as
          | { visited_villages_json: string }
          | undefined;
        visited = mergeVisitedJson(visited, local?.visited_villages_json);
      }

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
        home_village_id:
          account.home_village_id || account.village_id || null,
        reputation: account.reputation ?? 0,
        collectibles_json: account.collectibles_json || "{}",
        visited_villages_json: visited,
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

function mergeVisitedJson(a: string | null | undefined, b: string | null | undefined) {
  const parse = (raw: string | null | undefined) => {
    try {
      const v = JSON.parse(raw || "[]");
      return Array.isArray(v)
        ? v.filter((id): id is string => typeof id === "string")
        : [];
    } catch {
      return [] as string[];
    }
  };
  return JSON.stringify([...new Set([...parse(a), ...parse(b)])].sort());
}
