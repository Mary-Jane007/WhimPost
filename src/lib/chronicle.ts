import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import {
  CHRONICLE_ACTIVITY_LABELS,
  CHRONICLE_LORE_VERSION,
  CHRONICLE_META,
  DEFAULT_CHRONICLE_PAGES,
  ROMAN_PAGES,
  defaultPagesForVillage,
  isChronicleActivityKey,
  type ChronicleActivityKey,
  type ChroniclePageContent,
  type ChroniclePageNumber,
} from "@/lib/chronicleContent";
import type { VillageId } from "@/lib/villages";
import { isVillageId } from "@/lib/villages";
import { grantCollectible } from "@/lib/villageProgress";
import type { CollectibleKind } from "@/lib/villages";

export type ChroniclePageView = ChroniclePageContent & {
  roman: string;
  unlocked: boolean;
  /** Hidden fields for locked pages shown to players */
  lockedLabel: string;
};

export type ChronicleProgressView = {
  villageId: VillageId;
  meta: (typeof CHRONICLE_META)[VillageId];
  recovered: number;
  total: number;
  complete: boolean;
  keeperTitle: string;
  pages: ChroniclePageView[];
  activityCounts: Record<string, number>;
  newlyUnlocked: ChroniclePageNumber[];
  justCompleted: boolean;
};

type ProgressRow = {
  user_id: string;
  village_id: string;
  unlocked_json: string;
  activity_json: string;
  completed: number;
};

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function ensureSeedPages() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  const insert = db.prepare(
    `INSERT INTO chronicle_pages (
      id, village_id, page_number, title, body, illustration_url,
      unlock_key, unlock_count, published, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(village_id, page_number) DO NOTHING`
  );

  for (const page of DEFAULT_CHRONICLE_PAGES) {
    insert.run(
      randomUUID(),
      page.villageId,
      page.pageNumber,
      page.title,
      page.body,
      page.illustrationUrl,
      page.unlockKey,
      page.unlockCount,
      page.published ? 1 : 0
    );
  }

  const loreRow = db
    .prepare(`SELECT value FROM app_meta WHERE key = 'chronicle_lore_v'`)
    .get() as { value: string } | undefined;
  const currentLore = Number(loreRow?.value || 0);
  if (currentLore >= CHRONICLE_LORE_VERSION) return;

  const refresh = db.prepare(
    `UPDATE chronicle_pages
     SET title = ?, body = ?, updated_at = datetime('now')
     WHERE village_id = ? AND page_number = ?`
  );

  for (const page of DEFAULT_CHRONICLE_PAGES) {
    // Fresh village lore for the four manuscripts provided; leave Bramblewood alone
    // if it already had custom text from an earlier seed (still refresh if empty DB path).
    if (page.villageId === "bramblewood" && currentLore > 0) continue;
    refresh.run(page.title, page.body, page.villageId, page.pageNumber);
  }

  db.prepare(
    `INSERT INTO app_meta (key, value) VALUES ('chronicle_lore_v', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(String(CHRONICLE_LORE_VERSION));
}

function ensureProgressRow(userId: string, villageId: VillageId) {
  const db = getDb();
  const existing = db
    .prepare(
      `SELECT user_id FROM chronicle_progress WHERE user_id = ? AND village_id = ?`
    )
    .get(userId, villageId) as { user_id: string } | undefined;
  if (existing) return;
  db.prepare(
    `INSERT INTO chronicle_progress (user_id, village_id, unlocked_json, activity_json, completed)
     VALUES (?, ?, '{}', '{}', 0)`
  ).run(userId, villageId);
}

export function getChroniclePages(
  villageId: VillageId,
  opts?: { includeUnpublished?: boolean }
): ChroniclePageContent[] {
  ensureSeedPages();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT village_id, page_number, title, body, illustration_url,
              unlock_key, unlock_count, published
       FROM chronicle_pages
       WHERE village_id = ?
       ORDER BY page_number ASC`
    )
    .all(villageId) as Array<{
    village_id: string;
    page_number: number;
    title: string;
    body: string;
    illustration_url: string;
    unlock_key: string;
    unlock_count: number;
    published: number;
  }>;

  if (rows.length === 0) {
    return defaultPagesForVillage(villageId);
  }

  return rows
    .filter((r) => opts?.includeUnpublished || r.published)
    .map((r) => ({
      villageId: r.village_id as VillageId,
      pageNumber: r.page_number as ChroniclePageNumber,
      title: r.title,
      body: r.body,
      illustrationUrl: r.illustration_url || "",
      unlockKey: (isChronicleActivityKey(r.unlock_key)
        ? r.unlock_key
        : "garden.completeDaily") as ChronicleActivityKey,
      unlockCount: Math.max(1, Number(r.unlock_count) || 1),
      published: Boolean(r.published),
    }));
}

function readProgress(userId: string, villageId: VillageId): ProgressRow {
  ensureProgressRow(userId, villageId);
  const db = getDb();
  return db
    .prepare(
      `SELECT user_id, village_id, unlocked_json, activity_json, completed
       FROM chronicle_progress WHERE user_id = ? AND village_id = ?`
    )
    .get(userId, villageId) as ProgressRow;
}

function grantKeeperIfComplete(
  userId: string,
  villageId: VillageId,
  unlocked: Record<string, boolean>,
  pages: ChroniclePageContent[]
) {
  const published = pages.filter((p) => p.published);
  const allUnlocked =
    published.length >= 4 &&
    published.every((p) => unlocked[String(p.pageNumber)]);
  if (!allUnlocked) return false;

  const db = getDb();
  const row = readProgress(userId, villageId);
  if (row.completed) return false;

  db.prepare(
    `UPDATE chronicle_progress SET completed = 1, updated_at = datetime('now')
     WHERE user_id = ? AND village_id = ?`
  ).run(userId, villageId);

  // Soft achievement via village collectible index 0 (keepsake), if available
  try {
    const kinds: Partial<Record<VillageId, CollectibleKind>> = {
      clovermeadow: "clover-honey",
      mosshollow: "lost-pages",
      hearthwick: "hearth-embers",
      moonmere: "moon-dreams",
      bramblewood: "bramble-compasses",
    };
    const kind = kinds[villageId];
    if (kind) grantCollectible(db, userId, kind, 1);
  } catch {
    /* collectible grant is best-effort */
  }

  return true;
}

export function getChronicleProgress(
  userId: string,
  villageId: VillageId
): ChronicleProgressView {
  const pages = getChroniclePages(villageId, { includeUnpublished: false });
  const row = readProgress(userId, villageId);
  const unlocked = parseJson<Record<string, boolean>>(row.unlocked_json, {});
  const activityCounts = parseJson<Record<string, number>>(
    row.activity_json,
    {}
  );
  const meta = CHRONICLE_META[villageId];

  const views: ChroniclePageView[] = [1, 2, 3, 4].map((n) => {
    const pageNumber = n as ChroniclePageNumber;
    const content =
      pages.find((p) => p.pageNumber === pageNumber) ||
      defaultPagesForVillage(villageId).find(
        (p) => p.pageNumber === pageNumber
      )!;
    const isUnlocked = Boolean(unlocked[String(pageNumber)]);
    return {
      ...content,
      roman: ROMAN_PAGES[pageNumber],
      unlocked: isUnlocked,
      lockedLabel: "Unknown",
      title: isUnlocked ? content.title : "❓ Unknown",
      body: isUnlocked ? content.body : "",
      illustrationUrl: isUnlocked ? content.illustrationUrl : "",
    };
  });

  const recovered = views.filter((p) => p.unlocked).length;
  const complete = recovered >= 4 || Boolean(row.completed);

  return {
    villageId,
    meta,
    recovered,
    total: 4,
    complete,
    keeperTitle: meta.keeperTitle,
    pages: views,
    activityCounts,
    newlyUnlocked: [],
    justCompleted: false,
  };
}

/**
 * Record a village activity and unlock any matching chronicle pages.
 * Returns newly unlocked page numbers (for discovery UI).
 */
export function recordChronicleActivity(
  userId: string,
  villageId: VillageId | null | undefined,
  activityKey: ChronicleActivityKey
): {
  newlyUnlocked: ChroniclePageNumber[];
  justCompleted: boolean;
  progress: ChronicleProgressView | null;
} {
  if (!villageId || !isVillageId(villageId)) {
    return { newlyUnlocked: [], justCompleted: false, progress: null };
  }

  ensureSeedPages();
  ensureProgressRow(userId, villageId);
  const db = getDb();
  const row = readProgress(userId, villageId);
  const unlocked = parseJson<Record<string, boolean>>(row.unlocked_json, {});
  const activityCounts = parseJson<Record<string, number>>(
    row.activity_json,
    {}
  );

  activityCounts[activityKey] = (activityCounts[activityKey] || 0) + 1;

  const pages = getChroniclePages(villageId, { includeUnpublished: false });
  const newlyUnlocked: ChroniclePageNumber[] = [];

  for (const page of pages) {
    const key = String(page.pageNumber);
    if (unlocked[key]) continue;
    if (page.unlockKey !== activityKey) continue;
    if (activityCounts[activityKey] >= page.unlockCount) {
      unlocked[key] = true;
      newlyUnlocked.push(page.pageNumber);
    }
  }

  db.prepare(
    `UPDATE chronicle_progress SET
      unlocked_json = ?,
      activity_json = ?,
      updated_at = datetime('now')
     WHERE user_id = ? AND village_id = ?`
  ).run(
    JSON.stringify(unlocked),
    JSON.stringify(activityCounts),
    userId,
    villageId
  );

  const justCompleted = grantKeeperIfComplete(
    userId,
    villageId,
    unlocked,
    pages
  );

  const progress = getChronicleProgress(userId, villageId);
  return {
    newlyUnlocked,
    justCompleted,
    progress: {
      ...progress,
      newlyUnlocked,
      justCompleted,
    },
  };
}

export type ChroniclePageUpdate = {
  villageId: VillageId;
  pageNumber: ChroniclePageNumber;
  title: string;
  body: string;
  illustrationUrl?: string;
  unlockKey: ChronicleActivityKey;
  unlockCount: number;
  published: boolean;
};

export function upsertChroniclePage(input: ChroniclePageUpdate) {
  ensureSeedPages();
  if (!isVillageId(input.villageId)) {
    return { ok: false as const, error: "Unknown village" };
  }
  if (![1, 2, 3, 4].includes(input.pageNumber)) {
    return { ok: false as const, error: "Page must be 1–4" };
  }
  if (!isChronicleActivityKey(input.unlockKey)) {
    return { ok: false as const, error: "Unknown unlock requirement" };
  }

  const title = input.title.trim().slice(0, 120);
  const body = input.body.trim().slice(0, 8000);
  if (title.length < 2) return { ok: false as const, error: "Title is too short" };
  if (body.length < 8) return { ok: false as const, error: "Story text is too short" };

  const db = getDb();
  const existing = db
    .prepare(
      `SELECT id FROM chronicle_pages WHERE village_id = ? AND page_number = ?`
    )
    .get(input.villageId, input.pageNumber) as { id: string } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE chronicle_pages SET
        title = ?, body = ?, illustration_url = ?, unlock_key = ?,
        unlock_count = ?, published = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      title,
      body,
      (input.illustrationUrl || "").slice(0, 400),
      input.unlockKey,
      Math.max(1, Math.min(99, Number(input.unlockCount) || 1)),
      input.published ? 1 : 0,
      existing.id
    );
  } else {
    db.prepare(
      `INSERT INTO chronicle_pages (
        id, village_id, page_number, title, body, illustration_url,
        unlock_key, unlock_count, published, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run(
      randomUUID(),
      input.villageId,
      input.pageNumber,
      title,
      body,
      (input.illustrationUrl || "").slice(0, 400),
      input.unlockKey,
      Math.max(1, Math.min(99, Number(input.unlockCount) || 1)),
      input.published ? 1 : 0
    );
  }

  return {
    ok: true as const,
    pages: getChroniclePages(input.villageId, { includeUnpublished: true }),
  };
}

export function listChronicleAdmin(villageId: VillageId) {
  return {
    meta: CHRONICLE_META[villageId],
    pages: getChroniclePages(villageId, { includeUnpublished: true }),
    activityLabels: Object.entries(CHRONICLE_ACTIVITY_LABELS) as Array<
      [ChronicleActivityKey, string]
    >,
  };
}

export type ChronicleUnlockPayload = {
  newlyUnlocked: ChroniclePageNumber[];
  justCompleted: boolean;
  pages: ChroniclePageContent[];
  keeperTitle: string;
  recovered: number;
  total: number;
  complete: boolean;
};

function toUnlockPayload(
  userId: string,
  villageId: VillageId,
  result: ReturnType<typeof recordChronicleActivity>
): ChronicleUnlockPayload | null {
  if (!result.newlyUnlocked.length && !result.justCompleted) return null;
  const allPages = getChroniclePages(villageId, { includeUnpublished: false });
  const unlockedPages = allPages.filter((p) =>
    result.newlyUnlocked.includes(p.pageNumber)
  );
  const progress = result.progress || getChronicleProgress(userId, villageId);
  return {
    newlyUnlocked: result.newlyUnlocked,
    justCompleted: result.justCompleted,
    pages: unlockedPages,
    keeperTitle: CHRONICLE_META[villageId].keeperTitle,
    recovered: progress.recovered,
    total: progress.total,
    complete: progress.complete || result.justCompleted,
  };
}

export function chronicleAfterActivity(
  userId: string,
  villageId: string | null | undefined,
  activityKey: ChronicleActivityKey
): ChronicleUnlockPayload | null {
  if (!villageId || !isVillageId(villageId)) return null;
  const result = recordChronicleActivity(userId, villageId, activityKey);
  return toUnlockPayload(userId, villageId, result);
}

