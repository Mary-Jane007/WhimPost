import type { Database } from "better-sqlite3";
import fs from "fs";
import path from "path";

export const PERSISTENT_MEETING_BENCH_PATH = path.join(
  process.cwd(),
  "data",
  "persistent-meeting-bench.json"
);

type PersistentBenchFile = {
  version: 1;
  updatedAt: string;
  items: Array<Record<string, unknown>>;
};

function writeFile(items: Array<Record<string, unknown>>) {
  const dir = path.dirname(PERSISTENT_MEETING_BENCH_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const payload: PersistentBenchFile = {
    version: 1,
    updatedAt: new Date().toISOString(),
    items,
  };
  const tmp = `${PERSISTENT_MEETING_BENCH_PATH}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.renameSync(tmp, PERSISTENT_MEETING_BENCH_PATH);
}

/** Snapshot Meeting Bench content so fresh servers keep the living-world board. */
export function persistMeetingBenchCatalog(db: Database) {
  const rows = db
    .prepare(
      `SELECT id, kind, title, body, status, season, starts_at, ends_at,
              activity_type, villages_json, cta_label, cta_href, pinned,
              sort_order, meta_json, created_at, updated_at, created_by
       FROM meeting_bench_items
       ORDER BY pinned DESC, sort_order ASC, updated_at DESC`
    )
    .all() as Array<Record<string, unknown>>;
  writeFile(rows);
  return rows.length;
}

/** Restore Meeting Bench rows from the git-tracked catalog when the table is empty. */
export function importPersistentMeetingBench(db: Database) {
  const count = (
    db.prepare(`SELECT COUNT(*) as n FROM meeting_bench_items`).get() as {
      n: number;
    }
  ).n;
  if (count > 0) return 0;
  if (!fs.existsSync(PERSISTENT_MEETING_BENCH_PATH)) return 0;

  let file: PersistentBenchFile | null = null;
  try {
    file = JSON.parse(
      fs.readFileSync(PERSISTENT_MEETING_BENCH_PATH, "utf8")
    ) as PersistentBenchFile;
  } catch {
    return 0;
  }
  if (!file?.items?.length) return 0;

  const insert = db.prepare(
    `INSERT OR IGNORE INTO meeting_bench_items
      (id, kind, title, body, status, season, starts_at, ends_at, activity_type,
       villages_json, cta_label, cta_href, pinned, sort_order, meta_json,
       created_at, updated_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  let restored = 0;
  const tx = db.transaction(() => {
    for (const raw of file!.items) {
      const id = String(raw.id || "").trim();
      const kind = String(raw.kind || "").trim();
      const title = String(raw.title || "").trim();
      const body = String(raw.body || "").trim();
      if (!id || !kind || !title || !body) continue;
      insert.run(
        id,
        kind,
        title,
        body,
        String(raw.status || "published"),
        raw.season ? String(raw.season) : null,
        raw.starts_at ? String(raw.starts_at) : null,
        raw.ends_at ? String(raw.ends_at) : null,
        raw.activity_type ? String(raw.activity_type) : null,
        String(raw.villages_json || '"all"'),
        raw.cta_label ? String(raw.cta_label) : null,
        raw.cta_href ? String(raw.cta_href) : null,
        Number(raw.pinned) ? 1 : 0,
        Number(raw.sort_order) || 50,
        String(raw.meta_json || "{}"),
        String(raw.created_at || new Date().toISOString()),
        String(raw.updated_at || new Date().toISOString()),
        raw.created_by ? String(raw.created_by) : null
      );
      restored += 1;
    }
  });
  tx();
  if (restored > 0) {
    console.info(`[meeting-bench] restored ${restored} board item(s)`);
  }
  return restored;
}
