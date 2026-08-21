import { randomUUID } from "crypto";
import type { Database } from "better-sqlite3";
import {
  COLLECTIBLE_META,
  collectiblesForVillage,
  isVillageId,
  REP_REWARDS,
  VILLAGE_MAP,
  type CollectibleKind,
  type VillageId,
} from "@/lib/villages";
import { addReputation, grantCollectible } from "@/lib/villageProgress";

/** Specialty hubs that can host owner-authored tasks. */
export type VillageHubId =
  | "workshop"
  | "garden"
  | "fireside"
  | "observatory"
  | "library";

export const VILLAGE_HUBS: Record<
  VillageHubId,
  { label: string; villageId: VillageId }
> = {
  workshop: { label: "Woodland Workshop", villageId: "bramblewood" },
  garden: { label: "Bloomkeeper's Garden", villageId: "clovermeadow" },
  fireside: { label: "Fireside", villageId: "hearthwick" },
  observatory: { label: "Observatory", villageId: "moonmere" },
  library: { label: "Grand Library", villageId: "mosshollow" },
};

/** Each village's exclusive specialty hub. */
export const VILLAGE_TO_HUB: Record<VillageId, VillageHubId> = {
  bramblewood: "workshop",
  clovermeadow: "garden",
  hearthwick: "fireside",
  moonmere: "observatory",
  mosshollow: "library",
};

export const VILLAGE_HUB_IDS = Object.keys(VILLAGE_HUBS) as VillageHubId[];

export function isVillageHubId(value: string): value is VillageHubId {
  return value in VILLAGE_HUBS;
}

export type VillageTask = {
  id: string;
  villageId: VillageId;
  hub: VillageHubId;
  title: string;
  detail: string;
  rewards: CollectibleKind[];
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
};

export type VillageTaskView = VillageTask & {
  completed: boolean;
  completedAt: string | null;
  rewardMeta: Array<{
    kind: CollectibleKind;
    name: string;
    emoji: string;
    image?: string;
  }>;
};

type TaskRow = {
  id: string;
  village_id: string;
  hub: string;
  title: string;
  detail: string;
  rewards_json: string;
  sort_order: number;
  active: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

function parseRewards(raw: string): CollectibleKind[] {
  try {
    const parsed = JSON.parse(raw || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    const kinds = Object.keys(COLLECTIBLE_META) as CollectibleKind[];
    const allowed = new Set(kinds);
    const out: CollectibleKind[] = [];
    for (const item of parsed) {
      if (typeof item !== "string") continue;
      if (!allowed.has(item as CollectibleKind)) continue;
      if (out.includes(item as CollectibleKind)) continue;
      out.push(item as CollectibleKind);
    }
    return out;
  } catch {
    return [];
  }
}

function rowToTask(row: TaskRow): VillageTask {
  return {
    id: row.id,
    villageId: row.village_id as VillageId,
    hub: row.hub as VillageHubId,
    title: row.title,
    detail: row.detail || "",
    rewards: parseRewards(row.rewards_json),
    sortOrder: Number(row.sort_order) || 50,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
}

function rewardMeta(rewards: CollectibleKind[]) {
  return rewards.map((kind) => ({
    kind,
    name: COLLECTIBLE_META[kind].name,
    emoji: COLLECTIBLE_META[kind].emoji,
    image: COLLECTIBLE_META[kind].image,
  }));
}

export function collectibleOptionsForVillage(villageId: VillageId) {
  return collectiblesForVillage(villageId).map((kind) => ({
    kind,
    name: COLLECTIBLE_META[kind].name,
    emoji: COLLECTIBLE_META[kind].emoji,
    image: COLLECTIBLE_META[kind].image,
    max: COLLECTIBLE_META[kind].max,
  }));
}

export function listVillageTasks(
  db: Database,
  opts: {
    villageId?: VillageId;
    hub?: VillageHubId;
    includeInactive?: boolean;
  } = {}
): VillageTask[] {
  const clauses: string[] = [];
  const params: Array<string | number> = [];
  if (opts.villageId) {
    clauses.push("village_id = ?");
    params.push(opts.villageId);
  }
  if (opts.hub) {
    clauses.push("hub = ?");
    params.push(opts.hub);
  }
  if (!opts.includeInactive) {
    clauses.push("active = 1");
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT * FROM village_tasks ${where}
       ORDER BY sort_order ASC, created_at ASC`
    )
    .all(...params) as TaskRow[];
  return rows.map(rowToTask);
}

export function listVillageTasksForUser(
  db: Database,
  userId: string,
  opts: { villageId: VillageId; hub: VillageHubId }
): VillageTaskView[] {
  const tasks = listVillageTasks(db, {
    villageId: opts.villageId,
    hub: opts.hub,
    includeInactive: false,
  });
  if (tasks.length === 0) return [];

  const completedRows = db
    .prepare(
      `SELECT task_id, completed_at FROM village_task_completions
       WHERE user_id = ? AND task_id IN (${tasks.map(() => "?").join(",")})`
    )
    .all(userId, ...tasks.map((t) => t.id)) as Array<{
    task_id: string;
    completed_at: string;
  }>;
  const completedMap = new Map(
    completedRows.map((r) => [r.task_id, r.completed_at])
  );

  return tasks.map((task) => {
    const completedAt = completedMap.get(task.id) || null;
    return {
      ...task,
      completed: Boolean(completedAt),
      completedAt,
      rewardMeta: rewardMeta(task.rewards),
    };
  });
}

export function getVillageTask(
  db: Database,
  taskId: string
): VillageTask | null {
  const row = db
    .prepare(`SELECT * FROM village_tasks WHERE id = ?`)
    .get(taskId) as TaskRow | undefined;
  return row ? rowToTask(row) : null;
}

export function createVillageTask(
  db: Database,
  input: {
    villageId: VillageId;
    hub: VillageHubId;
    title: string;
    detail?: string;
    rewards: CollectibleKind[];
    sortOrder?: number;
    createdBy: string;
  }
): VillageTask {
  const expectedHub = VILLAGE_TO_HUB[input.villageId];
  if (input.hub !== expectedHub) {
    throw new Error(
      `Hub mismatch: ${VILLAGE_MAP[input.villageId].name} uses the ${VILLAGE_HUBS[expectedHub].label}.`
    );
  }
  const id = randomUUID();
  const title = input.title.trim();
  const detail = (input.detail || "").trim();
  const rewards = sanitizeRewards(input.villageId, input.rewards);
  const sortOrder =
    typeof input.sortOrder === "number" && Number.isFinite(input.sortOrder)
      ? Math.max(0, Math.min(999, Math.round(input.sortOrder)))
      : 50;

  db.prepare(
    `INSERT INTO village_tasks
      (id, village_id, hub, title, detail, rewards_json, sort_order, active, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`
  ).run(
    id,
    input.villageId,
    input.hub,
    title,
    detail,
    JSON.stringify(rewards),
    sortOrder,
    input.createdBy
  );

  const created = getVillageTask(db, id);
  if (!created) throw new Error("Failed to create village task");
  return created;
}

export function updateVillageTask(
  db: Database,
  taskId: string,
  input: {
    title?: string;
    detail?: string;
    rewards?: CollectibleKind[];
    sortOrder?: number;
    active?: boolean;
  }
): VillageTask | null {
  const existing = getVillageTask(db, taskId);
  if (!existing) return null;

  const title =
    typeof input.title === "string" ? input.title.trim() : existing.title;
  const detail =
    typeof input.detail === "string" ? input.detail.trim() : existing.detail;
  const rewards =
    input.rewards != null
      ? sanitizeRewards(existing.villageId, input.rewards)
      : existing.rewards;
  const sortOrder =
    typeof input.sortOrder === "number" && Number.isFinite(input.sortOrder)
      ? Math.max(0, Math.min(999, Math.round(input.sortOrder)))
      : existing.sortOrder;
  const active =
    typeof input.active === "boolean" ? (input.active ? 1 : 0) : existing.active ? 1 : 0;

  if (!title) throw new Error("Task title is required.");

  db.prepare(
    `UPDATE village_tasks
     SET title = ?, detail = ?, rewards_json = ?, sort_order = ?, active = ?,
         updated_at = datetime('now')
     WHERE id = ?`
  ).run(title, detail, JSON.stringify(rewards), sortOrder, active, taskId);

  return getVillageTask(db, taskId);
}

export function deleteVillageTask(db: Database, taskId: string): boolean {
  const result = db.prepare(`DELETE FROM village_tasks WHERE id = ?`).run(taskId);
  db.prepare(`DELETE FROM village_task_completions WHERE task_id = ?`).run(
    taskId
  );
  return result.changes > 0;
}

function sanitizeRewards(
  villageId: VillageId,
  rewards: CollectibleKind[]
): CollectibleKind[] {
  const pack = new Set(collectiblesForVillage(villageId));
  const out: CollectibleKind[] = [];
  for (const kind of rewards) {
    if (!pack.has(kind)) continue;
    if (out.includes(kind)) continue;
    out.push(kind);
  }
  return out;
}

export type CompleteTaskResult =
  | {
      ok: true;
      task: VillageTaskView;
      granted: CollectibleKind[];
      reputationGained: number;
    }
  | { ok: false; error: string; status: number };

/** Complete an owner task once; grants configured collectibles + a little reputation. */
export function completeVillageTask(
  db: Database,
  userId: string,
  taskId: string,
  homeVillageId: VillageId | null
): CompleteTaskResult {
  const task = getVillageTask(db, taskId);
  if (!task || !task.active) {
    return { ok: false, error: "That task is no longer available.", status: 404 };
  }
  if (!homeVillageId || homeVillageId !== task.villageId) {
    return {
      ok: false,
      error: `Only ${VILLAGE_MAP[task.villageId].name} villagers can complete this task.`,
      status: 403,
    };
  }

  const already = db
    .prepare(
      `SELECT completed_at FROM village_task_completions
       WHERE task_id = ? AND user_id = ?`
    )
    .get(taskId, userId) as { completed_at: string } | undefined;
  if (already) {
    return {
      ok: false,
      error: "You already completed this task.",
      status: 409,
    };
  }

  const granted: CollectibleKind[] = [];
  const run = db.transaction(() => {
    db.prepare(
      `INSERT INTO village_task_completions (task_id, user_id)
       VALUES (?, ?)`
    ).run(taskId, userId);

    for (const kind of task.rewards) {
      grantCollectible(db, userId, kind, 1);
      granted.push(kind);
    }
    addReputation(db, userId, REP_REWARDS.villageTask);
  });
  run();

  const views = listVillageTasksForUser(db, userId, {
    villageId: task.villageId,
    hub: task.hub,
  });
  const view = views.find((t) => t.id === task.id);
  if (!view) {
    return { ok: false, error: "Task completed but could not reload.", status: 500 };
  }

  return {
    ok: true,
    task: view,
    granted,
    reputationGained: REP_REWARDS.villageTask,
  };
}

export function assertVillageHubPair(
  villageId: string,
  hub: string
): { villageId: VillageId; hub: VillageHubId } | null {
  if (!isVillageId(villageId) || !isVillageHubId(hub)) return null;
  if (VILLAGE_TO_HUB[villageId] !== hub) return null;
  return { villageId, hub };
}
