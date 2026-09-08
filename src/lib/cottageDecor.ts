import { RANK_LADDER, type CollectibleKind } from "@/lib/villages";

export type CottageDecorId = string;

export type CottageUnlock =
  | { type: "always" }
  | { type: "rank"; minRep: number; rankLabel: string }
  | { type: "keepsakes"; min: number; label: string };

export interface CottageDecorDef {
  id: CottageDecorId;
  name: string;
  emoji: string;
  lore: string;
  unlock: CottageUnlock;
  x: number;
  y: number;
  size: "sm" | "md" | "lg";
  layer: "floor" | "mid" | "wall" | "ceiling";
}

/** Furniture & trinkets that fill an empty cottage as the villager journeys. */
export const COTTAGE_DECOR: CottageDecorDef[] = [
  {
    id: "welcome-mat",
    name: "Welcome Mat",
    emoji: "🧺",
    lore: "Every cottage starts with a place to wipe muddy boots.",
    unlock: { type: "always" },
    x: 50,
    y: 88,
    size: "md",
    layer: "floor",
  },
  {
    id: "window-drape",
    name: "Sunny Window",
    emoji: "🪟",
    lore: "Soft light for reading and daydreaming.",
    unlock: { type: "always" },
    x: 72,
    y: 28,
    size: "lg",
    layer: "wall",
  },
  {
    id: "potted-fern",
    name: "Windowsill Fern",
    emoji: "🌿",
    lore: "A little green that thrives on kind letters.",
    unlock: { type: "always" },
    x: 78,
    y: 48,
    size: "md",
    layer: "mid",
  },
  {
    id: "woven-rug",
    name: "Woven Rug",
    emoji: "🧶",
    lore: "Warmth underfoot for long reading evenings.",
    unlock: { type: "always" },
    x: 42,
    y: 72,
    size: "lg",
    layer: "floor",
  },
  {
    id: "tea-nook",
    name: "Tea Nook",
    emoji: "🫖",
    lore: "Two cups — one for you, one for a visiting friend.",
    unlock: { type: "always" },
    x: 22,
    y: 58,
    size: "md",
    layer: "mid",
  },
  {
    id: "hearth",
    name: "Cottage Hearth",
    emoji: "🔥",
    lore: "The heart of the room. Stories gather here.",
    unlock: { type: "rank", minRep: 30, rankLabel: "Villager" },
    x: 50,
    y: 42,
    size: "lg",
    layer: "wall",
  },
  {
    id: "bookshelf",
    name: "Crooked Bookshelf",
    emoji: "📚",
    lore: "Pages borrowed, pages returned, pages pressed with flowers.",
    unlock: { type: "always" },
    x: 14,
    y: 38,
    size: "lg",
    layer: "wall",
  },
  {
    id: "candle",
    name: "Beeswax Candle",
    emoji: "🕯",
    lore: "Enough light to finish one more paragraph.",
    unlock: { type: "rank", minRep: 10, rankLabel: "Wanderer" },
    x: 62,
    y: 55,
    size: "sm",
    layer: "mid",
  },
  {
    id: "writing-desk",
    name: "Writing Desk",
    emoji: "🪵",
    lore: "Ink stains welcome.",
    unlock: { type: "rank", minRep: 100, rankLabel: "Letterkeeper" },
    x: 82,
    y: 62,
    size: "lg",
    layer: "mid",
  },
  {
    id: "letter-bundle",
    name: "Bundle of Letters",
    emoji: "💌",
    lore: "Tied with twine — proof that someone wrote back.",
    unlock: { type: "rank", minRep: 100, rankLabel: "Letterkeeper" },
    x: 86,
    y: 52,
    size: "sm",
    layer: "mid",
  },
  {
    id: "wall-mirror",
    name: "Ornate Mirror",
    emoji: "🪞",
    lore: "It reflects whoever you are becoming.",
    unlock: { type: "rank", minRep: 160, rankLabel: "Elder" },
    x: 28,
    y: 30,
    size: "md",
    layer: "wall",
  },
  {
    id: "lantern",
    name: "Porch Lantern",
    emoji: "🏮",
    lore: "Lit for neighbors walking home after dusk.",
    unlock: { type: "rank", minRep: 160, rankLabel: "Elder" },
    x: 8,
    y: 52,
    size: "md",
    layer: "wall",
  },
  {
    id: "garden-sill",
    name: "Garden Sill",
    emoji: "🌸",
    lore: "The forest leans in through the open window.",
    unlock: { type: "rank", minRep: 250, rankLabel: "Forest Guardian" },
    x: 70,
    y: 38,
    size: "md",
    layer: "wall",
  },
  {
    id: "ceiling-mobile",
    name: "Twig Mobile",
    emoji: "✨",
    lore: "Turns slowly when the cottage is happy.",
    unlock: { type: "rank", minRep: 250, rankLabel: "Forest Guardian" },
    x: 48,
    y: 14,
    size: "md",
    layer: "ceiling",
  },
  {
    id: "keepsake-jar",
    name: "Keepsake Jar",
    emoji: "🫙",
    lore: "Filled with tiny finds from the village path.",
    unlock: {
      type: "keepsakes",
      min: 3,
      label: "Gather 3 village keepsakes",
    },
    x: 34,
    y: 56,
    size: "sm",
    layer: "mid",
  },
  {
    id: "pressed-leaves",
    name: "Pressed Finds",
    emoji: "🍃",
    lore: "Pinned above the desk like quiet trophies.",
    unlock: {
      type: "keepsakes",
      min: 8,
      label: "Gather 8 village keepsakes",
    },
    x: 88,
    y: 28,
    size: "sm",
    layer: "wall",
  },
];

export function keepsakeTotal(
  collectibles: Partial<Record<CollectibleKind, number>>
) {
  return Object.values(collectibles).reduce(
    (sum, n) => sum + (Number(n) || 0),
    0
  );
}

export function isDecorUnlocked(
  decor: CottageDecorDef,
  reputation: number,
  collectibles: Partial<Record<CollectibleKind, number>>
): boolean {
  if (decor.unlock.type === "always") return true;
  if (decor.unlock.type === "rank") return reputation >= decor.unlock.minRep;
  return keepsakeTotal(collectibles) >= decor.unlock.min;
}

export function unlockHint(decor: CottageDecorDef): string {
  if (decor.unlock.type === "always") return "Already yours.";
  if (decor.unlock.type === "rank") {
    return `Reach ${decor.unlock.rankLabel} (${decor.unlock.minRep} rep)`;
  }
  return decor.unlock.label;
}

export function nextUnlocks(
  reputation: number,
  collectibles: Partial<Record<CollectibleKind, number>>,
  limit = 3
) {
  return COTTAGE_DECOR.filter(
    (d) => !isDecorUnlocked(d, reputation, collectibles)
  )
    .sort((a, b) => {
      const score = (d: CottageDecorDef) => {
        if (d.unlock.type === "rank") return d.unlock.minRep;
        if (d.unlock.type === "keepsakes") return 20 + d.unlock.min * 5;
        return 0;
      };
      return score(a) - score(b);
    })
    .slice(0, limit);
}

export function rankProgress(reputation: number) {
  let current = RANK_LADDER[0];
  let next: (typeof RANK_LADDER)[number] | null = null;
  for (let i = 0; i < RANK_LADDER.length; i++) {
    if (reputation >= RANK_LADDER[i].minRep) current = RANK_LADDER[i];
    else {
      next = RANK_LADDER[i];
      break;
    }
  }
  const floor = current.minRep;
  const ceiling = next?.minRep ?? current.minRep;
  const span = Math.max(1, ceiling - floor);
  const pct = next
    ? Math.min(100, Math.round(((reputation - floor) / span) * 100))
    : 100;
  return { current, next, pct };
}

export function cottageFillPercent(
  reputation: number,
  collectibles: Partial<Record<CollectibleKind, number>>
) {
  const unlocked = COTTAGE_DECOR.filter((d) =>
    isDecorUnlocked(d, reputation, collectibles)
  ).length;
  return Math.round((unlocked / COTTAGE_DECOR.length) * 100);
}
