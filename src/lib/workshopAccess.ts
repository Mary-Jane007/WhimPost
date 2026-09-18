import { randomUUID } from "crypto";
import type Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { getDb } from "@/lib/db";
import {
  VILLAGE_WORKSHOPS,
  VILLAGES,
  isHomeVillagerOf,
  isVillageId,
  type VillageId,
} from "@/lib/villages";

/** Workshop / activity participation modes (owner-configurable). */
export type WorkshopAccessMode =
  | "HOME_VILLAGERS_ONLY"
  | "VISITORS_ALLOWED"
  | "EVERYONE"
  | "INVITATION_ONLY"
  | "CLOSED";

export const WORKSHOP_ACCESS_MODES: WorkshopAccessMode[] = [
  "HOME_VILLAGERS_ONLY",
  "VISITORS_ALLOWED",
  "EVERYONE",
  "INVITATION_ONLY",
  "CLOSED",
];

export const WORKSHOP_ACCESS_LABELS: Record<WorkshopAccessMode, string> = {
  HOME_VILLAGERS_ONLY: "Home Villagers Only",
  VISITORS_ALLOWED: "Visitors Allowed",
  EVERYONE: "Everyone",
  INVITATION_ONLY: "Invitation Only",
  CLOSED: "Closed",
};

export type WorkshopAccessGateKind =
  | "allowed"
  | "closed"
  | "home_only"
  | "visitors_welcome"
  | "everyone"
  | "invite_only";

export type WorkshopAccessDecision = {
  allowed: boolean;
  mode: WorkshopAccessMode;
  /** True when a scheduled event override is currently active. */
  eventActive: boolean;
  kind: WorkshopAccessGateKind;
  headline: string;
  body: string;
};

export type WorkshopAccessSettings = {
  villageId: VillageId;
  name: string;
  buildingName: string;
  accessMode: WorkshopAccessMode;
  eventAccessMode: WorkshopAccessMode | null;
  eventStartsAt: string | null;
  eventEndsAt: string | null;
  updatedAt: string | null;
  effectiveMode: WorkshopAccessMode;
  eventActive: boolean;
  statusLabel: "Open" | "Closed" | "Event";
  statusTone: "open" | "closed" | "event";
};

export type WorkshopActivityAccess = {
  id: string;
  villageId: VillageId;
  activityKey: string;
  label: string;
  accessMode: WorkshopAccessMode;
  isCrossVillage: boolean;
};

type AccessUser = {
  id?: string;
  isOwner?: boolean;
  homeVillageId?: string | null;
  villageId?: string | null;
};

const PERSISTENT_PATH = path.join(
  process.cwd(),
  "data",
  "persistent-workshop-access.json"
);

function isAccessMode(raw: unknown): raw is WorkshopAccessMode {
  return (
    typeof raw === "string" &&
    (WORKSHOP_ACCESS_MODES as string[]).includes(raw)
  );
}

export function ensureWorkshopAccessTables(db: Database.Database = getDb()) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS workshop_access (
      village_id TEXT PRIMARY KEY,
      access_mode TEXT NOT NULL DEFAULT 'HOME_VILLAGERS_ONLY',
      event_access_mode TEXT,
      event_starts_at TEXT,
      event_ends_at TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_by TEXT
    );

    CREATE TABLE IF NOT EXISTS workshop_activity_access (
      id TEXT PRIMARY KEY,
      village_id TEXT NOT NULL,
      activity_key TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT '',
      access_mode TEXT NOT NULL DEFAULT 'HOME_VILLAGERS_ONLY',
      is_cross_village INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(village_id, activity_key)
    );

    CREATE TABLE IF NOT EXISTS workshop_invites (
      village_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      activity_key TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (village_id, user_id, activity_key)
    );
  `);

  for (const village of VILLAGES) {
    db.prepare(
      `INSERT INTO workshop_access (village_id, access_mode)
       VALUES (?, 'HOME_VILLAGERS_ONLY')
       ON CONFLICT(village_id) DO NOTHING`
    ).run(village.id);
  }
}

function parseIso(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : null;
}

export function getEffectiveWorkshopAccessMode(
  settings: {
    accessMode: WorkshopAccessMode;
    eventAccessMode: WorkshopAccessMode | null;
    eventStartsAt: string | null;
    eventEndsAt: string | null;
  },
  nowMs = Date.now()
): { mode: WorkshopAccessMode; eventActive: boolean } {
  if (settings.eventAccessMode) {
    const start = parseIso(settings.eventStartsAt);
    const end = parseIso(settings.eventEndsAt);
    const afterStart = start == null || nowMs >= start;
    const beforeEnd = end == null || nowMs <= end;
    if (afterStart && beforeEnd) {
      return { mode: settings.eventAccessMode, eventActive: true };
    }
  }
  return { mode: settings.accessMode, eventActive: false };
}

function hasInvite(
  db: Database.Database,
  villageId: VillageId,
  userId: string | undefined,
  activityKey?: string | null
) {
  if (!userId) return false;
  const row = db
    .prepare(
      `SELECT 1 AS ok FROM workshop_invites
       WHERE village_id = ?
         AND user_id = ?
         AND (activity_key = '' OR activity_key = ?)
       LIMIT 1`
    )
    .get(villageId, userId, activityKey || "") as { ok: number } | undefined;
  return Boolean(row);
}

function gateCopy(
  villageId: VillageId,
  mode: WorkshopAccessMode,
  allowed: boolean
): Pick<WorkshopAccessDecision, "kind" | "headline" | "body"> {
  const village = VILLAGES.find((v) => v.id === villageId);
  const name = village?.name || "this village";

  if (mode === "CLOSED") {
    return {
      kind: "closed",
      headline: "Workshop Closed",
      body: `This workshop is currently resting. Check back later — ${name} will open its doors again when the time is right.`,
    };
  }
  if (mode === "EVERYONE" && allowed) {
    return {
      kind: "everyone",
      headline: "Open to Everyone",
      body: "All WhimPost villagers are invited.",
    };
  }
  if (mode === "VISITORS_ALLOWED" && allowed) {
    return {
      kind: "visitors_welcome",
      headline: "Visitors Welcome",
      body: "This workshop has opened its doors to visitors from every village.",
    };
  }
  if (mode === "INVITATION_ONLY") {
    return {
      kind: "invite_only",
      headline: "Invitation Only",
      body: `This workshop is open only to guests specifically invited by ${name}. Ask a steward if you believe you should be on the list.`,
    };
  }
  // HOME_VILLAGERS_ONLY (denied or messaging)
  return {
    kind: "home_only",
    headline: `Reserved for ${name} Villagers`,
    body: `This activity is part of ${name}'s deeper Chronicle. You can explore the public pages of their Chronicle or return when ${name} opens its workshop to visitors.`,
  };
}

export function evaluateWorkshopAccess(
  user: AccessUser,
  villageId: VillageId,
  opts?: { activityKey?: string | null; db?: Database.Database }
): WorkshopAccessDecision {
  const db = opts?.db || getDb();
  ensureWorkshopAccessTables(db);

  if (user.isOwner) {
    const settings = readWorkshopAccessRow(db, villageId);
    const { mode, eventActive } = getEffectiveWorkshopAccessMode(settings);
    return {
      allowed: true,
      mode,
      eventActive,
      kind: "allowed",
      headline: "Owner access",
      body: "You may enter every workshop for stewardship.",
    };
  }

  const settings = readWorkshopAccessRow(db, villageId);
  let { mode, eventActive } = getEffectiveWorkshopAccessMode(settings);

  if (opts?.activityKey) {
    const activity = getActivityAccess(db, villageId, opts.activityKey);
    if (activity) {
      mode = activity.accessMode;
    }
  }

  const home = isHomeVillagerOf(user, villageId);

  let allowed = false;
  switch (mode) {
    case "CLOSED":
      allowed = false;
      break;
    case "EVERYONE":
    case "VISITORS_ALLOWED":
      // Signed-in guests may participate without changing home village.
      allowed = Boolean(user.id);
      break;
    case "HOME_VILLAGERS_ONLY":
      allowed = home;
      break;
    case "INVITATION_ONLY":
      allowed = hasInvite(db, villageId, user.id, opts?.activityKey);
      break;
    default:
      allowed = home;
  }

  const copy = gateCopy(villageId, mode, allowed);
  const kind: WorkshopAccessGateKind = !allowed
    ? copy.kind
    : mode === "EVERYONE"
      ? "everyone"
      : mode === "VISITORS_ALLOWED"
        ? "visitors_welcome"
        : "allowed";

  return {
    allowed,
    mode,
    eventActive,
    kind,
    headline:
      allowed && mode === "HOME_VILLAGERS_ONLY"
        ? "Welcome home"
        : copy.headline,
    body:
      allowed && mode === "HOME_VILLAGERS_ONLY"
        ? `This workshop belongs to ${
            VILLAGES.find((v) => v.id === villageId)?.name || "your village"
          }.`
        : copy.body,
  };
}

/**
 * Workshop hubs respect owner-configured access modes.
 * Default remains home-villagers-only; owner override is always allowed.
 */
export function canAccessVillageWorkshop(
  user: {
    id?: string;
    isOwner: boolean;
    homeVillageId?: string | null;
    villageId?: string | null;
  },
  workshopVillageId: VillageId
): boolean {
  return evaluateWorkshopAccess(user, workshopVillageId).allowed;
}

function readWorkshopAccessRow(db: Database.Database, villageId: VillageId) {
  ensureWorkshopAccessTables(db);
  const row = db
    .prepare(
      `SELECT village_id, access_mode, event_access_mode, event_starts_at, event_ends_at, updated_at
       FROM workshop_access WHERE village_id = ?`
    )
    .get(villageId) as
    | {
        village_id: string;
        access_mode: string;
        event_access_mode: string | null;
        event_starts_at: string | null;
        event_ends_at: string | null;
        updated_at: string;
      }
    | undefined;

  return {
    accessMode: isAccessMode(row?.access_mode)
      ? row!.access_mode
      : ("HOME_VILLAGERS_ONLY" as WorkshopAccessMode),
    eventAccessMode: isAccessMode(row?.event_access_mode)
      ? (row!.event_access_mode as WorkshopAccessMode)
      : null,
    eventStartsAt: row?.event_starts_at || null,
    eventEndsAt: row?.event_ends_at || null,
    updatedAt: row?.updated_at || null,
  };
}

export function listWorkshopAccessSettings(
  db: Database.Database = getDb()
): WorkshopAccessSettings[] {
  ensureWorkshopAccessTables(db);
  return VILLAGES.map((village) => {
    const row = readWorkshopAccessRow(db, village.id);
    const { mode, eventActive } = getEffectiveWorkshopAccessMode(row);
    const workshop = VILLAGE_WORKSHOPS[village.id];
    const closed = mode === "CLOSED";
    return {
      villageId: village.id,
      name: village.name,
      buildingName: workshop.buildingName,
      accessMode: row.accessMode,
      eventAccessMode: row.eventAccessMode,
      eventStartsAt: row.eventStartsAt,
      eventEndsAt: row.eventEndsAt,
      updatedAt: row.updatedAt,
      effectiveMode: mode,
      eventActive,
      statusLabel: closed ? "Closed" : eventActive ? "Event" : "Open",
      statusTone: closed ? "closed" : eventActive ? "event" : "open",
    };
  });
}

export function setWorkshopAccessMode(
  villageId: VillageId,
  accessMode: WorkshopAccessMode,
  opts?: {
    updatedBy?: string | null;
    eventAccessMode?: WorkshopAccessMode | null;
    eventStartsAt?: string | null;
    eventEndsAt?: string | null;
    clearEvent?: boolean;
  }
) {
  if (!isVillageId(villageId) || !isAccessMode(accessMode)) {
    throw new Error("Invalid workshop access settings");
  }
  const db = getDb();
  ensureWorkshopAccessTables(db);
  const current = readWorkshopAccessRow(db, villageId);

  let eventAccessMode = current.eventAccessMode;
  let eventStartsAt = current.eventStartsAt;
  let eventEndsAt = current.eventEndsAt;

  if (opts?.clearEvent) {
    eventAccessMode = null;
    eventStartsAt = null;
    eventEndsAt = null;
  } else {
    if (opts && "eventAccessMode" in opts) {
      eventAccessMode = opts.eventAccessMode ?? null;
    }
    if (opts && "eventStartsAt" in opts) {
      eventStartsAt = opts.eventStartsAt ?? null;
    }
    if (opts && "eventEndsAt" in opts) {
      eventEndsAt = opts.eventEndsAt ?? null;
    }
  }

  db.prepare(
    `INSERT INTO workshop_access (
       village_id, access_mode, event_access_mode, event_starts_at, event_ends_at, updated_at, updated_by
     ) VALUES (?, ?, ?, ?, ?, datetime('now'), ?)
     ON CONFLICT(village_id) DO UPDATE SET
       access_mode = excluded.access_mode,
       event_access_mode = excluded.event_access_mode,
       event_starts_at = excluded.event_starts_at,
       event_ends_at = excluded.event_ends_at,
       updated_at = datetime('now'),
       updated_by = excluded.updated_by`
  ).run(
    villageId,
    accessMode,
    eventAccessMode,
    eventStartsAt,
    eventEndsAt,
    opts?.updatedBy || null
  );

  exportPersistentWorkshopAccess(db);
  return listWorkshopAccessSettings(db).find((s) => s.villageId === villageId)!;
}

export function listActivityAccess(
  villageId: VillageId,
  db: Database.Database = getDb()
): WorkshopActivityAccess[] {
  ensureWorkshopAccessTables(db);
  const rows = db
    .prepare(
      `SELECT id, village_id, activity_key, label, access_mode, is_cross_village
       FROM workshop_activity_access
       WHERE village_id = ?
       ORDER BY is_cross_village DESC, label ASC, activity_key ASC`
    )
    .all(villageId) as Array<{
    id: string;
    village_id: string;
    activity_key: string;
    label: string;
    access_mode: string;
    is_cross_village: number;
  }>;

  return rows.map((r) => ({
    id: r.id,
    villageId: r.village_id as VillageId,
    activityKey: r.activity_key,
    label: r.label || r.activity_key,
    accessMode: isAccessMode(r.access_mode)
      ? r.access_mode
      : "HOME_VILLAGERS_ONLY",
    isCrossVillage: Boolean(r.is_cross_village),
  }));
}

function getActivityAccess(
  db: Database.Database,
  villageId: VillageId,
  activityKey: string
) {
  return listActivityAccess(villageId, db).find(
    (a) => a.activityKey === activityKey
  );
}

export function upsertActivityAccess(
  villageId: VillageId,
  activityKey: string,
  patch: {
    label?: string;
    accessMode: WorkshopAccessMode;
    isCrossVillage?: boolean;
  }
) {
  if (!isVillageId(villageId) || !activityKey.trim()) {
    throw new Error("Invalid activity access");
  }
  if (!isAccessMode(patch.accessMode)) throw new Error("Invalid access mode");
  const db = getDb();
  ensureWorkshopAccessTables(db);
  const existing = db
    .prepare(
      `SELECT id FROM workshop_activity_access
       WHERE village_id = ? AND activity_key = ?`
    )
    .get(villageId, activityKey) as { id: string } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE workshop_activity_access SET
         label = COALESCE(?, label),
         access_mode = ?,
         is_cross_village = ?,
         updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      patch.label ?? null,
      patch.accessMode,
      patch.isCrossVillage ? 1 : 0,
      existing.id
    );
  } else {
    db.prepare(
      `INSERT INTO workshop_activity_access (
         id, village_id, activity_key, label, access_mode, is_cross_village
       ) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      randomUUID(),
      villageId,
      activityKey,
      patch.label || activityKey,
      patch.accessMode,
      patch.isCrossVillage ? 1 : 0
    );
  }
  exportPersistentWorkshopAccess(db);
  return getActivityAccess(db, villageId, activityKey)!;
}

export function setWorkshopInvite(
  villageId: VillageId,
  userId: string,
  activityKey = ""
) {
  const db = getDb();
  ensureWorkshopAccessTables(db);
  db.prepare(
    `INSERT INTO workshop_invites (village_id, user_id, activity_key)
     VALUES (?, ?, ?)
     ON CONFLICT(village_id, user_id, activity_key) DO NOTHING`
  ).run(villageId, userId, activityKey || "");
  exportPersistentWorkshopAccess(db);
}

/** Persist access settings so owner choices survive restarts. */
export function exportPersistentWorkshopAccess(db: Database.Database = getDb()) {
  ensureWorkshopAccessTables(db);
  const workshops = listWorkshopAccessSettings(db);
  const activities = db
    .prepare(
      `SELECT village_id, activity_key, label, access_mode, is_cross_village
       FROM workshop_activity_access`
    )
    .all() as Array<{
    village_id: string;
    activity_key: string;
    label: string;
    access_mode: string;
    is_cross_village: number;
  }>;
  const invites = db
    .prepare(
      `SELECT village_id, user_id, activity_key FROM workshop_invites`
    )
    .all() as Array<{
    village_id: string;
    user_id: string;
    activity_key: string;
  }>;

  const payload = {
    version: 1 as const,
    updatedAt: new Date().toISOString(),
    workshops: workshops.map((w) => ({
      villageId: w.villageId,
      accessMode: w.accessMode,
      eventAccessMode: w.eventAccessMode,
      eventStartsAt: w.eventStartsAt,
      eventEndsAt: w.eventEndsAt,
    })),
    activities: activities.map((a) => ({
      villageId: a.village_id,
      activityKey: a.activity_key,
      label: a.label,
      accessMode: a.access_mode,
      isCrossVillage: Boolean(a.is_cross_village),
    })),
    invites,
  };

  const dir = path.dirname(PERSISTENT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = `${PERSISTENT_PATH}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.renameSync(tmp, PERSISTENT_PATH);
}

export function importPersistentWorkshopAccess(db: Database.Database) {
  ensureWorkshopAccessTables(db);
  try {
    if (!fs.existsSync(PERSISTENT_PATH)) return;
    const raw = fs.readFileSync(PERSISTENT_PATH, "utf8");
    if (!raw.trim()) return;
    const parsed = JSON.parse(raw) as {
      workshops?: Array<{
        villageId: string;
        accessMode: string;
        eventAccessMode?: string | null;
        eventStartsAt?: string | null;
        eventEndsAt?: string | null;
      }>;
      activities?: Array<{
        villageId: string;
        activityKey: string;
        label?: string;
        accessMode: string;
        isCrossVillage?: boolean;
      }>;
      invites?: Array<{
        village_id: string;
        user_id: string;
        activity_key: string;
      }>;
    };

    const upsertWorkshop = db.prepare(
      `INSERT INTO workshop_access (
         village_id, access_mode, event_access_mode, event_starts_at, event_ends_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(village_id) DO UPDATE SET
         access_mode = excluded.access_mode,
         event_access_mode = excluded.event_access_mode,
         event_starts_at = excluded.event_starts_at,
         event_ends_at = excluded.event_ends_at,
         updated_at = datetime('now')`
    );

    for (const w of parsed.workshops || []) {
      if (!isVillageId(w.villageId) || !isAccessMode(w.accessMode)) continue;
      upsertWorkshop.run(
        w.villageId,
        w.accessMode,
        isAccessMode(w.eventAccessMode) ? w.eventAccessMode : null,
        w.eventStartsAt || null,
        w.eventEndsAt || null
      );
    }

    for (const a of parsed.activities || []) {
      if (!isVillageId(a.villageId) || !isAccessMode(a.accessMode)) continue;
      const existing = db
        .prepare(
          `SELECT id FROM workshop_activity_access
           WHERE village_id = ? AND activity_key = ?`
        )
        .get(a.villageId, a.activityKey) as { id: string } | undefined;
      if (existing) {
        db.prepare(
          `UPDATE workshop_activity_access SET
             label = ?, access_mode = ?, is_cross_village = ?,
             updated_at = datetime('now')
           WHERE id = ?`
        ).run(
          a.label || a.activityKey,
          a.accessMode,
          a.isCrossVillage ? 1 : 0,
          existing.id
        );
      } else {
        db.prepare(
          `INSERT INTO workshop_activity_access (
             id, village_id, activity_key, label, access_mode, is_cross_village
           ) VALUES (?, ?, ?, ?, ?, ?)`
        ).run(
          randomUUID(),
          a.villageId,
          a.activityKey,
          a.label || a.activityKey,
          a.accessMode,
          a.isCrossVillage ? 1 : 0
        );
      }
    }

    for (const inv of parsed.invites || []) {
      if (!isVillageId(inv.village_id) || !inv.user_id) continue;
      db.prepare(
        `INSERT INTO workshop_invites (village_id, user_id, activity_key)
         VALUES (?, ?, ?)
         ON CONFLICT(village_id, user_id, activity_key) DO NOTHING`
      ).run(inv.village_id, inv.user_id, inv.activity_key || "");
    }
  } catch (err) {
    console.error("[persistent-workshop-access] import failed:", err);
  }
}
