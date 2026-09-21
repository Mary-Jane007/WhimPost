import { randomUUID } from "crypto";
import type { Database } from "better-sqlite3";
import fs from "fs";
import path from "path";
import {
  isChronicleVisibilityMode,
  type ChronicleVisibilityMode,
} from "@/lib/chronicleContent";

/** Git-tracked Lost Chronicles pages so owner edits survive fresh servers. */
export const PERSISTENT_CHRONICLE_PAGES_PATH = path.join(
  process.cwd(),
  "data",
  "persistent-chronicle-pages.json"
);

export type PersistentChroniclePage = {
  id: string;
  villageId: string;
  pageNumber: number;
  title: string;
  body: string;
  illustrationUrl: string;
  unlockKey: string;
  unlockCount: number;
  published: boolean;
  /** Additive field — older snapshots omit it safely. */
  visibilityMode?: ChronicleVisibilityMode;
  updatedAt: string;
};

type PersistentChroniclePagesFile = {
  version: 1;
  updatedAt: string;
  pages: PersistentChroniclePage[];
};

function readFile(): PersistentChroniclePagesFile | null {
  try {
    if (!fs.existsSync(PERSISTENT_CHRONICLE_PAGES_PATH)) return null;
    const raw = fs.readFileSync(PERSISTENT_CHRONICLE_PAGES_PATH, "utf8");
    if (!raw.trim()) return null;
    const parsed = JSON.parse(raw) as PersistentChroniclePagesFile;
    if (!parsed || !Array.isArray(parsed.pages)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeFile(pages: PersistentChroniclePage[]) {
  const dir = path.dirname(PERSISTENT_CHRONICLE_PAGES_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const payload: PersistentChroniclePagesFile = {
    version: 1,
    updatedAt: new Date().toISOString(),
    pages: [...pages].sort((a, b) => {
      const byVillage = a.villageId.localeCompare(b.villageId);
      if (byVillage !== 0) return byVillage;
      return a.pageNumber - b.pageNumber;
    }),
  };

  const tmp = `${PERSISTENT_CHRONICLE_PAGES_PATH}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.renameSync(tmp, PERSISTENT_CHRONICLE_PAGES_PATH);
}

function defaultVisibility(pageNumber: number): ChronicleVisibilityMode {
  return pageNumber === 1 ? "PUBLIC" : "VILLAGE_MEMBERS_ONLY";
}

/** Snapshot every Lost Chronicles manuscript page currently in SQLite. */
export function exportPersistentChroniclePages(db: Database) {
  const rows = db
    .prepare(
      `SELECT id, village_id, page_number, title, body, illustration_url,
              unlock_key, unlock_count, published, visibility_mode, updated_at
       FROM chronicle_pages
       ORDER BY village_id ASC, page_number ASC`
    )
    .all() as Array<{
    id: string;
    village_id: string;
    page_number: number;
    title: string;
    body: string;
    illustration_url: string;
    unlock_key: string;
    unlock_count: number;
    published: number;
    visibility_mode: string | null;
    updated_at: string;
  }>;

  const pages: PersistentChroniclePage[] = rows.map((row) => {
    const pageNumber = Number(row.page_number) || 1;
    const visibilityMode = isChronicleVisibilityMode(row.visibility_mode)
      ? row.visibility_mode
      : defaultVisibility(pageNumber);
    return {
      id: row.id,
      villageId: row.village_id,
      pageNumber,
      title: row.title || "",
      body: row.body || "",
      illustrationUrl: row.illustration_url || "",
      unlockKey: row.unlock_key || "garden.completeDaily",
      unlockCount: Math.max(1, Number(row.unlock_count) || 1),
      published: Boolean(row.published),
      visibilityMode,
      updatedAt: row.updated_at || new Date().toISOString(),
    };
  });

  writeFile(pages);
  return pages.length;
}

/**
 * Restore owner-edited chronicle pages onto SQLite.
 * Always applies the snapshot (upsert) so a wiped DB gets custom text back
 * even after default seed rows are inserted.
 *
 * CRITICAL: never delete rows; never blank out title/body. Visibility is
 * additive — missing visibilityMode in older files leaves existing mode (or
 * a safe default) without touching story text.
 */
export function importPersistentChroniclePages(db: Database) {
  const file = readFile();
  if (!file || file.pages.length === 0) return 0;

  // Ensure column exists before upsert (additive schema).
  try {
    const cols = db.prepare(`PRAGMA table_info(chronicle_pages)`).all() as Array<{
      name: string;
    }>;
    if (!cols.some((c) => c.name === "visibility_mode")) {
      db.exec(
        `ALTER TABLE chronicle_pages ADD COLUMN visibility_mode TEXT NOT NULL DEFAULT 'VILLAGE_MEMBERS_ONLY'`
      );
    }
  } catch {
    /* table may not exist yet; seed path creates it */
  }

  const update = db.prepare(
    `UPDATE chronicle_pages SET
      title = ?, body = ?, illustration_url = ?, unlock_key = ?,
      unlock_count = ?, published = ?, visibility_mode = ?, updated_at = ?
     WHERE village_id = ? AND page_number = ?`
  );
  const insert = db.prepare(
    `INSERT INTO chronicle_pages (
      id, village_id, page_number, title, body, illustration_url,
      unlock_key, unlock_count, published, visibility_mode, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(village_id, page_number) DO UPDATE SET
      title = excluded.title,
      body = excluded.body,
      illustration_url = excluded.illustration_url,
      unlock_key = excluded.unlock_key,
      unlock_count = excluded.unlock_count,
      published = excluded.published,
      visibility_mode = excluded.visibility_mode,
      updated_at = excluded.updated_at`
  );

  let restored = 0;
  const tx = db.transaction(() => {
    for (const page of file!.pages) {
      const villageId = String(page.villageId || "").trim();
      const pageNumber = Number(page.pageNumber);
      const title = String(page.title || "").trim();
      const body = String(page.body || "").trim();
      if (!villageId || ![1, 2, 3, 4].includes(pageNumber)) continue;
      // Refuse to overwrite good rows with empty / stub text.
      if (title.length < 2 || body.length < 8) continue;

      const illustrationUrl = String(page.illustrationUrl || "").slice(0, 400);
      const unlockKey = String(page.unlockKey || "garden.completeDaily");
      const unlockCount = Math.max(1, Math.min(99, Number(page.unlockCount) || 1));
      const published = page.published ? 1 : 0;
      const updatedAt = String(page.updatedAt || new Date().toISOString());
      const id = String(page.id || "").trim() || randomUUID();
      const visibilityMode = isChronicleVisibilityMode(page.visibilityMode)
        ? page.visibilityMode
        : defaultVisibility(pageNumber);

      const result = update.run(
        title,
        body,
        illustrationUrl,
        unlockKey,
        unlockCount,
        published,
        visibilityMode,
        updatedAt,
        villageId,
        pageNumber
      );
      if (result.changes > 0) {
        restored += 1;
        continue;
      }

      insert.run(
        id,
        villageId,
        pageNumber,
        title,
        body,
        illustrationUrl,
        unlockKey,
        unlockCount,
        published,
        visibilityMode,
        updatedAt
      );
      restored += 1;
    }
  });
  tx();

  if (restored > 0) {
    console.info(`[chronicle] restored ${restored} manuscript page(s)`);
  }
  return restored;
}
