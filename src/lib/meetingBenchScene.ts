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
  | "air-right";

export type VillageBenchTheme = {
  villageId: VillageId;
  kicker: string;
  headline: string;
  subtitle: string;
  sceneLabel: string;
  benchLabel: string;
  ambient: string[];
  objects: Partial<Record<MeetingBenchEntryType, BenchObjectId>>;
};

export const VILLAGE_BENCH_THEMES: Record<VillageId, VillageBenchTheme> = {
  bramblewood: {
    villageId: "bramblewood",
    kicker: "Shared clearing · every village",
    headline: "The Meeting Bench",
    subtitle: "What's rustling in the woods?",
    sceneLabel: "A rustic wooden bench in a forest clearing",
    benchLabel: "Forest bench",
    ambient: ["🍄", "🍂", "🌿", "🌰"],
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
  },
  mosshollow: {
    villageId: "mosshollow",
    kicker: "Shared reading nook · every village",
    headline: "The Meeting Bench",
    subtitle: "Gather around — there's something to discuss.",
    sceneLabel: "A moss-covered bench near a woodland reading spot",
    benchLabel: "Mossy bench",
    ambient: ["📚", "🪶", "🕯️", "🍃"],
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
  },
  hearthwick: {
    villageId: "hearthwick",
    kicker: "Shared cottage porch · every village",
    headline: "The Meeting Bench",
    subtitle: "Come sit a while.",
    sceneLabel: "A cozy cottage bench with warm details nearby",
    benchLabel: "Cottage bench",
    ambient: ["🫖", "🧶", "🕯️", "🍪"],
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
  },
  clovermeadow: {
    villageId: "clovermeadow",
    kicker: "Shared meadow · every village",
    headline: "The Meeting Bench",
    subtitle: "Something new is blooming.",
    sceneLabel: "A meadow bench among wildflowers",
    benchLabel: "Meadow bench",
    ambient: ["🌼", "🐝", "🌿", "🌱"],
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
  },
  moonmere: {
    villageId: "moonmere",
    kicker: "Shared lakeside · every village",
    headline: "The Meeting Bench",
    subtitle: "Something has washed ashore…",
    sceneLabel: "A quiet lakeside bench beneath the moon",
    benchLabel: "Lakeside bench",
    ambient: ["🌙", "✨", "🌊", "🦋"],
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
  },
};

export const OBJECT_META: Record<
  BenchObjectId,
  { emoji: string; label: string; openVerb: string }
> = {
  paper: { emoji: "📜", label: "Folded note", openVerb: "Unfold" },
  basket: { emoji: "🧺", label: "Basket", openVerb: "Open" },
  bell: { emoji: "🔔", label: "Bell", openVerb: "Ring" },
  jar: { emoji: "🫙", label: "Question jar", openVerb: "Open" },
  book: { emoji: "📖", label: "Bench book", openVerb: "Open" },
  package: { emoji: "📦", label: "Small parcel", openVerb: "Unwrap" },
  sign: { emoji: "🪧", label: "Wooden sign", openVerb: "Read" },
  bottle: { emoji: "🫙", label: "Glass bottle", openVerb: "Uncork" },
  lantern: { emoji: "🏮", label: "Lantern", openVerb: "Lift" },
  flower: { emoji: "🌼", label: "Blooming note", openVerb: "Look closer" },
  sparkle: { emoji: "✨", label: "Hidden spark", openVerb: "Discover" },
};

export const SEASON_AMBIENT: Record<GardenSeason, string[]> = {
  spring: ["🌸", "🌱", "💧"],
  summer: ["☀️", "🦋", "🍑"],
  autumn: ["🍂", "🍄", "🌰"],
  winter: ["❄️", "🧣", "⭐"],
};

const KIND_TO_ENTRY: Record<BenchItemKind, MeetingBenchEntryType> = {
  notice: "announcement",
  gathering: "event",
  seasonal: "activity",
  chronicle: "journal",
  community_event: "community",
};

const PLACEMENTS: BenchObjectPlacement[] = [
  "seat-left",
  "seat-mid",
  "seat-right",
  "ground-left",
  "ground-right",
  "air-left",
  "air-right",
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

export type SceneObject = {
  id: string;
  item: BenchItem;
  entryType: MeetingBenchEntryType;
  objectId: BenchObjectId;
  emoji: string;
  label: string;
  openVerb: string;
  placement: BenchObjectPlacement;
  featured: boolean;
};

/** Pick the most interesting items to place as physical objects on the bench. */
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
    return {
      id: item.id,
      item,
      entryType,
      objectId,
      emoji: meta.emoji,
      label: `${meta.label}: ${item.title}`,
      openVerb: meta.openVerb,
      placement:
        entryType === "discovery"
          ? "under"
          : PLACEMENTS[index % PLACEMENTS.length],
      featured: Boolean(item.pinned) || index === 0,
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
  // Fallback: lines after a blank line in the body, or lines starting with - / ○
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
