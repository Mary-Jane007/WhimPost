import type { GardenSeason } from "@/lib/gardenContent";
import type { BenchItem, BenchItemKind } from "@/lib/meetingBench";
import type { VillageId } from "@/lib/villages";
import { VILLAGE_MAP } from "@/lib/villages";

/** Presentation types for interactive bench objects. */
export type MeetingBenchEntryType =
  | "announcement"
  | "activity"
  | "event"
  | "question"
  | "poll"
  | "feature"
  | "community"
  | "journal"
  | "discovery";

export type BenchObjectId =
  | "paper"
  | "basket"
  | "bell"
  | "jar"
  | "book"
  | "package"
  | "sign"
  | "bottle"
  | "lantern"
  | "flower"
  | "sparkle";

export type BenchObjectPlacement =
  | "seat-left"
  | "seat-mid"
  | "seat-right"
  | "ground-left"
  | "ground-right"
  | "under"
  | "air-left"
  | "air-right"
  | "pin-tl"
  | "pin-tr"
  | "pin-ml"
  | "pin-mr"
  | "pin-bl"
  | "pin-br";

export type VillageBenchTheme = {
  villageId: VillageId;
  kicker: string;
  headline: string;
  subtitle: string;
  sceneLabel: string;
  benchLabel: string;
  boardLabel: string;
  /** Realistic ambient stickers pinned around the gathering board. */
  ambient: string[];
  objects: Partial<Record<MeetingBenchEntryType, BenchObjectId>>;
  /** Optional per-village sticker overrides for object types. */
  objectStickers?: Partial<Record<BenchObjectId, string>>;
};

export const VILLAGE_BENCH_THEMES: Record<VillageId, VillageBenchTheme> = {
  bramblewood: {
    villageId: "bramblewood",
    kicker: "Shared clearing · every village",
    headline: "The Meeting Bench",
    subtitle: "What's rustling in the woods?",
    sceneLabel: "A forest gathering board above a rustic wooden bench",
    benchLabel: "Forest bench",
    boardLabel: "Bramblewood notice board",
    ambient: [
      "/stickers/villages/bramblewood/fox-face.png",
      "/stickers/villages/bramblewood/maple-branch.png",
      "/stickers/villages/bramblewood/pack/mushroom.png",
      "/stickers/villages/bramblewood/autumn-leaves.png",
    ],
    objects: {
      announcement: "paper",
      activity: "basket",
      event: "bell",
      question: "jar",
      poll: "jar",
      feature: "package",
      community: "sign",
      journal: "book",
      discovery: "sparkle",
    },
    objectStickers: {
      bell: "/stickers/villages/bramblewood/candle-jar.png",
      book: "/stickers/villages/bramblewood/book-leaf.png",
      sparkle: "/stickers/villages/bramblewood/compass.png",
    },
  },
  mosshollow: {
    villageId: "mosshollow",
    kicker: "Shared reading nook · every village",
    headline: "The Meeting Bench",
    subtitle: "Gather around — there's something to discuss.",
    sceneLabel: "A mossy reading board beside a woodland bench",
    benchLabel: "Mossy bench",
    boardLabel: "Mosshollow reading board",
    ambient: [
      "/stickers/villages/mosshollow/pack/books-stack.png",
      "/stickers/villages/mosshollow/pack/ink-bottle.png",
      "/stickers/villages/mosshollow/pack/moth.png",
      "/stickers/villages/mosshollow/pack/lantern.png",
    ],
    objects: {
      announcement: "paper",
      activity: "basket",
      event: "lantern",
      question: "jar",
      poll: "jar",
      feature: "package",
      community: "sign",
      journal: "book",
      discovery: "sparkle",
    },
    objectStickers: {
      paper: "/stickers/villages/mosshollow/pack/letters-bundle.png",
      book: "/stickers/villages/mosshollow/pack/books-stack.png",
      sparkle: "/stickers/villages/mosshollow/pack/pocket-watch.png",
    },
  },
  hearthwick: {
    villageId: "hearthwick",
    kicker: "Shared cottage porch · every village",
    headline: "The Meeting Bench",
    subtitle: "Come sit a while.",
    sceneLabel: "A cozy cottage gathering board by the porch bench",
    benchLabel: "Cottage bench",
    boardLabel: "Hearthwick porch board",
    ambient: [
      "/stickers/villages/hearthwick/hedgehog.png",
      "/stickers/villages/hearthwick/lavender-bouquet.png",
      "/stickers/villages/hearthwick/herbal-jar.png",
      "/stickers/villages/hearthwick/cinnamon-sticks.png",
    ],
    objects: {
      announcement: "paper",
      activity: "basket",
      event: "bell",
      question: "jar",
      poll: "jar",
      feature: "package",
      community: "sign",
      journal: "book",
      discovery: "sparkle",
    },
    objectStickers: {
      jar: "/stickers/villages/hearthwick/herbal-jar.png",
      book: "/stickers/villages/hearthwick/vintage-books.png",
      package: "/stickers/villages/hearthwick/wooden-crate.png",
      bottle: "/stickers/villages/hearthwick/potion-bottles.png",
      flower: "/stickers/villages/hearthwick/pink-flower.png",
    },
  },
  clovermeadow: {
    villageId: "clovermeadow",
    kicker: "Shared meadow · every village",
    headline: "The Meeting Bench",
    subtitle: "Something new is blooming.",
    sceneLabel: "A meadow gathering board among wildflowers",
    benchLabel: "Meadow bench",
    boardLabel: "Clovermeadow garden board",
    ambient: [
      "/stickers/villages/clovermeadow/butterfly-pink.png",
      "/stickers/villages/clovermeadow/flowers-sage.png",
      "/stickers/villages/clovermeadow/lily-pink.png",
      "/stickers/villages/clovermeadow/cherries-gingham.png",
    ],
    objects: {
      announcement: "paper",
      activity: "flower",
      event: "bell",
      question: "jar",
      poll: "jar",
      feature: "package",
      community: "basket",
      journal: "book",
      discovery: "sparkle",
    },
    objectStickers: {
      flower: "/stickers/villages/clovermeadow/lily-pink.png",
      book: "/stickers/villages/clovermeadow/books-stack.png",
      basket: "/stickers/picnic-basket.png",
    },
  },
  moonmere: {
    villageId: "moonmere",
    kicker: "Shared lakeside · every village",
    headline: "The Meeting Bench",
    subtitle: "Something has washed ashore…",
    sceneLabel: "A lakeside gathering board beneath the moon",
    benchLabel: "Lakeside bench",
    boardLabel: "Moonmere shore board",
    ambient: [
      "/stickers/villages/moonmere/luna-moth.png",
      "/stickers/villages/moonmere/moon-crescent.png",
      "/stickers/villages/moonmere/lantern-star.png",
      "/stickers/villages/moonmere/moth-sage.png",
    ],
    objects: {
      announcement: "bottle",
      activity: "basket",
      event: "lantern",
      question: "jar",
      poll: "jar",
      feature: "package",
      community: "sign",
      journal: "book",
      discovery: "sparkle",
    },
    objectStickers: {
      lantern: "/stickers/villages/moonmere/lantern-star.png",
      paper: "/stickers/villages/moonmere/library-card.png",
      sign: "/stickers/villages/moonmere/ticket-observatory.png",
      sparkle: "/stickers/villages/moonmere/fairy-starry.png",
    },
  },
};

/** Default realistic sticker art for each interactive object. */
export const OBJECT_META: Record<
  BenchObjectId,
  { src: string; label: string; openVerb: string }
> = {
  paper: {
    src: "/stickers/villages/mosshollow/pack/letters-bundle.png",
    label: "Folded note",
    openVerb: "Unfold",
  },
  basket: {
    src: "/stickers/picnic-basket.png",
    label: "Basket",
    openVerb: "Open",
  },
  bell: {
    src: "/stickers/candle-jar.png",
    label: "Gathering bell",
    openVerb: "Ring",
  },
  jar: {
    src: "/stickers/jam-jar.png",
    label: "Question jar",
    openVerb: "Open",
  },
  book: {
    src: "/stickers/villages/hearthwick/vintage-books.png",
    label: "Bench book",
    openVerb: "Open",
  },
  package: {
    src: "/stickers/villages/hearthwick/wooden-crate.png",
    label: "Small parcel",
    openVerb: "Unwrap",
  },
  sign: {
    src: "/stickers/villages/mosshollow/pack/travel-tag.png",
    label: "Wooden sign",
    openVerb: "Read",
  },
  bottle: {
    src: "/stickers/villages/hearthwick/potion-bottles.png",
    label: "Glass bottle",
    openVerb: "Uncork",
  },
  lantern: {
    src: "/stickers/villages/mosshollow/pack/lantern.png",
    label: "Lantern",
    openVerb: "Lift",
  },
  flower: {
    src: "/stickers/sunflower.png",
    label: "Blooming note",
    openVerb: "Look closer",
  },
  sparkle: {
    src: "/stickers/skeleton-key.png",
    label: "Hidden find",
    openVerb: "Discover",
  },
};

export const SEASON_AMBIENT: Record<GardenSeason, string[]> = {
  spring: [
    "/stickers/narcissus.png",
    "/stickers/dragonfly.png",
  ],
  summer: [
    "/stickers/sunflower.png",
    "/stickers/butterfly-green.png",
  ],
  autumn: [
    "/stickers/pinecone.png",
    "/stickers/mushroom-brown.png",
  ],
  winter: [
    "/stickers/moon-crescent.png",
    "/stickers/candle-jar.png",
  ],
};

const KIND_TO_ENTRY: Record<BenchItemKind, MeetingBenchEntryType> = {
  notice: "announcement",
  gathering: "event",
  seasonal: "activity",
  chronicle: "journal",
  community_event: "community",
};

const BOARD_PLACEMENTS: BenchObjectPlacement[] = [
  "pin-tl",
  "pin-tr",
  "pin-ml",
  "pin-mr",
  "pin-bl",
  "pin-br",
  "seat-mid",
];

export function resolveEntryType(item: BenchItem): MeetingBenchEntryType {
  const activity = (item.activityType || "").toLowerCase();
  const metaType =
    typeof item.meta.entryType === "string"
      ? item.meta.entryType.toLowerCase()
      : "";
  const flagged =
    item.meta.discovery === true ||
    item.meta.isDiscovery === true ||
    activity === "discovery" ||
    metaType === "discovery"
      ? "discovery"
      : activity === "poll" || metaType === "poll"
        ? "poll"
        : activity === "question" || metaType === "question"
          ? "question"
          : activity === "feature" || metaType === "feature"
            ? "feature"
            : null;
  return flagged || KIND_TO_ENTRY[item.kind];
}

export function objectForEntry(
  villageId: VillageId,
  entryType: MeetingBenchEntryType
): BenchObjectId {
  const theme = VILLAGE_BENCH_THEMES[villageId] || VILLAGE_BENCH_THEMES.bramblewood;
  return theme.objects[entryType] || "paper";
}

export function stickerForObject(
  villageId: VillageId,
  objectId: BenchObjectId
): string {
  const theme = VILLAGE_BENCH_THEMES[villageId] || VILLAGE_BENCH_THEMES.bramblewood;
  return theme.objectStickers?.[objectId] || OBJECT_META[objectId].src;
}

export type SceneObject = {
  id: string;
  item: BenchItem;
  entryType: MeetingBenchEntryType;
  objectId: BenchObjectId;
  src: string;
  label: string;
  openVerb: string;
  placement: BenchObjectPlacement;
  featured: boolean;
  rotation: number;
};

/** Pick the most interesting items to pin as physical objects on the board. */
export function buildSceneObjects(
  items: BenchItem[],
  villageId: VillageId,
  limit = 7
): SceneObject[] {
  const ranked = [...items].sort((a, b) => {
    const score = (it: BenchItem) =>
      (it.pinned ? 40 : 0) +
      (resolveEntryType(it) === "discovery" ? 30 : 0) +
      (it.status === "active" || it.status === "upcoming" ? 20 : 0) +
      (it.kind === "gathering" ? 10 : 0) -
      it.sortOrder;
    return score(b) - score(a);
  });

  const seenTypes = new Set<MeetingBenchEntryType>();
  const picked: BenchItem[] = [];
  for (const item of ranked) {
    const type = resolveEntryType(item);
    if (seenTypes.has(type) && picked.length >= 3) continue;
    seenTypes.add(type);
    picked.push(item);
    if (picked.length >= limit) break;
  }

  return picked.map((item, index) => {
    const entryType = resolveEntryType(item);
    const objectId = objectForEntry(villageId, entryType);
    const meta = OBJECT_META[objectId];
    const rotations = [-8, 5, -4, 7, -6, 3, -2];
    return {
      id: item.id,
      item,
      entryType,
      objectId,
      src: stickerForObject(villageId, objectId),
      label: `${meta.label}: ${item.title}`,
      openVerb: meta.openVerb,
      placement:
        entryType === "discovery"
          ? "under"
          : BOARD_PLACEMENTS[index % BOARD_PLACEMENTS.length],
      featured: Boolean(item.pinned) || index === 0,
      rotation: rotations[index % rotations.length],
    };
  });
}

export function flattenBoardItems(board: {
  notices: BenchItem[];
  gatherings: BenchItem[];
  seasonal: BenchItem[];
  chronicles: BenchItem[];
  communityEvents: BenchItem[];
}): BenchItem[] {
  return [
    ...board.notices,
    ...board.gatherings,
    ...board.seasonal,
    ...board.chronicles,
    ...board.communityEvents,
  ];
}

export function journalEntries(items: BenchItem[]) {
  return [...items]
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    )
    .slice(0, 12)
    .map((item) => ({
      item,
      entryType: resolveEntryType(item),
      whenLabel: relativeWhen(item.updatedAt || item.createdAt),
      ageDays: ageInDays(item.updatedAt || item.createdAt),
    }));
}

function ageInDays(iso: string) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 999;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

export function relativeWhen(iso: string) {
  const days = ageInDays(iso);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 31) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatWhen(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

export function villageNames(villages: VillageId[] | "all") {
  if (villages === "all") return "All villages";
  return villages.map((id) => VILLAGE_MAP[id]?.name || id).join(" · ");
}

export function getBenchTheme(villageId: VillageId | null | undefined) {
  if (villageId && villageId in VILLAGE_BENCH_THEMES) {
    return VILLAGE_BENCH_THEMES[villageId];
  }
  return VILLAGE_BENCH_THEMES.bramblewood;
}

export function findQuestionJarItem(items: BenchItem[]): BenchItem | null {
  return (
    items.find((item) => {
      const type = resolveEntryType(item);
      return (
        (type === "poll" || type === "question") &&
        item.status !== "finished" &&
        item.status !== "archived"
      );
    }) || null
  );
}

export function pollOptionsFromItem(item: BenchItem): string[] {
  const raw = item.meta.pollOptions;
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  }
  const lines = item.body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const bullets = lines
    .map((l) => l.replace(/^[-*○•]\s+/, "").trim())
    .filter((l, i, arr) => arr.indexOf(l) === i && l.length < 80);
  if (bullets.length >= 2 && bullets.length <= 8) return bullets;
  return [
    "More village activities",
    "More customization",
    "More letter features",
    "More stories",
    "Something completely new",
  ];
}

export function findDiscoveryItem(items: BenchItem[]): BenchItem | null {
  return (
    items.find((item) => resolveEntryType(item) === "discovery") ||
    items.find((item) => item.pinned && item.kind === "chronicle") ||
    null
  );
}

export const DEFAULT_QUESTION =
  "What would you like to see next in WhimPost?";

export const DEFAULT_POLL_OPTIONS = [
  "More village activities",
  "More customization",
  "More letter features",
  "More stories",
  "Something completely new",
];

/** Realistic jar sticker for the question-jar panel. */
export function questionJarSticker(villageId: VillageId | null | undefined) {
  if (villageId === "hearthwick") {
    return "/stickers/villages/hearthwick/herbal-jar.png";
  }
  if (villageId === "bramblewood") {
    return "/stickers/honey-jar.png";
  }
  if (villageId === "clovermeadow") {
    return "/stickers/jam-jar.png";
  }
  if (villageId === "moonmere") {
    return "/stickers/honey-jar.png";
  }
  return "/stickers/jam-jar.png";
}
