export type VillageId =
  | "mosshollow"
  | "clovermeadow"
  | "moonmere"
  | "bramblewood"
  | "hearthwick";

export type ForestRank =
  | "seedling"
  | "wanderer"
  | "villager"
  | "storykeeper"
  | "letterkeeper"
  | "elder"
  | "forest-guardian";

export type CollectibleKind =
  | "mushrooms"
  | "leaves"
  | "feathers"
  | "lost-pages"
  | "butterflies"
  | "moonstones"
  | "acorns";

export interface VillageInfo {
  id: VillageId;
  name: string;
  motto: string;
  theme: string;
  belongs: string[];
  mascot: string;
  mascotName: string;
  /** Optional illustrated mascot image (replaces emoji when set). */
  mascotImage?: string;
  color: string;
  colorSoft: string;
  tasks: string[];
  building: string;
  buildingEmoji: string;
}

export const VILLAGES: VillageInfo[] = [
  {
    id: "mosshollow",
    name: "Mosshollow",
    motto: "Where stories are preserved.",
    theme:
      "An ancient village beneath towering oaks. The library is carved into a giant tree, and every letter is treated like a treasure.",
    belongs: ["Readers", "Writers", "Quiet thinkers", "Long-letter lovers"],
    mascot: "🦉",
    mascotName: "Owl",
    color: "#1f4d3a",
    colorSoft: "#6b8f71",
    tasks: [
      "Write one thoughtful letter each week",
      "Recommend a book to another villager",
      'Collect "Pressed Leaves" by writing long letters',
      "Discover hidden quotes around the village",
    ],
    building: "The Great Library",
    buildingEmoji: "📚",
  },
  {
    id: "clovermeadow",
    name: "Clovermeadow",
    motto: "Where kindness grows.",
    theme: "Flower fields, cottages, gardens, and bees.",
    belongs: ["Friendly souls", "Encouragers", "Optimists", "Smile-makers"],
    mascot: "🐝",
    mascotName: "Bee",
    mascotImage: "/villages/clovermeadow/mascot.png",
    color: "#d4849a",
    colorSoft: "#f2c4d0",
    tasks: [
      "Send compliments",
      "Welcome new villagers",
      "Leave anonymous encouraging notes",
      "Plant flowers by completing acts of kindness",
    ],
    building: "Community Garden",
    buildingEmoji: "🌻",
  },
  {
    id: "moonmere",
    name: "Moonmere",
    motto: "Where dreams become letters.",
    theme: "A peaceful lakeside village lit by lanterns.",
    belongs: ["Dreamers", "Philosophers", "Night owls", "Deep thinkers"],
    mascot: "🦋",
    mascotName: "Luna moth",
    color: "#1a2744",
    colorSoft: "#6b7fa8",
    tasks: [
      "Answer a Question of the Day",
      "Write about dreams",
      "Tell stories",
      "Reflect on life's mysteries",
    ],
    building: "The Moon Dock",
    buildingEmoji: "🌙",
  },
  {
    id: "bramblewood",
    name: "Bramblewood",
    motto: "Adventure begins beyond the trees.",
    theme: "Forest paths, foxes, and hidden ruins.",
    belongs: ["Curious minds", "Explorers", "Storytellers", "Adventurers"],
    mascot: "🦊",
    mascotName: "Fox",
    color: "#b85c38",
    colorSoft: "#d4a484",
    tasks: [
      "Solve weekly riddles",
      "Find hidden collectibles around WhimPost",
      "Write fictional letters",
      "Go on seasonal quests",
    ],
    building: "Explorer's Guild",
    buildingEmoji: "🗺️",
  },
  {
    id: "hearthwick",
    name: "Hearthwick",
    motto: "Every stranger is welcomed home.",
    theme: "Warm fireplaces, bakeries, and tea shops.",
    belongs: ["Cozy hearts", "Good listeners", "Calm souls", "Tea lovers"],
    mascot: "🦔",
    mascotName: "Hedgehog",
    color: "#6b4226",
    colorSoft: "#c4a484",
    tasks: [
      "Host tea conversations",
      "Share recipes",
      "Write comforting letters",
      "Keep the village fire burning by staying active",
    ],
    building: "The Hearth Hall",
    buildingEmoji: "☕",
  },
];

export const VILLAGE_MAP = Object.fromEntries(
  VILLAGES.map((v) => [v.id, v])
) as Record<VillageId, VillageInfo>;

export const SHARED_FEATURES = [
  { emoji: "🏘️", name: "Village Square" },
  { emoji: "📮", name: "Post Office" },
  { emoji: "🌳", name: "Notice Board" },
  { emoji: "🪑", name: "Meeting Bench" },
  { emoji: "🌼", name: "Seasonal Decorations" },
  { emoji: "📬", name: "Daily Mail" },
];

export const SEASONAL_EVENTS = [
  "🍂 Autumn Harvest Festival",
  "❄ Winter Lantern Festival",
  "🌸 Spring Blossom Fair",
  "☀ Firefly Nights",
  "🎃 Pumpkin Letter Exchange",
  "🎄 Secret Winter Pen Pal",
];

export const COLLECTIBLE_META: Record<
  CollectibleKind,
  { emoji: string; name: string; max: number }
> = {
  mushrooms: { emoji: "🍄", name: "Mushrooms", max: 25 },
  leaves: { emoji: "🍃", name: "Leaves", max: 40 },
  feathers: { emoji: "🪶", name: "Feathers", max: 20 },
  "lost-pages": { emoji: "📖", name: "Lost Pages", max: 50 },
  butterflies: { emoji: "🦋", name: "Butterflies", max: 15 },
  moonstones: { emoji: "🌙", name: "Moonstones", max: 10 },
  acorns: { emoji: "🌰", name: "Acorns", max: 30 },
};

export const RANK_LADDER: {
  id: ForestRank;
  label: string;
  emoji: string;
  minRep: number;
}[] = [
  { id: "seedling", label: "Seedling", emoji: "🌱", minRep: 0 },
  { id: "wanderer", label: "Wanderer", emoji: "🍃", minRep: 10 },
  { id: "villager", label: "Villager", emoji: "🌼", minRep: 30 },
  { id: "storykeeper", label: "Storykeeper", emoji: "🪶", minRep: 60 },
  { id: "letterkeeper", label: "Letterkeeper", emoji: "📜", minRep: 100 },
  { id: "elder", label: "Elder", emoji: "🦉", minRep: 160 },
  { id: "forest-guardian", label: "Forest Guardian", emoji: "🌳", minRep: 250 },
];

export const REP_REWARDS = {
  sendLetter: 3,
  welcomeFriend: 5,
  longLetter: 2,
  weeklyPrompt: 2,
} as const;

export function getVillage(id: string | null | undefined): VillageInfo | null {
  if (!id) return null;
  return VILLAGE_MAP[id as VillageId] || null;
}

export function isVillageId(id: string): id is VillageId {
  return id in VILLAGE_MAP;
}

export function rankFromRep(rep: number) {
  let current = RANK_LADDER[0];
  for (const rank of RANK_LADDER) {
    if (rep >= rank.minRep) current = rank;
  }
  return current;
}

export function emptyCollectibles(): Record<CollectibleKind, number> {
  return {
    mushrooms: 0,
    leaves: 0,
    feathers: 0,
    "lost-pages": 0,
    butterflies: 0,
    moonstones: 0,
    acorns: 0,
  };
}

export function parseCollectibles(raw: string | null | undefined) {
  const base = emptyCollectibles();
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Partial<Record<CollectibleKind, number>>;
    for (const key of Object.keys(base) as CollectibleKind[]) {
      const n = Number(parsed[key] || 0);
      base[key] = Math.max(0, Math.min(COLLECTIBLE_META[key].max, n));
    }
  } catch {
    /* keep empty */
  }
  return base;
}
