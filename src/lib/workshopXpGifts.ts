import type { Database } from "better-sqlite3";
import { grantCollectible } from "@/lib/villageProgress";
import type { CollectibleKind } from "@/lib/villages";

/** XP milestone → village collectible gift (once each). */
export type XpCollectibleGift = {
  id: string;
  minXp: number;
  kind: CollectibleKind;
  label: string;
};

/** Mosshollow Library — total library XP. */
export const LIBRARY_XP_COLLECTIBLE_GIFTS: XpCollectibleGift[] = [
  { id: "library-gift-mushrooms", minXp: 75, kind: "mushrooms", label: "First shelf" },
  { id: "library-gift-leaves", minXp: 200, kind: "leaves", label: "Quiet reader" },
  { id: "library-gift-feathers", minXp: 400, kind: "feathers", label: "Owl friend" },
  { id: "library-gift-pages", minXp: 650, kind: "lost-pages", label: "Storykeeper" },
  { id: "library-gift-butterflies", minXp: 950, kind: "butterflies", label: "Page turner" },
  { id: "library-gift-acorns", minXp: 1300, kind: "acorns", label: "Grand librarian" },
];

/** Moonmere Observatory — total observatory XP. */
export const MOON_XP_COLLECTIBLE_GIFTS: XpCollectibleGift[] = [
  { id: "moon-gift-shards", minXp: 50, kind: "moon-shards", label: "First gleam" },
  { id: "moon-gift-moths", minXp: 150, kind: "moon-moths", label: "Night visitor" },
  { id: "moon-gift-starlight", minXp: 250, kind: "moon-starlight", label: "Sky listener" },
  { id: "moon-gift-pearls", minXp: 400, kind: "moon-pearls", label: "Mere hush" },
  { id: "moon-gift-lanterns", minXp: 600, kind: "moon-lanterns", label: "Dock light" },
  { id: "moon-gift-dust", minXp: 850, kind: "moon-dust", label: "Observatory elder" },
];

/** Clovermeadow Garden — total garden XP. */
export const GARDEN_XP_COLLECTIBLE_GIFTS: XpCollectibleGift[] = [
  { id: "garden-gift-butterflies", minXp: 80, kind: "clover-butterflies", label: "Tiny bloom" },
  { id: "garden-gift-bunnies", minXp: 200, kind: "clover-bunnies", label: "Meadow friend" },
  { id: "garden-gift-lotus", minXp: 400, kind: "clover-lotus", label: "Soft petals" },
  { id: "garden-gift-ribbon", minXp: 650, kind: "clover-ribbon", label: "Kind hands" },
  { id: "garden-gift-honey", minXp: 950, kind: "clover-honey", label: "Bloomkeeper" },
  { id: "garden-gift-hearts", minXp: 1300, kind: "clover-hearts", label: "Heart of clover" },
];

/** Bramblewood Workshop — total workshop XP. */
export const WORKSHOP_XP_COLLECTIBLE_GIFTS: XpCollectibleGift[] = [
  { id: "workshop-gift-fox", minXp: 100, kind: "bramble-fox-tails", label: "Tiny sapling" },
  { id: "workshop-gift-maple", minXp: 250, kind: "bramble-maple", label: "Forest friend" },
  { id: "workshop-gift-pumpkins", minXp: 450, kind: "bramble-pumpkins", label: "Craft apprentice" },
  { id: "workshop-gift-mushrooms", minXp: 700, kind: "bramble-mushrooms", label: "Woodland maker" },
  { id: "workshop-gift-candles", minXp: 1000, kind: "bramble-candles", label: "Hello Fall" },
  { id: "workshop-gift-pinecones", minXp: 1400, kind: "bramble-pinecones", label: "Master of Bramblewood" },
];

export function nextXpCollectibleGift(
  gifts: XpCollectibleGift[],
  claimed: string[]
): XpCollectibleGift | null {
  const claimedSet = new Set(claimed);
  for (const gift of gifts) {
    if (claimedSet.has(gift.id)) continue;
    return gift;
  }
  return null;
}

/** Grant every unclaimed gift whose minXp is reached. Idempotent via claimed ids. */
export function claimXpCollectibleGifts(
  db: Database,
  userId: string,
  xp: number,
  gifts: XpCollectibleGift[],
  claimed: string[]
): { claimed: string[]; granted: CollectibleKind[] } {
  const nextClaimed = [...claimed];
  const granted: CollectibleKind[] = [];
  for (const gift of gifts) {
    if (nextClaimed.includes(gift.id)) continue;
    if (xp < gift.minXp) continue;
    grantCollectible(db, userId, gift.kind, 1);
    nextClaimed.push(gift.id);
    granted.push(gift.kind);
  }
  return { claimed: nextClaimed, granted };
}
