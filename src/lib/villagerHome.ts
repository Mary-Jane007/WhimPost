import {
  COLLECTIBLE_META,
  RANK_LADDER,
  VILLAGE_COLLECTIBLES,
  type CollectibleKind,
  type VillageId,
} from "@/lib/villages";

/** Shared Personal Cottage structure; each village supplies its own soul. */

export type VillagerHomeTheme = {
  id: VillageId;
  label: string;
  emoji: string;
  mascot: string;
  mascotImage: string;
  tagline: string;
  welcome: string;
  cottageMessage: string;
  progressLabel: string;
  collectablesLabel: string;
  journeyLabel: string;
  goalLabel: string;
  quote: string;
  quoteAuthor: string;
  firstGift: { emoji: string; name: string };
  titles: string[];
  accent: string;
  soft: string;
  deep: string;
  cream: string;
  ink: string;
  gold: string;
  heroImage: string;
  heroStickers: string[];
  goals: Array<{
    id: string;
    title: string;
    description: string;
    emoji: string;
    target: number;
    metric: "letters" | "collectibles" | "activities" | "tv" | "reputation";
  }>;
};

export const VILLAGER_HOME_THEMES: Record<VillageId, VillagerHomeTheme> = {
  bramblewood: {
    id: "bramblewood",
    heroImage: "/cottages/heroes/bramblewood.png",
    label: "Bramblewood",
    emoji: "🦊",
    mascot: "Fox",
    mascotImage: "/villages/bramblewood/mascot.png",
    tagline: "Woodland adventure · exploration · craft",
    welcome: "The forest has made room for one more.",
    cottageMessage: "The forest always has something new to discover.",
    progressLabel: "Your Trail",
    collectablesLabel: "Things You've Found",
    journeyLabel: "My Journey",
    goalLabel: "Current Goal",
    quote: "The forest always has something new to show you.",
    quoteAuthor: "Bramblewood Fox",
    firstGift: { emoji: "🕯️", name: "Wooden Lantern" },
    titles: [
      "Woodland Wanderer",
      "Forest Explorer",
      "Trail Finder",
      "Campfire Scout",
      "Woodland Guide",
      "Forest Elder",
      "Forest Guardian",
    ],
    accent: "#6b8f4e",
    soft: "#d9e4c8",
    deep: "#2f3d28",
    cream: "#f3ead8",
    ink: "#2a241c",
    gold: "#c4a574",
    heroStickers: [
      "/stickers/villages/bramblewood/fox-sitting.png",
      "/stickers/villages/bramblewood/misty-pines.png",
      "/stickers/villages/bramblewood/mushroom.png",
      "/stickers/villages/bramblewood/compass.png",
      "/stickers/villages/bramblewood/maple-branch.png",
    ],
    goals: [
      {
        id: "bw-trail",
        title: "Forest Explorer",
        description: "Discover woodland keepsakes on the trail.",
        emoji: "🦊",
        target: 5,
        metric: "collectibles",
      },
      {
        id: "bw-letters",
        title: "Field Notes",
        description: "Send letters from the woodland path.",
        emoji: "✉️",
        target: 5,
        metric: "letters",
      },
    ],
  },
  clovermeadow: {
    id: "clovermeadow",
    heroImage: "/cottages/heroes/clovermeadow.png",
    label: "Clovermeadow",
    emoji: "🌼",
    mascot: "Bee",
    mascotImage: "/villages/clovermeadow/mascot.png",
    tagline: "Gardens · flowers · growing things",
    welcome: "There's always room for another flower in the meadow.",
    cottageMessage: "Small seeds can grow into wonderful things.",
    progressLabel: "Your Growth",
    collectablesLabel: "Things You've Grown & Found",
    journeyLabel: "My Journey",
    goalLabel: "Current Goal",
    quote: "Small seeds grow into wonderful things.",
    quoteAuthor: "Clovermeadow Bee",
    firstGift: { emoji: "🌼", name: "Little Flower Pot" },
    titles: [
      "Garden Keeper",
      "Meadow Friend",
      "Flower Finder",
      "Nature Watcher",
      "Garden Guide",
      "Meadow Elder",
      "Bloom Guardian",
    ],
    accent: "#7aa35a",
    soft: "#e8f0d8",
    deep: "#3d5230",
    cream: "#faf6ea",
    ink: "#2f2a22",
    gold: "#d4b45a",
    heroStickers: [
      "/stickers/villages/clovermeadow/butterfly-green.png",
      "/stickers/villages/clovermeadow/flowers-sage.png",
      "/stickers/villages/clovermeadow/apple-blush.png",
      "/stickers/villages/clovermeadow/bird-pink.png",
      "/stickers/villages/clovermeadow/butterfly-cream.png",
    ],
    goals: [
      {
        id: "cm-garden",
        title: "Garden Keeper",
        description: "Discover nature collectibles in the meadow.",
        emoji: "🌼",
        target: 5,
        metric: "collectibles",
      },
      {
        id: "cm-letters",
        title: "Pressed-Flower Letters",
        description: "Send letters scented with meadow kindness.",
        emoji: "✉️",
        target: 5,
        metric: "letters",
      },
    ],
  },
  mosshollow: {
    id: "mosshollow",
    heroImage: "/cottages/heroes/mosshollow.png",
    label: "Mosshollow",
    emoji: "🦉",
    mascot: "Owl",
    mascotImage: "/villages/mosshollow/mascot.png",
    tagline: "Books · mysteries · quiet discovery",
    welcome: "A new story has arrived at Mosshollow.",
    cottageMessage: "Every book holds a different world.",
    progressLabel: "Your Discoveries",
    collectablesLabel: "Things You've Discovered",
    journeyLabel: "My Journey",
    goalLabel: "Current Goal",
    quote: "Every book holds a different world.",
    quoteAuthor: "Mosshollow Owl",
    firstGift: { emoji: "📖", name: "First Book" },
    titles: [
      "Bookworm",
      "Curious Scholar",
      "Mystery Solver",
      "Archive Keeper",
      "Lore Finder",
      "Library Elder",
      "Story Guardian",
    ],
    accent: "#5b6b8a",
    soft: "#d8dde8",
    deep: "#1e2433",
    cream: "#efe8d8",
    ink: "#221e18",
    gold: "#c9a96a",
    heroStickers: [
      "/stickers/villages/mosshollow/pack/books-stack.png",
      "/stickers/villages/mosshollow/pack/lantern.png",
      "/stickers/villages/mosshollow/pack/globe.png",
      "/stickers/villages/mosshollow/pack/ink-bottle.png",
      "/stickers/villages/mosshollow/pack/moth.png",
    ],
    goals: [
      {
        id: "mh-lore",
        title: "Curious Scholar",
        description: "Collect manuscript-worthy keepsakes.",
        emoji: "🦉",
        target: 5,
        metric: "collectibles",
      },
      {
        id: "mh-letters",
        title: "Ink & Enquiry",
        description: "Exchange scholarly letters.",
        emoji: "✉️",
        target: 5,
        metric: "letters",
      },
    ],
  },
  hearthwick: {
    id: "hearthwick",
    heroImage: "/cottages/heroes/hearthwick.png",
    label: "Hearthwick",
    emoji: "🦔",
    mascot: "Hedgehog",
    mascotImage: "/villages/hearthwick/mascot.png",
    tagline: "Warmth · baking · handmade friendship",
    welcome: "Come in. The kettle is already on.",
    cottageMessage: "Every stranger is welcomed home.",
    progressLabel: "Your Story",
    collectablesLabel: "Things You've Collected",
    journeyLabel: "My Journey",
    goalLabel: "Current Goal",
    quote: "Good things are better when shared.",
    quoteAuthor: "Heartwick Hedgehog",
    firstGift: { emoji: "🫖", name: "Teacup" },
    titles: [
      "Home Keeper",
      "Master Baker",
      "Craft Friend",
      "Fireside Host",
      "Hearthwick Helper",
      "Hearth Elder",
      "Hearth Guardian",
    ],
    accent: "#b86b4a",
    soft: "#f0ddd0",
    deep: "#4a2f24",
    cream: "#faf3e8",
    ink: "#2c221c",
    gold: "#d4a574",
    heroStickers: [
      "/stickers/villages/hearthwick/hedgehog.png",
      "/stickers/villages/hearthwick/cinnamon-roll.png",
      "/stickers/villages/hearthwick/lavender-bouquet.png",
      "/stickers/villages/hearthwick/herbal-jar.png",
      "/stickers/villages/hearthwick/vintage-books.png",
    ],
    goals: [
      {
        id: "hw-hearth",
        title: "Fireside Host",
        description: "Gather cozy keepsakes for the mantel.",
        emoji: "🦔",
        target: 5,
        metric: "collectibles",
      },
      {
        id: "hw-letters",
        title: "Warm Notes",
        description: "Send welcoming letters to friends.",
        emoji: "✉️",
        target: 5,
        metric: "letters",
      },
    ],
  },
  moonmere: {
    id: "moonmere",
    heroImage: "/cottages/heroes/moonmere.png",
    label: "Moonmere",
    emoji: "🌙",
    mascot: "Luna Moth",
    mascotImage: "/villages/moonmere/mascot.png",
    tagline: "Moonlight · water · stars · dreams",
    welcome: "The lake has been waiting for you.",
    cottageMessage: "The night always has another story to tell.",
    progressLabel: "Your Night Journey",
    collectablesLabel: "Treasures From the Night",
    journeyLabel: "My Journey",
    goalLabel: "Current Goal",
    quote: "The night sky reminds us how small and special we are.",
    quoteAuthor: "Moonmere Moth",
    firstGift: { emoji: "🌙", name: "Little Lantern" },
    titles: [
      "Night Dreamer",
      "Stargazer",
      "Moon Watcher",
      "Lake Explorer",
      "Night Guide",
      "Moon Elder",
      "Star Guardian",
    ],
    accent: "#6a7aab",
    soft: "#d4d8ea",
    deep: "#161b2a",
    cream: "#ebe4d4",
    ink: "#1c1824",
    gold: "#c4a574",
    heroStickers: [
      "/stickers/villages/moonmere/luna-moth.png",
      "/stickers/villages/moonmere/moon-crescent.png",
      "/stickers/villages/moonmere/starfield.png",
      "/stickers/villages/moonmere/lantern-star.png",
      "/stickers/villages/moonmere/fairy-moon.png",
    ],
    goals: [
      {
        id: "mm-stars",
        title: "Stargazer",
        description: "Discover night treasures by the lake.",
        emoji: "🌙",
        target: 5,
        metric: "collectibles",
      },
      {
        id: "mm-letters",
        title: "Moonlit Letters",
        description: "Send letters under the night sky.",
        emoji: "✉️",
        target: 5,
        metric: "letters",
      },
    ],
  },
};

export function getVillagerHomeTheme(
  villageId: VillageId | null | undefined
): VillagerHomeTheme {
  if (villageId && villageId in VILLAGER_HOME_THEMES) {
    return VILLAGER_HOME_THEMES[villageId];
  }
  return VILLAGER_HOME_THEMES.bramblewood;
}

export function villagerTitleFor(
  theme: VillagerHomeTheme,
  reputation: number
): string {
  let idx = 0;
  for (let i = 0; i < RANK_LADDER.length; i++) {
    if (reputation >= RANK_LADDER[i].minRep) idx = i;
  }
  return theme.titles[idx] || RANK_LADDER[idx]?.label || "Villager";
}

export function villagerLevel(reputation: number) {
  return Math.max(1, Math.floor(Math.max(0, reputation) / 12) + 1);
}

export function villagerXpProgress(reputation: number) {
  const level = villagerLevel(reputation);
  const floor = (level - 1) * 12;
  const next = level * 12;
  const into = Math.max(0, reputation - floor);
  const span = Math.max(1, next - floor);
  return {
    level,
    current: into,
    needed: span,
    remaining: Math.max(0, next - reputation),
    percent: Math.min(100, Math.round((into / span) * 100)),
  };
}

export type JourneyMilestone = {
  id: string;
  emoji: string;
  title: string;
  description: string;
  dateLabel: string;
  done: boolean;
};

export function buildJourneyMilestones(input: {
  theme: VillagerHomeTheme;
  createdAt: string;
  letterCount: number;
  collectibleCount: number;
  reputation: number;
  cottageNamed: boolean;
  memoryCount: number;
}): JourneyMilestone[] {
  const joined = formatSoftDate(input.createdAt);
  return [
    {
      id: "joined",
      emoji: "🌱",
      title: "Joined WhimPost",
      description: `Arrived in ${input.theme.label}.`,
      dateLabel: joined,
      done: true,
    },
    {
      id: "village",
      emoji: input.theme.emoji,
      title: `Joined ${input.theme.label}`,
      description: input.theme.welcome,
      dateLabel: joined,
      done: true,
    },
    {
      id: "cottage",
      emoji: "🏡",
      title: input.cottageNamed ? "Named your cottage" : "Found your cottage",
      description: input.theme.cottageMessage,
      dateLabel: joined,
      done: true,
    },
    {
      id: "first-letter",
      emoji: "✉️",
      title: "Sent first letter",
      description: "A letter left the cottage postbox.",
      dateLabel: input.letterCount > 0 ? "Along the way" : "Waiting",
      done: input.letterCount > 0,
    },
    {
      id: "first-collectible",
      emoji: "🧺",
      title: "First discovery",
      description: "A keepsake found its way home.",
      dateLabel: input.collectibleCount > 0 ? "Along the way" : "Waiting",
      done: input.collectibleCount > 0,
    },
    {
      id: "level-5",
      emoji: "⭐",
      title: "Reached Level 5",
      description: "Settled into village life.",
      dateLabel: villagerLevel(input.reputation) >= 5 ? "Earned" : "Ahead",
      done: villagerLevel(input.reputation) >= 5,
    },
    {
      id: "memory",
      emoji: "💌",
      title: "Pinned a memory",
      description: "A moment kept on the cottage wall.",
      dateLabel: input.memoryCount > 0 ? "Along the way" : "Waiting",
      done: input.memoryCount > 0,
    },
  ];
}

export type VillagerAchievement = {
  id: string;
  emoji: string;
  title: string;
  unlocked: boolean;
};

export function buildVillagerAchievements(input: {
  theme: VillagerHomeTheme;
  letterCount: number;
  collectibleCount: number;
  reputation: number;
  tvWatched: number;
}): VillagerAchievement[] {
  const villageBadge: Record<VillageId, { emoji: string; title: string }> = {
    bramblewood: { emoji: "🦊", title: "Forest Explorer" },
    clovermeadow: { emoji: "🌼", title: "Garden Keeper" },
    mosshollow: { emoji: "🦉", title: "Knowledge Seeker" },
    hearthwick: { emoji: "🦔", title: "Hearth Keeper" },
    moonmere: { emoji: "🌙", title: "Night Watcher" },
  };
  const badge = villageBadge[input.theme.id];
  return [
    {
      id: "village",
      emoji: badge.emoji,
      title: badge.title,
      unlocked: input.reputation >= 10,
    },
    {
      id: "letter-carrier",
      emoji: "✉️",
      title: "Letter Carrier",
      unlocked: input.letterCount >= 3,
    },
    {
      id: "first-discovery",
      emoji: "⭐",
      title: "First Discovery",
      unlocked: input.collectibleCount >= 1,
    },
    {
      id: "wanderer",
      emoji: "🗺️",
      title: "Wanderer",
      unlocked: input.reputation >= 30,
    },
    {
      id: "tv",
      emoji: "📺",
      title: "TV Corner Regular",
      unlocked: input.tvWatched >= 1,
    },
    {
      id: "collector",
      emoji: "🧺",
      title: "Collector",
      unlocked: input.collectibleCount >= 5,
    },
  ];
}

export function collectibleLabel(kind: CollectibleKind) {
  return COLLECTIBLE_META[kind]?.name || kind;
}

export function collectibleEmoji(kind: CollectibleKind) {
  return COLLECTIBLE_META[kind]?.emoji || "✨";
}

export function collectibleImage(kind: CollectibleKind) {
  return COLLECTIBLE_META[kind]?.image;
}

export function showcaseCollectibles(
  villageId: VillageId,
  owned: Record<CollectibleKind, number>,
  limit = 5
): Array<{ kind: CollectibleKind; count: number }> {
  const preferred = VILLAGE_COLLECTIBLES[villageId] || [];
  const out: Array<{ kind: CollectibleKind; count: number }> = [];
  for (const kind of preferred) {
    if ((owned[kind] || 0) > 0) out.push({ kind, count: owned[kind] });
    if (out.length >= limit) return out;
  }
  for (const [kind, count] of Object.entries(owned) as Array<
    [CollectibleKind, number]
  >) {
    if (count <= 0) continue;
    if (out.some((x) => x.kind === kind)) continue;
    out.push({ kind, count });
    if (out.length >= limit) break;
  }
  for (const kind of preferred) {
    if (out.length >= limit) break;
    if (out.some((x) => x.kind === kind)) continue;
    out.push({ kind, count: 0 });
  }
  return out;
}

export function goalProgressValue(
  metric: VillagerHomeTheme["goals"][number]["metric"],
  stats: {
    letterCount: number;
    collectibleCount: number;
    activityCount: number;
    tvCount: number;
    reputation: number;
  }
) {
  switch (metric) {
    case "letters":
      return stats.letterCount;
    case "collectibles":
      return stats.collectibleCount;
    case "activities":
      return stats.activityCount;
    case "tv":
      return stats.tvCount;
    case "reputation":
      return stats.reputation;
    default:
      return 0;
  }
}

function formatSoftDate(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "Once upon a time";
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Once upon a time";
  }
}
