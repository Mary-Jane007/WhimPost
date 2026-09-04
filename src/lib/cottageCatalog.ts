import type { CottageDecorDef, CottageDecorId } from "@/lib/cottageDecor";
import { COTTAGE_DECOR, isDecorUnlocked } from "@/lib/cottageDecor";
import type { CollectibleKind, VillageId } from "@/lib/villages";

export type CottageTimeOfDay = "day" | "evening" | "night";
export type CottageWeather =
  | "sunny"
  | "rain"
  | "cloudy"
  | "fog"
  | "snow"
  | "wind";

export type CottageStageId =
  | "little"
  | "settled"
  | "beloved"
  | "whimpost-home";

export type CottageItemCategory =
  | "furniture"
  | "decorations"
  | "wall"
  | "floor"
  | "special"
  | "plants"
  | "books"
  | "collectibles"
  | "seasonal";

export type CottageCatalogItem = CottageDecorDef & {
  category: CottageItemCategory;
  /** Optional illustrated sticker for a more realistic whimsical look. */
  image?: string;
  villageIds?: VillageId[];
  interactive?: "bookshelf" | "tv" | "hearth" | "window" | "chest" | "mascot";
};

/** Base cottage pieces with categories + sticker art where available. */
const BASE_ENRICHED: CottageCatalogItem[] = COTTAGE_DECOR.map((d) => {
  const extras: Partial<CottageCatalogItem> = {};
  if (d.id === "bookshelf") {
    extras.category = "books";
    extras.interactive = "bookshelf";
    extras.image = "/stickers/cassette.png";
  } else if (d.id === "hearth") {
    extras.category = "furniture";
    extras.interactive = "hearth";
    extras.image = "/stickers/candle-jar.png";
  } else if (d.id === "window-drape") {
    extras.category = "wall";
    extras.interactive = "window";
  } else if (d.id === "welcome-mat") {
    extras.category = "floor";
  } else if (d.id === "woven-rug") {
    extras.category = "floor";
  } else if (d.id === "potted-fern" || d.id === "garden-sill") {
    extras.category = "plants";
  } else if (d.id === "letter-bundle") {
    extras.category = "special";
    extras.image = "/stickers/ace-hearts.png";
  } else if (d.id === "keepsake-jar" || d.id === "pressed-leaves") {
    extras.category = "collectibles";
  } else if (d.id === "lantern" || d.id === "candle") {
    extras.category = "decorations";
    extras.image = "/stickers/candle-jar.png";
  } else if (d.id === "writing-desk") {
    extras.category = "furniture";
  } else if (d.id === "tea-nook") {
    extras.category = "furniture";
    extras.image = "/stickers/honey-jar.png";
  } else if (d.id === "wall-mirror") {
    extras.category = "wall";
    extras.image = "/stickers/hand-mirror.png";
  } else if (d.id === "ceiling-mobile") {
    extras.category = "decorations";
    extras.image = "/stickers/butterfly-green.png";
  } else {
    extras.category = "decorations";
  }
  return { ...d, category: extras.category || "decorations", ...extras };
});

const VILLAGE_EXTRAS: CottageCatalogItem[] = [
  // Bramblewood
  {
    id: "bw-map-table" as CottageDecorId,
    name: "Explorer's Map Table",
    emoji: "🗺️",
    lore: "Routes sketched in fox-orange ink.",
    unlock: { type: "always" },
    x: 58,
    y: 68,
    size: "lg",
    layer: "mid",
    category: "furniture",
    villageIds: ["bramblewood"],
    image: "/stickers/camera-vintage.png",
  },
  {
    id: "bw-backpack" as CottageDecorId,
    name: "Trail Backpack",
    emoji: "🎒",
    lore: "Still smelling faintly of pine and rain.",
    unlock: { type: "rank", minRep: 10, rankLabel: "Wanderer" },
    x: 18,
    y: 72,
    size: "md",
    layer: "floor",
    category: "furniture",
    villageIds: ["bramblewood"],
  },
  {
    id: "bw-fox" as CottageDecorId,
    name: "Fox Keepsake",
    emoji: "🦊",
    lore: "A wooden fox that watches the door.",
    unlock: { type: "rank", minRep: 30, rankLabel: "Villager" },
    x: 36,
    y: 48,
    size: "md",
    layer: "mid",
    category: "special",
    villageIds: ["bramblewood"],
    interactive: "mascot",
    image: "/stickers/fox-seated.png",
  },
  {
    id: "bw-binoculars" as CottageDecorId,
    name: "Trail Binoculars",
    emoji: "🔭",
    lore: "For spotting mushrooms after rain.",
    unlock: { type: "rank", minRep: 60, rankLabel: "Storykeeper" },
    x: 88,
    y: 44,
    size: "sm",
    layer: "mid",
    category: "decorations",
    villageIds: ["bramblewood"],
  },
  // Clovermeadow
  {
    id: "cm-potting" as CottageDecorId,
    name: "Potting Table",
    emoji: "🪴",
    lore: "Soil under the nails, sunshine in the room.",
    unlock: { type: "always" },
    x: 62,
    y: 64,
    size: "lg",
    layer: "mid",
    category: "furniture",
    villageIds: ["clovermeadow"],
  },
  {
    id: "cm-watering" as CottageDecorId,
    name: "Watering Can",
    emoji: "🚿",
    lore: "Painted with tiny bees.",
    unlock: { type: "rank", minRep: 10, rankLabel: "Wanderer" },
    x: 24,
    y: 70,
    size: "md",
    layer: "floor",
    category: "plants",
    villageIds: ["clovermeadow"],
  },
  {
    id: "cm-bee" as CottageDecorId,
    name: "Bee Charm",
    emoji: "🐝",
    lore: "Buzzes softly when the windows are open.",
    unlock: { type: "rank", minRep: 30, rankLabel: "Villager" },
    x: 40,
    y: 34,
    size: "sm",
    layer: "wall",
    category: "special",
    villageIds: ["clovermeadow"],
    interactive: "mascot",
    image: "/stickers/honey-bear.png",
  },
  {
    id: "cm-butterfly" as CottageDecorId,
    name: "Butterfly Frame",
    emoji: "🦋",
    lore: "Wings pressed between glass and memory.",
    unlock: { type: "rank", minRep: 60, rankLabel: "Storykeeper" },
    x: 20,
    y: 28,
    size: "md",
    layer: "wall",
    category: "wall",
    villageIds: ["clovermeadow"],
    image: "/stickers/butterfly-green.png",
  },
  // Mosshollow
  {
    id: "mh-globe" as CottageDecorId,
    name: "Study Globe",
    emoji: "🌍",
    lore: "Spins toward unanswered questions.",
    unlock: { type: "always" },
    x: 64,
    y: 52,
    size: "md",
    layer: "mid",
    category: "furniture",
    villageIds: ["mosshollow"],
  },
  {
    id: "mh-owl" as CottageDecorId,
    name: "Owl Bookmark",
    emoji: "🦉",
    lore: "Marks the page you meant to finish.",
    unlock: { type: "rank", minRep: 10, rankLabel: "Wanderer" },
    x: 30,
    y: 36,
    size: "md",
    layer: "mid",
    category: "special",
    villageIds: ["mosshollow"],
    interactive: "mascot",
  },
  {
    id: "mh-ink" as CottageDecorId,
    name: "Ink Bottle",
    emoji: "🖋️",
    lore: "The Library's favorite shade of midnight.",
    unlock: { type: "rank", minRep: 30, rankLabel: "Villager" },
    x: 78,
    y: 58,
    size: "sm",
    layer: "mid",
    category: "decorations",
    villageIds: ["mosshollow"],
  },
  {
    id: "mh-mystery" as CottageDecorId,
    name: "Mystery Board",
    emoji: "🧩",
    lore: "Strings and notes — a riddle mid-thought.",
    unlock: { type: "rank", minRep: 100, rankLabel: "Letterkeeper" },
    x: 12,
    y: 26,
    size: "lg",
    layer: "wall",
    category: "wall",
    villageIds: ["mosshollow"],
  },
  // Hearthwick
  {
    id: "hw-oven" as CottageDecorId,
    name: "Little Oven",
    emoji: "🍞",
    lore: "Warm enough to soften butter and worries.",
    unlock: { type: "always" },
    x: 20,
    y: 54,
    size: "lg",
    layer: "wall",
    category: "furniture",
    villageIds: ["hearthwick"],
  },
  {
    id: "hw-yarn" as CottageDecorId,
    name: "Yarn Basket",
    emoji: "🧶",
    lore: "Soft loops waiting for winter evenings.",
    unlock: { type: "rank", minRep: 10, rankLabel: "Wanderer" },
    x: 72,
    y: 72,
    size: "md",
    layer: "floor",
    category: "floor",
    villageIds: ["hearthwick"],
  },
  {
    id: "hw-hedgehog" as CottageDecorId,
    name: "Hedgehog Friend",
    emoji: "🦔",
    lore: "Napping near the warmest floorboard.",
    unlock: { type: "rank", minRep: 30, rankLabel: "Villager" },
    x: 44,
    y: 76,
    size: "md",
    layer: "floor",
    category: "special",
    villageIds: ["hearthwick"],
    interactive: "mascot",
    image: "/stickers/bear-cub.png",
  },
  {
    id: "hw-tea" as CottageDecorId,
    name: "Tea Tray",
    emoji: "🍵",
    lore: "Two cups, always.",
    unlock: { type: "rank", minRep: 60, rankLabel: "Storykeeper" },
    x: 34,
    y: 60,
    size: "sm",
    layer: "mid",
    category: "decorations",
    villageIds: ["hearthwick"],
    image: "/stickers/honey-jar.png",
  },
  // Moonmere
  {
    id: "mm-telescope" as CottageDecorId,
    name: "Cottage Telescope",
    emoji: "🔭",
    lore: "Points toward the lake's quiet stars.",
    unlock: { type: "always" },
    x: 78,
    y: 48,
    size: "lg",
    layer: "mid",
    category: "furniture",
    villageIds: ["moonmere"],
  },
  {
    id: "mm-star-map" as CottageDecorId,
    name: "Star Map",
    emoji: "✨",
    lore: "Constellations drawn by moonlight.",
    unlock: { type: "rank", minRep: 10, rankLabel: "Wanderer" },
    x: 22,
    y: 24,
    size: "lg",
    layer: "wall",
    category: "wall",
    villageIds: ["moonmere"],
  },
  {
    id: "mm-moth" as CottageDecorId,
    name: "Luna Moth Charm",
    emoji: "🦋",
    lore: "Soft wings, softer nights.",
    unlock: { type: "rank", minRep: 30, rankLabel: "Villager" },
    x: 48,
    y: 18,
    size: "md",
    layer: "ceiling",
    category: "special",
    villageIds: ["moonmere"],
    interactive: "mascot",
    image: "/stickers/dragonfly.png",
  },
  {
    id: "mm-shells" as CottageDecorId,
    name: "Lake Shells",
    emoji: "🐚",
    lore: "Gathered when the shore was silver.",
    unlock: { type: "rank", minRep: 60, rankLabel: "Storykeeper" },
    x: 66,
    y: 74,
    size: "sm",
    layer: "floor",
    category: "collectibles",
    villageIds: ["moonmere"],
  },
  // Shared interactive TV for every cottage (mid progression)
  {
    id: "memory-frame" as CottageDecorId,
    name: "Memory Frame",
    emoji: "🖼️",
    lore: "A quiet place to pin what mattered.",
    unlock: { type: "always" },
    x: 12,
    y: 42,
    size: "md",
    layer: "wall",
    category: "wall",
  },
  {
    id: "cottage-tv" as CottageDecorId,
    name: "Cottage Television",
    emoji: "📺",
    lore: "Tunes into your village lounge in TV Corner.",
    unlock: { type: "rank", minRep: 10, rankLabel: "Wanderer" },
    x: 50,
    y: 58,
    size: "md",
    layer: "mid",
    category: "furniture",
    interactive: "tv",
    image: "/stickers/cassette.png",
  },
  {
    id: "wooden-chest" as CottageDecorId,
    name: "Wooden Chest",
    emoji: "🧰",
    lore: "Sometimes locked. Sometimes whispering.",
    unlock: { type: "rank", minRep: 100, rankLabel: "Letterkeeper" },
    x: 88,
    y: 76,
    size: "md",
    layer: "floor",
    category: "furniture",
    interactive: "chest",
  },
];

export function catalogForVillage(villageId: VillageId | null | undefined) {
  const shared = [...BASE_ENRICHED, ...VILLAGE_EXTRAS.filter((i) => !i.villageIds)];
  const villageBits = villageId
    ? VILLAGE_EXTRAS.filter((i) => i.villageIds?.includes(villageId))
    : [];
  // Village extras first so themed starter pieces feel native; base fills the rest.
  const map = new Map<string, CottageCatalogItem>();
  for (const item of [...shared, ...villageBits]) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

export function getCatalogItem(
  id: string,
  villageId: VillageId | null | undefined
) {
  return catalogForVillage(villageId).find((i) => i.id === id) || null;
}

export const COTTAGE_STAGES: {
  id: CottageStageId;
  label: string;
  minFill: number;
  blurb: string;
}[] = [
  {
    id: "little",
    label: "Little Cottage",
    minFill: 0,
    blurb: "A simple room with room to grow.",
  },
  {
    id: "settled",
    label: "Settled Cottage",
    minFill: 25,
    blurb: "Furniture finds its place; the walls soften.",
  },
  {
    id: "beloved",
    label: "Beloved Cottage",
    minFill: 50,
    blurb: "Memories and keepsakes make it yours.",
  },
  {
    id: "whimpost-home",
    label: "WhimPost Home",
    minFill: 75,
    blurb: "A lived-in home in the WhimPost world.",
  },
];

export function stageFromFill(fill: number) {
  let current = COTTAGE_STAGES[0];
  for (const s of COTTAGE_STAGES) {
    if (fill >= s.minFill) current = s;
  }
  return current;
}

export const TV_LOUNGE_COPY: Record<
  VillageId,
  { title: string; nowPlaying: string }
> = {
  bramblewood: {
    title: "🦊 Bramblewood TV",
    nowPlaying: "Wildlife Documentary",
  },
  clovermeadow: {
    title: "🌼 Clovermeadow TV",
    nowPlaying: "Gardeners' World",
  },
  mosshollow: {
    title: "🦉 Mosshollow TV",
    nowPlaying: "Cozy Mystery",
  },
  hearthwick: {
    title: "🕯️ Hearthwick TV",
    nowPlaying: "Baking Show",
  },
  moonmere: {
    title: "🌙 Moonmere TV",
    nowPlaying: "Night on Earth",
  },
};

export const MASCOT_LINES: Record<VillageId, string[]> = {
  bramblewood: [
    "Looks like you've got a new place to call home.",
    "That map still smells like trail dust.",
    "Shall we wander a little farther today?",
  ],
  clovermeadow: [
    "Something bloomed while you were away.",
    "The bees approve of this arrangement.",
    "Water the sill — the light is perfect.",
  ],
  mosshollow: [
    "Quiet pages make the best neighbors.",
    "There's a bookmark waiting on the desk.",
    "Every shelf remembers who last whispered here.",
  ],
  hearthwick: [
    "That smells like freshly baked bread...",
    "The kettle is almost singing.",
    "Come sit — the hearth saved you a spot.",
  ],
  moonmere: [
    "The moon looks unusually bright tonight.",
    "Starlight likes this window best.",
    "Listen — the lake is thinking aloud.",
  ],
};

export function defaultSeason(): "spring" | "summer" | "autumn" | "winter" {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}

export function defaultWeather(season = defaultSeason()): CottageWeather {
  if (season === "winter") return "snow";
  if (season === "autumn") return "cloudy";
  if (season === "spring") return "rain";
  return "sunny";
}

export function defaultTimeOfDay(date = new Date()): CottageTimeOfDay {
  const h = date.getHours();
  if (h >= 6 && h < 17) return "day";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

export const STORAGE_CATEGORIES: {
  id: CottageItemCategory;
  label: string;
}[] = [
  { id: "furniture", label: "Furniture" },
  { id: "decorations", label: "Decorations" },
  { id: "wall", label: "Wall" },
  { id: "floor", label: "Floor" },
  { id: "plants", label: "Plants" },
  { id: "books", label: "Books" },
  { id: "collectibles", label: "Collectibles" },
  { id: "seasonal", label: "Seasonal" },
  { id: "special", label: "Special" },
];

export function nextCatalogUnlocks(
  villageId: VillageId | null | undefined,
  reputation: number,
  collectibles: Partial<Record<CollectibleKind, number>>,
  limit = 3
) {
  return catalogForVillage(villageId)
    .filter((d) => !isDecorUnlocked(d, reputation, collectibles))
    .sort((a, b) => {
      const score = (d: CottageCatalogItem) => {
        if (d.unlock.type === "rank") return d.unlock.minRep;
        if (d.unlock.type === "keepsakes") return 20 + d.unlock.min * 5;
        return 0;
      };
      return score(a) - score(b);
    })
    .slice(0, limit);
}

export function cottageCatalogFillPercent(
  villageId: VillageId | null | undefined,
  reputation: number,
  collectibles: Partial<Record<CollectibleKind, number>>
) {
  const catalog = catalogForVillage(villageId);
  const unlocked = catalog.filter((d) =>
    isDecorUnlocked(d, reputation, collectibles)
  ).length;
  return Math.round((unlocked / Math.max(1, catalog.length)) * 100);
}
