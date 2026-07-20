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
  // Shared forest keepsakes (default villages)
  | "mushrooms"
  | "leaves"
  | "feathers"
  | "lost-pages"
  | "butterflies"
  | "moonstones"
  | "acorns"
  // Clovermeadow
  | "clover-butterflies"
  | "clover-bunnies"
  | "clover-lotus"
  | "clover-ribbon"
  | "clover-cherries"
  | "clover-honey"
  | "clover-blossoms"
  | "clover-hearts"
  // Moonmere
  | "moon-shards"
  | "moon-moths"
  | "moon-starlight"
  | "moon-pearls"
  | "moon-lanterns"
  | "moon-lilies"
  | "moon-dreams"
  | "moon-dust"
  // Bramblewood
  | "bramble-fox-tails"
  | "bramble-maple"
  | "bramble-pumpkins"
  | "bramble-mushrooms"
  | "bramble-candles"
  | "bramble-compasses"
  | "bramble-monarchs"
  | "bramble-pinecones"
  // Hearthwick
  | "hearth-teacups"
  | "hearth-blankets"
  | "hearth-muffins"
  | "hearth-recipes"
  | "hearth-cinnamon-rolls"
  | "hearth-embers"
  | "hearth-kettles"
  | "hearth-letters";

export type CollectibleMeta = {
  emoji: string;
  name: string;
  max: number;
  image?: string;
};

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
      "An overgrown library village beneath towering oaks — moss on stone arches, pressed ferns in journals, and every letter kept like a treasure among the shelves.",
    belongs: ["Readers", "Writers", "Quiet thinkers", "Long-letter lovers"],
    mascot: "🦉",
    mascotName: "Owl",
    mascotImage: "/villages/mosshollow/mascot.png",
    color: "#1a3d2e",
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
    theme:
      "A lakeside village of lanterns and engraved moons — moths at the dock, fairies in the starlight, and every letter written like a dream pressed into parchment.",
    belongs: ["Dreamers", "Philosophers", "Night owls", "Deep thinkers"],
    mascot: "🦋",
    mascotName: "Luna moth",
    mascotImage: "/villages/moonmere/mascot.png",
    color: "#2a3548",
    colorSoft: "#8a9b88",
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
    theme:
      "A warm-orange autumn wood of fox dens and fallen leaves — Hello Fall candles, knit socks by the fire, teapot steam, and every letter sealed with a little woodland luck.",
    belongs: ["Curious minds", "Explorers", "Storytellers", "Adventurers"],
    mascot: "🦊",
    mascotName: "Fox",
    mascotImage: "/villages/bramblewood/mascot.png",
    color: "#e07020",
    colorSoft: "#f0a868",
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
    theme:
      "A cozy apothecary cottage of amber potions and dried blooms — hedgehog herbalists at wooden tables, cinnamon and berries, lavender jars, and every letter steeped in hearthside warmth.",
    belongs: ["Cozy hearts", "Good listeners", "Calm souls", "Tea lovers"],
    mascot: "🦔",
    mascotName: "Hedgehog",
    mascotImage: "/villages/hearthwick/mascot.png",
    color: "#8b5a2b",
    colorSoft: "#e2c39a",
    tasks: [
      "Host tea conversations",
      "Share recipes",
      "Write comforting letters",
      "Keep the village fire burning by staying active",
    ],
    building: "The Hearth Hall",
    buildingEmoji: "🫖",
  },
];

export const VILLAGE_MAP = Object.fromEntries(
  VILLAGES.map((v) => [v.id, v])
) as Record<VillageId, VillageInfo>;

/** System sender user ids used for village welcome letters. */
export const VILLAGE_SYSTEM_SENDER_IDS: Partial<Record<VillageId, string>> = {
  mosshollow: "system-mosshollow",
  clovermeadow: "system-clovermeadow",
  moonmere: "system-moonmere",
  bramblewood: "system-bramblewood",
};

export function villageIdFromSystemSender(
  senderId: string
): VillageId | null {
  const found = (
    Object.entries(VILLAGE_SYSTEM_SENDER_IDS) as Array<[VillageId, string]>
  ).find(([, id]) => id === senderId);
  return found ? found[0] : null;
}

export function mascotForSystemSender(senderId: string): {
  emoji: string;
  name: string;
  image?: string;
} | null {
  const villageId = villageIdFromSystemSender(senderId);
  if (!villageId) return null;
  const village = getVillage(villageId);
  if (!village) return null;
  return {
    emoji: village.mascot,
    name: village.mascotName,
    image: village.mascotImage,
  };
}

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

export const COLLECTIBLE_META: Record<CollectibleKind, CollectibleMeta> = {
  mushrooms: {
    emoji: "🍄",
    name: "Mushrooms",
    max: 25,
    image: "/stickers/collectibles/forest/mushrooms.png",
  },
  leaves: {
    emoji: "🍃",
    name: "Leaves",
    max: 40,
    image: "/stickers/collectibles/forest/leaves.png",
  },
  feathers: {
    emoji: "🪶",
    name: "Feathers",
    max: 20,
    image: "/stickers/collectibles/forest/feathers.png",
  },
  "lost-pages": {
    emoji: "📖",
    name: "Lost Pages",
    max: 50,
    image: "/stickers/collectibles/forest/lost-pages.png",
  },
  butterflies: {
    emoji: "🦋",
    name: "Butterflies",
    max: 15,
    image: "/stickers/collectibles/forest/butterflies.png",
  },
  moonstones: {
    emoji: "🌙",
    name: "Moonstones",
    max: 10,
    image: "/stickers/collectibles/forest/moonstones.png",
  },
  acorns: {
    emoji: "🌰",
    name: "Acorns",
    max: 30,
    image: "/stickers/collectibles/forest/acorns.png",
  },
  "clover-butterflies": {
    emoji: "🦋",
    name: "Pink Butterflies",
    max: 20,
    image: "/stickers/collectibles/clovermeadow/clover-butterflies.png",
  },
  "clover-bunnies": {
    emoji: "🐰",
    name: "Meadow Bunnies",
    max: 15,
    image: "/stickers/collectibles/clovermeadow/clover-bunnies.png",
  },
  "clover-lotus": {
    emoji: "🪷",
    name: "Pink Lotus",
    max: 12,
    image: "/stickers/collectibles/clovermeadow/clover-lotus.png",
  },
  "clover-ribbon": {
    emoji: "🎀",
    name: "Pink Ribbons",
    max: 18,
    image: "/stickers/collectibles/clovermeadow/clover-ribbon.png",
  },
  "clover-cherries": {
    emoji: "🍒",
    name: "Gingham Cherries",
    max: 16,
    image: "/stickers/collectibles/clovermeadow/clover-cherries.png",
  },
  "clover-honey": {
    emoji: "🍯",
    name: "Village Honey",
    max: 14,
    image: "/stickers/collectibles/clovermeadow/clover-honey.png",
  },
  "clover-blossoms": {
    emoji: "🌸",
    name: "Cherry Blossoms",
    max: 22,
    image: "/stickers/collectibles/clovermeadow/clover-blossoms.png",
  },
  "clover-hearts": {
    emoji: "💗",
    name: "Soft Hearts",
    max: 20,
    image: "/stickers/collectibles/clovermeadow/clover-hearts.png",
  },
  "moon-shards": {
    emoji: "🌙",
    name: "Moonshards",
    max: 20,
    image: "/stickers/collectibles/moonmere/moon-shards.png",
  },
  "moon-moths": {
    emoji: "🦋",
    name: "Luna Moths",
    max: 16,
    image: "/stickers/collectibles/moonmere/moon-moths.png",
  },
  "moon-starlight": {
    emoji: "✨",
    name: "Starlight",
    max: 25,
    image: "/stickers/collectibles/moonmere/moon-starlight.png",
  },
  "moon-pearls": {
    emoji: "🫧",
    name: "Mere Pearls",
    max: 14,
    image: "/stickers/collectibles/moonmere/moon-pearls.png",
  },
  "moon-lanterns": {
    emoji: "🏮",
    name: "Dock Lanterns",
    max: 12,
    image: "/stickers/collectibles/moonmere/moon-lanterns.png",
  },
  "moon-lilies": {
    emoji: "🪷",
    name: "Night Lilies",
    max: 18,
    image: "/stickers/collectibles/moonmere/moon-lilies.png",
  },
  "moon-dreams": {
    emoji: "💭",
    name: "Dream Notes",
    max: 22,
    image: "/stickers/collectibles/moonmere/moon-dreams.png",
  },
  "moon-dust": {
    emoji: "🌟",
    name: "Fairy Dust",
    max: 15,
    image: "/stickers/collectibles/moonmere/moon-dust.png",
  },
  "bramble-fox-tails": {
    emoji: "🦊",
    name: "Fox Tails",
    max: 16,
    image: "/stickers/collectibles/bramblewood/bramble-fox-tails.png",
  },
  "bramble-maple": {
    emoji: "🍁",
    name: "Maple Leaves",
    max: 28,
    image: "/stickers/collectibles/bramblewood/bramble-maple.png",
  },
  "bramble-pumpkins": {
    emoji: "🎃",
    name: "Pumpkins",
    max: 22,
    image: "/stickers/collectibles/bramblewood/bramble-pumpkins.png",
  },
  "bramble-mushrooms": {
    emoji: "🍄",
    name: "Spotted Mushrooms",
    max: 20,
    image: "/stickers/collectibles/bramblewood/bramble-mushrooms.png",
  },
  "bramble-candles": {
    emoji: "🕯️",
    name: "Hello Fall Candles",
    max: 14,
    image: "/stickers/collectibles/bramblewood/bramble-candles.png",
  },
  "bramble-compasses": {
    emoji: "🧭",
    name: "Wonder Compasses",
    max: 12,
    image: "/stickers/collectibles/bramblewood/bramble-compasses.png",
  },
  "bramble-monarchs": {
    emoji: "🦋",
    name: "Monarch Wings",
    max: 18,
    image: "/stickers/collectibles/bramblewood/bramble-monarchs.png",
  },
  "bramble-pinecones": {
    emoji: "🌲",
    name: "Pinecones",
    max: 24,
    image: "/stickers/collectibles/bramblewood/bramble-pinecones.png",
  },
  "hearth-teacups": {
    emoji: "🍵",
    name: "Teacups",
    max: 18,
    image: "/stickers/collectibles/hearthwick/hearth-teacups.png",
  },
  "hearth-blankets": {
    emoji: "🧶",
    name: "Knit Blankets",
    max: 14,
    image: "/stickers/collectibles/hearthwick/hearth-blankets.png",
  },
  "hearth-muffins": {
    emoji: "🧁",
    name: "Hearth Muffins",
    max: 20,
    image: "/stickers/collectibles/hearthwick/hearth-muffins.png",
  },
  "hearth-recipes": {
    emoji: "📝",
    name: "Recipes",
    max: 22,
    image: "/stickers/collectibles/hearthwick/hearth-recipes.png",
  },
  "hearth-cinnamon-rolls": {
    emoji: "🧁",
    name: "Cinnamon Rolls",
    max: 16,
    image: "/stickers/collectibles/hearthwick/hearth-cinnamon-rolls.png",
  },
  "hearth-embers": {
    emoji: "🔥",
    name: "Hearth Embers",
    max: 24,
    image: "/stickers/collectibles/hearthwick/hearth-embers.png",
  },
  "hearth-kettles": {
    emoji: "🫖",
    name: "Leaf Teapots",
    max: 12,
    image: "/stickers/collectibles/hearthwick/hearth-kettles.png",
  },
  "hearth-letters": {
    emoji: "💌",
    name: "Fireside Notes",
    max: 25,
    image: "/stickers/collectibles/hearthwick/hearth-letters.png",
  },
};

const FOREST_COLLECTIBLES: CollectibleKind[] = [
  "mushrooms",
  "leaves",
  "feathers",
  "lost-pages",
  "butterflies",
  "moonstones",
  "acorns",
];

const CLOVER_COLLECTIBLES: CollectibleKind[] = [
  "clover-butterflies",
  "clover-bunnies",
  "clover-lotus",
  "clover-ribbon",
  "clover-cherries",
  "clover-honey",
  "clover-blossoms",
  "clover-hearts",
];

const MOON_COLLECTIBLES: CollectibleKind[] = [
  "moon-shards",
  "moon-moths",
  "moon-starlight",
  "moon-pearls",
  "moon-lanterns",
  "moon-lilies",
  "moon-dreams",
  "moon-dust",
];

const BRAMBLE_COLLECTIBLES: CollectibleKind[] = [
  "bramble-fox-tails",
  "bramble-maple",
  "bramble-pumpkins",
  "bramble-mushrooms",
  "bramble-candles",
  "bramble-compasses",
  "bramble-monarchs",
  "bramble-pinecones",
];


const HEARTH_COLLECTIBLES: CollectibleKind[] = [
  "hearth-teacups",
  "hearth-blankets",
  "hearth-muffins",
  "hearth-recipes",
  "hearth-cinnamon-rolls",
  "hearth-embers",
  "hearth-kettles",
  "hearth-letters",
];

/** Which collectibles appear for each village. */
export const VILLAGE_COLLECTIBLES: Record<VillageId, CollectibleKind[]> = {
  mosshollow: FOREST_COLLECTIBLES,
  clovermeadow: CLOVER_COLLECTIBLES,
  moonmere: MOON_COLLECTIBLES,
  bramblewood: BRAMBLE_COLLECTIBLES,
  hearthwick: HEARTH_COLLECTIBLES,
};

export function collectiblesForVillage(
  villageId: string | null | undefined
): CollectibleKind[] {
  if (villageId && villageId in VILLAGE_COLLECTIBLES) {
    return VILLAGE_COLLECTIBLES[villageId as VillageId];
  }
  return FOREST_COLLECTIBLES;
}

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
  const base = {} as Record<CollectibleKind, number>;
  for (const key of Object.keys(COLLECTIBLE_META) as CollectibleKind[]) {
    base[key] = 0;
  }
  return base;
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
