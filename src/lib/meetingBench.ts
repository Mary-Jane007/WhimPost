import { randomUUID } from "crypto";
import type { Database } from "better-sqlite3";
import { getDb } from "@/lib/db";
import {
  currentGardenSeason,
  type GardenSeason,
} from "@/lib/gardenContent";
import type { VillageId } from "@/lib/villages";
import { VILLAGES } from "@/lib/villages";
import { persistMeetingBenchCatalog } from "@/lib/persistentMeetingBench";

export type BenchItemKind =
  | "notice"
  | "gathering"
  | "seasonal"
  | "chronicle"
  | "community_event";

export type BenchItemStatus =
  | "draft"
  | "upcoming"
  | "active"
  | "finished"
  | "published"
  | "archived";

export type BenchItem = {
  id: string;
  kind: BenchItemKind;
  title: string;
  body: string;
  status: BenchItemStatus;
  season: GardenSeason | null;
  startsAt: string | null;
  endsAt: string | null;
  activityType: string | null;
  villages: VillageId[] | "all";
  ctaLabel: string | null;
  ctaHref: string | null;
  pinned: boolean;
  sortOrder: number;
  meta: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  rsvpCount?: number;
  userJoined?: boolean;
};

export type BenchTeaser = {
  season: GardenSeason;
  seasonLabel: string;
  notice: { title: string; excerpt: string } | null;
  gathering: { title: string; when: string } | null;
  seasonal: { title: string; excerpt: string } | null;
  chronicle: { title: string; excerpt: string } | null;
};

type ItemRow = {
  id: string;
  kind: string;
  title: string;
  body: string;
  status: string;
  season: string | null;
  starts_at: string | null;
  ends_at: string | null;
  activity_type: string | null;
  villages_json: string;
  cta_label: string | null;
  cta_href: string | null;
  pinned: number;
  sort_order: number;
  meta_json: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

const SEASON_LABEL: Record<GardenSeason, string> = {
  spring: "Spring",
  summer: "Summer",
  autumn: "Autumn",
  winter: "Winter",
};

export function seasonLabel(season: GardenSeason) {
  return SEASON_LABEL[season];
}

function parseVillages(raw: string): VillageId[] | "all" {
  try {
    const parsed = JSON.parse(raw || '"all"') as unknown;
    if (parsed === "all") return "all";
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is VillageId =>
        VILLAGES.some((v) => v.id === id)
      );
    }
  } catch {
    // ignore
  }
  return "all";
}

function parseMeta(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw || "{}") as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // ignore
  }
  return {};
}

function mapItem(
  row: ItemRow,
  extras?: { rsvpCount?: number; userJoined?: boolean }
): BenchItem {
  return {
    id: row.id,
    kind: row.kind as BenchItemKind,
    title: row.title,
    body: row.body,
    status: row.status as BenchItemStatus,
    season: (row.season as GardenSeason) || null,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    activityType: row.activity_type,
    villages: parseVillages(row.villages_json),
    ctaLabel: row.cta_label,
    ctaHref: row.cta_href,
    pinned: Boolean(row.pinned),
    sortOrder: row.sort_order || 0,
    meta: parseMeta(row.meta_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    rsvpCount: extras?.rsvpCount ?? 0,
    userJoined: extras?.userJoined ?? false,
  };
}

function formatWhen(iso: string | null) {
  if (!iso) return "Soon";
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "Soon";
  }
}

function excerpt(body: string, max = 110) {
  const clean = body.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

export function ensureMeetingBenchSeeded(db: Database = getDb()) {
  const count = (
    db.prepare(`SELECT COUNT(*) as n FROM meeting_bench_items`).get() as {
      n: number;
    }
  ).n;
  if (count === 0) {
    const season = currentGardenSeason();
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const seeds = seedItems(season, now, day);
    const insert = db.prepare(
      `INSERT INTO meeting_bench_items
        (id, kind, title, body, status, season, starts_at, ends_at, activity_type,
         villages_json, cta_label, cta_href, pinned, sort_order, meta_json, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`
    );
    const tx = db.transaction(() => {
      for (const item of seeds) {
        insert.run(
          item.id,
          item.kind,
          item.title,
          item.body,
          item.status,
          item.season,
          item.startsAt,
          item.endsAt,
          item.activityType,
          JSON.stringify(item.villages),
          item.ctaLabel,
          item.ctaHref,
          item.pinned ? 1 : 0,
          item.sortOrder,
          JSON.stringify(item.meta)
        );
      }
    });
    tx();
    try {
      persistMeetingBenchCatalog(db);
    } catch (err) {
      console.error("[meeting-bench] seed persist failed:", err);
    }
  }

  // Keep village workshops local: Observatory CTAs must stay Moonmere-only.
  const observatoryLeaks = db
    .prepare(
      `SELECT id, villages_json FROM meeting_bench_items
       WHERE cta_href = '/observatory' OR title = 'Stargazing Night'`
    )
    .all() as Array<{ id: string; villages_json: string }>;
  let repaired = false;
  for (const row of observatoryLeaks) {
    let villages: VillageId[] | "all" = "all";
    try {
      villages = JSON.parse(row.villages_json) as VillageId[] | "all";
    } catch {
      villages = "all";
    }
    const alreadyMoonmereOnly =
      Array.isArray(villages) &&
      villages.length === 1 &&
      villages[0] === "moonmere";
    if (!alreadyMoonmereOnly) {
      db.prepare(
        `UPDATE meeting_bench_items SET villages_json = ? WHERE id = ?`
      ).run(JSON.stringify(["moonmere"]), row.id);
      repaired = true;
    }
  }
  if (repaired) {
    try {
      persistMeetingBenchCatalog(db);
    } catch (err) {
      console.error("[meeting-bench] observatory locality persist failed:", err);
    }
  }
}

function seedItems(season: GardenSeason, now: number, day: number) {
  const seasonalBySeason: Record<
    GardenSeason,
    { title: string; body: string; activityType: string }
  > = {
    spring: {
      title: "Find Signs of New Growth",
      body: "The hedges are waking. Look for first buds, soft rain, returning birds, and anything that smells like green again. Share what you notice with the villages.",
      activityType: "nature",
    },
    summer: {
      title: "Sunset Collection",
      body: "Long evenings ask to be kept. Watch the sky turn gold, collect a warm memory, and leave a note for someone who missed the light.",
      activityType: "outdoors",
    },
    autumn: {
      title: "Leaf Collection Walk",
      body: "The paths are turning. Gather colours from the forest floor, listen for rain on leaves, and bring a little harvest feeling home.",
      activityType: "nature",
    },
    winter: {
      title: "Fireside Story Session",
      body: "The days are shorter and the rooms feel softer. Bring a warm drink, a quiet story, and sit with the season instead of rushing past it.",
      activityType: "cozy",
    },
  };
  const seasonal = seasonalBySeason[season];

  const communityTasks: Record<
    GardenSeason,
    Record<string, string>
  > = {
    spring: {
      clovermeadow: "Collect and identify signs of new growth.",
      bramblewood: "Explore the woodland and notice returning animals.",
      mosshollow: "Create a spring reading list.",
      hearthwick: "Share a fresh spring recipe by the fire.",
      moonmere: "Watch the milder nights and note one quiet change.",
    },
    summer: {
      clovermeadow: "Gather a golden-hour memory from the meadows.",
      bramblewood: "Find cool shade and something wild and ripe.",
      mosshollow: "Compile a summer reading hammock list.",
      hearthwick: "Share a cool evening recipe for long days.",
      moonmere: "Stay out for sunset and count the first stars.",
    },
    autumn: {
      clovermeadow: "Notice the harvest colours along the paths.",
      bramblewood: "Walk the forest floor and listen for rain on leaves.",
      mosshollow: "Make a rainy-day reading stack.",
      hearthwick: "Bake something warm and share the recipe.",
      moonmere: "Watch earlier dusk settle over the water.",
    },
    winter: {
      clovermeadow: "Find beauty in the quiet, slower meadow.",
      bramblewood: "Take a short winter walk and notice bare branches.",
      mosshollow: "Curate a fireside reading list.",
      hearthwick: "Share a cozy recipe for shorter days.",
      moonmere: "Stargaze on a clear cold night.",
    },
  };

  return [
    {
      id: randomUUID(),
      kind: "notice" as const,
      title: "A New Crafting Table Has Appeared",
      body: "Someone has left a basket of ribbons, buttons, paper and thread beside the old table in the Village Square. Perhaps they're hoping someone will put them to good use.",
      status: "published" as const,
      season: null,
      startsAt: null,
      endsAt: null,
      activityType: "feature",
      villages: "all" as const,
      ctaLabel: "Visit Village Square",
      ctaHref: "/village",
      pinned: true,
      sortOrder: 10,
      meta: {},
    },
    {
      id: randomUUID(),
      kind: "notice" as const,
      title: "TV Corner Soft Glow",
      body: "The cottage set has been humming later into the evening. New reels keep appearing on the channel shelf — the shuffle seems restless and happy.",
      status: "published" as const,
      season: null,
      startsAt: null,
      endsAt: null,
      activityType: "feature",
      villages: "all" as const,
      ctaLabel: "Tune in",
      ctaHref: "/tv-corner",
      pinned: false,
      sortOrder: 20,
      meta: {},
    },
    {
      id: randomUUID(),
      kind: "gathering" as const,
      title: "Village Movie Night",
      body: "Bring a cushion and meet at the glowing set. Every village is invited — the guide will shuffle something cozy once enough people arrive.",
      status: "upcoming" as const,
      season: null,
      startsAt: new Date(now + 3 * day).toISOString(),
      endsAt: new Date(now + 3 * day + 3 * 60 * 60 * 1000).toISOString(),
      activityType: "movie",
      villages: "all" as const,
      ctaLabel: "I'll be there",
      ctaHref: "/tv-corner",
      pinned: true,
      sortOrder: 10,
      meta: {},
    },
    {
      id: randomUUID(),
      kind: "gathering" as const,
      title: "Stargazing Night",
      body: "When the sky clears, Moonmere will leave the observatory lanterns low. Bring quiet eyes and warm layers — this night belongs to Moonmere's dome.",
      status: "upcoming" as const,
      season: null,
      startsAt: new Date(now + 6 * day).toISOString(),
      endsAt: new Date(now + 6 * day + 2 * 60 * 60 * 1000).toISOString(),
      activityType: "stargazing",
      villages: ["moonmere"] as VillageId[],
      ctaLabel: "Save my seat",
      ctaHref: "/observatory",
      pinned: false,
      sortOrder: 20,
      meta: {},
    },
    {
      id: randomUUID(),
      kind: "seasonal" as const,
      title: seasonal.title,
      body: seasonal.body,
      status: "active" as const,
      season,
      startsAt: null,
      endsAt: null,
      activityType: seasonal.activityType,
      villages: "all" as const,
      ctaLabel: "Join the season",
      ctaHref: "/meeting-bench#seasonal",
      pinned: true,
      sortOrder: 10,
      meta: {},
    },
    {
      id: randomUUID(),
      kind: "chronicle" as const,
      title: "A Curious Parcel Has Arrived in Mosshollow",
      body: "A small wooden parcel was discovered outside the library this morning. Nobody seems to know who left it there. The librarian has apparently decided to leave it unopened until someone finds the courage to investigate.",
      status: "published" as const,
      season: null,
      startsAt: null,
      endsAt: null,
      activityType: "lore",
      villages: ["mosshollow"] as VillageId[],
      ctaLabel: null,
      ctaHref: null,
      pinned: true,
      sortOrder: 10,
      meta: {},
    },
    {
      id: randomUUID(),
      kind: "chronicle" as const,
      title: "Clovermeadow Bees Are Keeping Odd Hours",
      body: "Residents report a soft humming after dusk near the blossom paths. The bees seem busy, though no one has spotted what they've been carrying home.",
      status: "published" as const,
      season: null,
      startsAt: null,
      endsAt: null,
      activityType: "lore",
      villages: ["clovermeadow"] as VillageId[],
      ctaLabel: null,
      ctaHref: null,
      pinned: false,
      sortOrder: 20,
      meta: {},
    },
    {
      id: randomUUID(),
      kind: "community_event" as const,
      title: `The Great ${SEASON_LABEL[season]} Gathering`,
      body: "Every village has received its own piece of the season. Complete your local activity and the whole forest moves forward together.",
      status: "active" as const,
      season,
      startsAt: new Date(now - day).toISOString(),
      endsAt: new Date(now + 14 * day).toISOString(),
      activityType: "community",
      villages: "all" as const,
      ctaLabel: "See village tasks",
      ctaHref: "/meeting-bench#community",
      pinned: true,
      sortOrder: 5,
      meta: {
        villageTasks: communityTasks[season],
      },
    },
  ];
}

function listRows(
  db: Database,
  kind?: BenchItemKind,
  includeDrafts = false
): ItemRow[] {
  if (kind) {
    return db
      .prepare(
        `SELECT * FROM meeting_bench_items
         WHERE kind = ?
           AND (? = 1 OR status NOT IN ('draft', 'archived'))
         ORDER BY pinned DESC, sort_order ASC, updated_at DESC`
      )
      .all(kind, includeDrafts ? 1 : 0) as ItemRow[];
  }
  return db
    .prepare(
      `SELECT * FROM meeting_bench_items
       WHERE (? = 1 OR status NOT IN ('draft', 'archived'))
       ORDER BY pinned DESC, sort_order ASC, updated_at DESC`
    )
    .all(includeDrafts ? 1 : 0) as ItemRow[];
}

function rsvpStats(db: Database, itemId: string, userId?: string | null) {
  const rsvpCount = (
    db
      .prepare(
        `SELECT COUNT(*) as n FROM meeting_bench_rsvps WHERE item_id = ?`
      )
      .get(itemId) as { n: number }
  ).n;
  const userJoined = userId
    ? Boolean(
        db
          .prepare(
            `SELECT 1 FROM meeting_bench_rsvps WHERE item_id = ? AND user_id = ?`
          )
          .get(itemId, userId)
      )
    : false;
  return { rsvpCount, userJoined };
}

export function listMeetingBenchItems(opts?: {
  kind?: BenchItemKind;
  includeDrafts?: boolean;
  userId?: string | null;
}): BenchItem[] {
  const db = getDb();
  ensureMeetingBenchSeeded(db);
  return listRows(db, opts?.kind, opts?.includeDrafts).map((row) =>
    mapItem(row, rsvpStats(db, row.id, opts?.userId))
  );
}

export function getMeetingBenchBoard(userId?: string | null) {
  const db = getDb();
  ensureMeetingBenchSeeded(db);
  const season = currentGardenSeason();
  const items = listMeetingBenchItems({ userId });
  return {
    season,
    seasonLabel: SEASON_LABEL[season],
    notices: items.filter((i) => i.kind === "notice"),
    gatherings: items.filter((i) => i.kind === "gathering"),
    seasonal: items.filter(
      (i) => i.kind === "seasonal" && (!i.season || i.season === season)
    ),
    chronicles: items.filter((i) => i.kind === "chronicle"),
    communityEvents: items.filter((i) => i.kind === "community_event"),
  };
}

export function getMeetingBenchTeaser(): BenchTeaser {
  const board = getMeetingBenchBoard();
  const notice = board.notices[0] || null;
  const gathering =
    board.gatherings.find((g) => g.status === "upcoming" || g.status === "active") ||
    board.gatherings[0] ||
    null;
  const seasonal = board.seasonal[0] || null;
  const chronicle = board.chronicles[0] || null;
  return {
    season: board.season,
    seasonLabel: board.seasonLabel,
    notice: notice
      ? { title: notice.title, excerpt: excerpt(notice.body) }
      : null,
    gathering: gathering
      ? { title: gathering.title, when: formatWhen(gathering.startsAt) }
      : null,
    seasonal: seasonal
      ? { title: seasonal.title, excerpt: excerpt(seasonal.body, 90) }
      : null,
    chronicle: chronicle
      ? { title: chronicle.title, excerpt: excerpt(chronicle.body, 90) }
      : null,
  };
}

export function createMeetingBenchItem(input: {
  kind: BenchItemKind;
  title: string;
  body: string;
  status?: BenchItemStatus;
  season?: GardenSeason | null;
  startsAt?: string | null;
  endsAt?: string | null;
  activityType?: string | null;
  villages?: VillageId[] | "all";
  ctaLabel?: string | null;
  ctaHref?: string | null;
  pinned?: boolean;
  sortOrder?: number;
  meta?: Record<string, unknown>;
  createdBy: string;
}) {
  const title = input.title.trim().slice(0, 120);
  const body = input.body.trim().slice(0, 4000);
  if (!title) return { ok: false as const, error: "Give it a title" };
  if (!body) return { ok: false as const, error: "Write a little something" };

  const db = getDb();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO meeting_bench_items
      (id, kind, title, body, status, season, starts_at, ends_at, activity_type,
       villages_json, cta_label, cta_href, pinned, sort_order, meta_json, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.kind,
    title,
    body,
    input.status || defaultStatus(input.kind),
    input.season || null,
    input.startsAt || null,
    input.endsAt || null,
    input.activityType || null,
    JSON.stringify(input.villages || "all"),
    input.ctaLabel || null,
    input.ctaHref || null,
    input.pinned ? 1 : 0,
    input.sortOrder ?? 50,
    JSON.stringify(input.meta || {}),
    input.createdBy
  );
  persistSafe(db);
  return { ok: true as const, item: getItemById(id)! };
}

function defaultStatus(kind: BenchItemKind): BenchItemStatus {
  if (kind === "gathering") return "upcoming";
  if (kind === "seasonal" || kind === "community_event") return "active";
  return "published";
}

function getItemById(id: string) {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM meeting_bench_items WHERE id = ?`)
    .get(id) as ItemRow | undefined;
  return row ? mapItem(row) : null;
}

export function updateMeetingBenchItem(
  id: string,
  patch: Partial<{
    kind: BenchItemKind;
    title: string;
    body: string;
    status: BenchItemStatus;
    season: GardenSeason | null;
    startsAt: string | null;
    endsAt: string | null;
    activityType: string | null;
    villages: VillageId[] | "all";
    ctaLabel: string | null;
    ctaHref: string | null;
    pinned: boolean;
    sortOrder: number;
    meta: Record<string, unknown>;
  }>
) {
  const existing = getItemById(id);
  if (!existing) return { ok: false as const, error: "Item not found" };

  const title = (patch.title ?? existing.title).trim().slice(0, 120);
  const body = (patch.body ?? existing.body).trim().slice(0, 4000);
  if (!title) return { ok: false as const, error: "Give it a title" };
  if (!body) return { ok: false as const, error: "Write a little something" };

  const db = getDb();
  db.prepare(
    `UPDATE meeting_bench_items SET
       kind = ?, title = ?, body = ?, status = ?, season = ?, starts_at = ?, ends_at = ?,
       activity_type = ?, villages_json = ?, cta_label = ?, cta_href = ?,
       pinned = ?, sort_order = ?, meta_json = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    patch.kind ?? existing.kind,
    title,
    body,
    patch.status ?? existing.status,
    patch.season === undefined ? existing.season : patch.season,
    patch.startsAt === undefined ? existing.startsAt : patch.startsAt,
    patch.endsAt === undefined ? existing.endsAt : patch.endsAt,
    patch.activityType === undefined
      ? existing.activityType
      : patch.activityType,
    JSON.stringify(
      patch.villages === undefined ? existing.villages : patch.villages
    ),
    patch.ctaLabel === undefined ? existing.ctaLabel : patch.ctaLabel,
    patch.ctaHref === undefined ? existing.ctaHref : patch.ctaHref,
    (patch.pinned ?? existing.pinned) ? 1 : 0,
    patch.sortOrder ?? existing.sortOrder,
    JSON.stringify(patch.meta ?? existing.meta),
    id
  );
  persistSafe(db);
  return { ok: true as const, item: getItemById(id)! };
}

/** Owner convenience: clone an item as a new draftable paper. */
export function duplicateMeetingBenchItem(id: string, createdBy: string) {
  const existing = getItemById(id);
  if (!existing) return { ok: false as const, error: "Item not found" };
  return createMeetingBenchItem({
    kind: existing.kind,
    title: `${existing.title} (copy)`,
    body: existing.body,
    status: existing.status === "archived" ? "draft" : existing.status,
    season: existing.season,
    startsAt: existing.startsAt,
    endsAt: existing.endsAt,
    activityType: existing.activityType,
    villages: existing.villages,
    ctaLabel: existing.ctaLabel,
    ctaHref: existing.ctaHref,
    pinned: false,
    sortOrder: existing.sortOrder + 1,
    meta: existing.meta,
    createdBy,
  });
}

export function deleteMeetingBenchItem(id: string) {
  const db = getDb();
  const existing = getItemById(id);
  if (!existing) return { ok: false as const, error: "Item not found" };
  db.prepare(`DELETE FROM meeting_bench_rsvps WHERE item_id = ?`).run(id);
  db.prepare(`DELETE FROM meeting_bench_items WHERE id = ?`).run(id);
  persistSafe(db);
  return { ok: true as const };
}

export function toggleMeetingBenchRsvp(itemId: string, userId: string) {
  const db = getDb();
  const item = getItemById(itemId);
  if (!item) return { ok: false as const, error: "Gathering not found" };
  if (item.kind !== "gathering" && item.kind !== "community_event") {
    return { ok: false as const, error: "Only gatherings can be joined" };
  }
  const existing = db
    .prepare(
      `SELECT 1 FROM meeting_bench_rsvps WHERE item_id = ? AND user_id = ?`
    )
    .get(itemId, userId);
  if (existing) {
    db.prepare(
      `DELETE FROM meeting_bench_rsvps WHERE item_id = ? AND user_id = ?`
    ).run(itemId, userId);
  } else {
    db.prepare(
      `INSERT INTO meeting_bench_rsvps (item_id, user_id) VALUES (?, ?)`
    ).run(itemId, userId);
  }
  const stats = rsvpStats(db, itemId, userId);
  return {
    ok: true as const,
    item: { ...item, ...stats },
  };
}

function persistSafe(db: Database) {
  try {
    persistMeetingBenchCatalog(db);
  } catch (err) {
    console.error("[meeting-bench] persist failed:", err);
  }
}
