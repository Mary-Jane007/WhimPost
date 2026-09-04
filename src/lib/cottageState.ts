import { randomUUID } from "crypto";
import type { Database } from "better-sqlite3";
import {
  catalogForVillage,
  cottageCatalogFillPercent,
  defaultSeason,
  defaultTimeOfDay,
  defaultWeather,
  stageFromFill,
  type CottageTimeOfDay,
  type CottageWeather,
} from "@/lib/cottageCatalog";
import {
  isDecorUnlocked,
  keepsakeTotal,
} from "@/lib/cottageDecor";
import type { CollectibleKind, VillageId } from "@/lib/villages";
import { COLLECTIBLE_META, getVillage } from "@/lib/villages";

export type CottagePlacement = {
  itemId: string;
  x: number;
  y: number;
  rotation: number;
  placed: boolean;
  favorite?: boolean;
};

export type CottageMemory = {
  id: string;
  memoryType: string;
  referenceId?: string;
  title: string;
  description: string;
  emoji: string;
  dateLabel: string;
  pinned: boolean;
};

export type CottagePersisted = {
  cottageName: string;
  description: string;
  signText: string;
  favoriteItemId: string | null;
  welcomed: boolean;
  layoutTouched: boolean;
  timeMode: "auto" | CottageTimeOfDay;
  weatherMode: "auto" | CottageWeather;
  placements: CottagePlacement[];
  memories: CottageMemory[];
  displayedLetterId: string | null;
  updatedAt: string;
};

export type CottageView = CottagePersisted & {
  villageId: VillageId | null;
  fillPercent: number;
  stage: ReturnType<typeof stageFromFill>;
  season: ReturnType<typeof defaultSeason>;
  effectiveTime: CottageTimeOfDay;
  effectiveWeather: CottageWeather;
  letterCount: number;
  discoveryCount: number;
};

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function defaultName(displayName: string, villageId: VillageId | null) {
  const village = villageId ? getVillage(villageId) : null;
  if (village?.id === "bramblewood") return `${displayName}'s Foxglove Nook`;
  if (village?.id === "clovermeadow") return `${displayName}'s Honeybell House`;
  if (village?.id === "mosshollow") return `${displayName}'s Quiet Shelf`;
  if (village?.id === "hearthwick") return `${displayName}'s Little Lantern`;
  if (village?.id === "moonmere") return `${displayName}'s Moss & Moon`;
  return `${displayName}'s Cottage`;
}

function seedPlacements(
  villageId: VillageId | null,
  reputation: number,
  collectibles: Partial<Record<CollectibleKind, number>>
): CottagePlacement[] {
  return catalogForVillage(villageId).map((item) => ({
    itemId: item.id,
    x: item.x,
    y: item.y,
    rotation: 0,
    placed: isDecorUnlocked(item, reputation, collectibles),
  }));
}

function seedMemories(input: {
  displayName: string;
  createdAt: string;
  villageId: VillageId | null;
  reputation: number;
  collectibles: Partial<Record<CollectibleKind, number>>;
}): CottageMemory[] {
  const village = input.villageId ? getVillage(input.villageId) : null;
  const date = input.createdAt
    ? new Date(input.createdAt)
    : new Date();
  const dateLabel = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const memories: CottageMemory[] = [
    {
      id: "mem-welcome",
      memoryType: "joined",
      title: "First Homecoming",
      description: `Every villager deserves a little place to call their own. Welcome home, ${input.displayName}.`,
      emoji: "🏡",
      dateLabel,
      pinned: true,
    },
  ];
  if (village) {
    memories.push({
      id: `mem-village-${village.id}`,
      memoryType: "village",
      referenceId: village.id,
      title: `Belonging · ${village.name}`,
      description: village.motto || `Home among the ${village.name} paths.`,
      emoji: village.mascot,
      dateLabel,
      pinned: true,
    });
  }
  if (input.reputation >= 30) {
    memories.push({
      id: "mem-villager",
      memoryType: "rank",
      title: "Became a Villager",
      description: "Letters and kindness settled into standing.",
      emoji: "⭐",
      dateLabel,
      pinned: false,
    });
  }
  const kinds = Object.entries(input.collectibles).filter(
    ([, n]) => (n || 0) > 0
  ) as [CollectibleKind, number][];
  if (kinds.length > 0) {
    const [kind] = kinds[0];
    const meta = COLLECTIBLE_META[kind];
    memories.push({
      id: `mem-collectible-${kind}`,
      memoryType: "collectible",
      referenceId: kind,
      title: `First find · ${meta.name}`,
      description: "A keepsake from the path, now part of home.",
      emoji: meta.emoji,
      dateLabel,
      pinned: false,
    });
  }
  return memories;
}

export function ensureCottageTable(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_cottages (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      village_id TEXT,
      cottage_name TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      sign_text TEXT NOT NULL DEFAULT '',
      favorite_item_id TEXT,
      welcomed INTEGER NOT NULL DEFAULT 0,
      layout_touched INTEGER NOT NULL DEFAULT 0,
      time_mode TEXT NOT NULL DEFAULT 'auto',
      weather_mode TEXT NOT NULL DEFAULT 'auto',
      placements_json TEXT NOT NULL DEFAULT '[]',
      memories_json TEXT NOT NULL DEFAULT '[]',
      displayed_letter_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  try {
    db.exec(
      `ALTER TABLE user_cottages ADD COLUMN layout_touched INTEGER NOT NULL DEFAULT 0`
    );
  } catch {
    /* already present */
  }
}

function rowToPersisted(row: {
  cottage_name: string;
  description: string;
  sign_text: string;
  favorite_item_id: string | null;
  welcomed: number;
  layout_touched?: number;
  time_mode: string;
  weather_mode: string;
  placements_json: string;
  memories_json: string;
  displayed_letter_id: string | null;
  updated_at: string;
}): CottagePersisted {
  return {
    cottageName: row.cottage_name,
    description: row.description || "",
    signText: row.sign_text || "",
    favoriteItemId: row.favorite_item_id,
    welcomed: Boolean(row.welcomed),
    layoutTouched: Boolean(row.layout_touched),
    timeMode: (row.time_mode as CottagePersisted["timeMode"]) || "auto",
    weatherMode: (row.weather_mode as CottagePersisted["weatherMode"]) || "auto",
    placements: parseJson(row.placements_json, []),
    memories: parseJson(row.memories_json, []),
    displayedLetterId: row.displayed_letter_id,
    updatedAt: row.updated_at,
  };
}

function mergePlacements(
  villageId: VillageId | null,
  saved: CottagePlacement[],
  reputation: number,
  collectibles: Partial<Record<CollectibleKind, number>>
): CottagePlacement[] {
  const catalog = catalogForVillage(villageId);
  const byId = new Map(saved.map((p) => [p.itemId, p]));
  return catalog.map((item) => {
    const existing = byId.get(item.id);
    const unlocked = isDecorUnlocked(item, reputation, collectibles);
    if (existing) {
      // Newly unlocked pieces that were never stored should appear in the room.
      if (unlocked && !saved.some((x) => x.itemId === item.id)) {
        return { ...existing, placed: true };
      }
      return existing;
    }
    return {
      itemId: item.id,
      x: item.x,
      y: item.y,
      rotation: 0,
      placed: unlocked,
    };
  });
}

export function getOrCreateCottage(
  db: Database,
  user: {
    id: string;
    displayName: string;
    createdAt: string;
    reputation: number;
    homeVillageId: string | null;
    villageId: string | null;
  },
  collectibles: Partial<Record<CollectibleKind, number>>,
  letterCount = 0
): CottageView {
  ensureCottageTable(db);
  const villageId = (user.homeVillageId ||
    user.villageId) as VillageId | null;

  let row = db
    .prepare(`SELECT * FROM user_cottages WHERE user_id = ?`)
    .get(user.id) as
    | {
        cottage_name: string;
        description: string;
        sign_text: string;
        favorite_item_id: string | null;
        welcomed: number;
        time_mode: string;
        weather_mode: string;
        placements_json: string;
        memories_json: string;
        displayed_letter_id: string | null;
        updated_at: string;
      }
    | undefined;

  if (!row) {
    const placements = seedPlacements(
      villageId,
      user.reputation,
      collectibles
    );
    const memories = seedMemories({
      displayName: user.displayName,
      createdAt: user.createdAt,
      villageId,
      reputation: user.reputation,
      collectibles,
    });
    const name = defaultName(user.displayName, villageId);
    const sign = `Welcome to ${name}`;
    db.prepare(
      `INSERT INTO user_cottages (
        user_id, village_id, cottage_name, description, sign_text,
        placements_json, memories_json, welcomed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0)`
    ).run(
      user.id,
      villageId,
      name,
      "A quiet little cottage where letters, keepsakes, and soft light gather.",
      sign,
      JSON.stringify(placements),
      JSON.stringify(memories)
    );
    row = db
      .prepare(`SELECT * FROM user_cottages WHERE user_id = ?`)
      .get(user.id) as typeof row;
  }

  const persisted = rowToPersisted(row!);
  const placements = mergePlacements(
    villageId,
    persisted.placements,
    user.reputation,
    collectibles
  );
  // Until the villager rearranges things, keep the room filled with
  // everything they've unlocked so the cottage never feels barren.
  if (!persisted.layoutTouched) {
    for (const item of catalogForVillage(villageId)) {
      const p = placements.find((x) => x.itemId === item.id);
      if (!p) continue;
      p.placed = isDecorUnlocked(item, user.reputation, collectibles);
    }
  } else {
    for (const item of catalogForVillage(villageId)) {
      const p = placements.find((x) => x.itemId === item.id);
      if (!p) continue;
      const unlocked = isDecorUnlocked(item, user.reputation, collectibles);
      if (unlocked && !persisted.placements.some((x) => x.itemId === item.id)) {
        p.placed = true;
      }
    }
  }

  const fill = cottageCatalogFillPercent(
    villageId,
    user.reputation,
    collectibles
  );
  const season = defaultSeason();
  const effectiveTime =
    persisted.timeMode === "auto"
      ? defaultTimeOfDay()
      : persisted.timeMode;
  const effectiveWeather =
    persisted.weatherMode === "auto"
      ? defaultWeather(season)
      : persisted.weatherMode;

  return {
    ...persisted,
    placements,
    villageId,
    fillPercent: fill,
    stage: stageFromFill(fill),
    season,
    effectiveTime,
    effectiveWeather,
    letterCount,
    discoveryCount: keepsakeTotal(collectibles),
  };
}

export type CottagePatch = Partial<{
  cottageName: string;
  description: string;
  signText: string;
  favoriteItemId: string | null;
  welcomed: boolean;
  layoutTouched: boolean;
  timeMode: CottagePersisted["timeMode"];
  weatherMode: CottagePersisted["weatherMode"];
  placements: CottagePlacement[];
  memories: CottageMemory[];
  displayedLetterId: string | null;
}>;

export function updateCottage(
  db: Database,
  userId: string,
  patch: CottagePatch
): void {
  ensureCottageTable(db);
  const current = db
    .prepare(`SELECT * FROM user_cottages WHERE user_id = ?`)
    .get(userId) as Record<string, unknown> | undefined;
  if (!current) return;

  const next = {
    cottage_name:
      patch.cottageName !== undefined
        ? String(patch.cottageName).slice(0, 64)
        : String(current.cottage_name || ""),
    description:
      patch.description !== undefined
        ? String(patch.description).slice(0, 280)
        : String(current.description || ""),
    sign_text:
      patch.signText !== undefined
        ? String(patch.signText).slice(0, 80)
        : String(current.sign_text || ""),
    favorite_item_id:
      patch.favoriteItemId !== undefined
        ? patch.favoriteItemId
        : (current.favorite_item_id as string | null),
    welcomed:
      patch.welcomed !== undefined
        ? patch.welcomed
          ? 1
          : 0
        : Number(current.welcomed || 0),
    layout_touched:
      patch.layoutTouched !== undefined
        ? patch.layoutTouched
          ? 1
          : 0
        : patch.placements !== undefined
          ? 1
          : Number(current.layout_touched || 0),
    time_mode:
      patch.timeMode !== undefined
        ? patch.timeMode
        : String(current.time_mode || "auto"),
    weather_mode:
      patch.weatherMode !== undefined
        ? patch.weatherMode
        : String(current.weather_mode || "auto"),
    placements_json:
      patch.placements !== undefined
        ? JSON.stringify(patch.placements)
        : String(current.placements_json || "[]"),
    memories_json:
      patch.memories !== undefined
        ? JSON.stringify(patch.memories)
        : String(current.memories_json || "[]"),
    displayed_letter_id:
      patch.displayedLetterId !== undefined
        ? patch.displayedLetterId
        : (current.displayed_letter_id as string | null),
  };

  db.prepare(
    `UPDATE user_cottages SET
      cottage_name = ?,
      description = ?,
      sign_text = ?,
      favorite_item_id = ?,
      welcomed = ?,
      layout_touched = ?,
      time_mode = ?,
      weather_mode = ?,
      placements_json = ?,
      memories_json = ?,
      displayed_letter_id = ?,
      updated_at = datetime('now')
    WHERE user_id = ?`
  ).run(
    next.cottage_name,
    next.description,
    next.sign_text,
    next.favorite_item_id,
    next.welcomed,
    next.layout_touched,
    next.time_mode,
    next.weather_mode,
    next.placements_json,
    next.memories_json,
    next.displayed_letter_id,
    userId
  );
}

export function newMemoryId() {
  return `mem-${randomUUID().slice(0, 8)}`;
}

export function countUserLetters(db: Database, userId: string) {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS n FROM letters
       WHERE recipient_id = ? OR sender_id = ?`
    )
    .get(userId, userId) as { n: number };
  return Number(row?.n || 0);
}
