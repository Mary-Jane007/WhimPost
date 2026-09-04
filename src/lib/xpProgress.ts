import { COLLECTIBLE_META, type CollectibleKind } from "@/lib/villages";
import type { XpCollectibleGift } from "@/lib/workshopXpGifts";
import { nextXpCollectibleGift } from "@/lib/workshopXpGifts";

export type XpTitleStep = {
  minXp: number;
  title: string;
  emoji: string;
};

export type XpProgressLane = {
  label: string;
  currentLabel: string;
  nextLabel: string | null;
  xp: number;
  fromXp: number;
  toXp: number;
  remaining: number;
  percent: number;
  done: boolean;
};

export function titleProgress(
  xp: number,
  titles: readonly XpTitleStep[]
): XpProgressLane {
  let current = titles[0];
  let next: XpTitleStep | null = null;
  for (let i = 0; i < titles.length; i++) {
    if (xp >= titles[i].minXp) current = titles[i];
    else {
      next = titles[i];
      break;
    }
  }
  if (!next) {
    return {
      label: "Title path",
      currentLabel: `${current.emoji} ${current.title}`,
      nextLabel: null,
      xp,
      fromXp: current.minXp,
      toXp: current.minXp,
      remaining: 0,
      percent: 100,
      done: true,
    };
  }
  const fromXp = current.minXp;
  const toXp = next.minXp;
  const span = Math.max(1, toXp - fromXp);
  const percent = Math.max(0, Math.min(100, ((xp - fromXp) / span) * 100));
  return {
    label: "Title path",
    currentLabel: `${current.emoji} ${current.title}`,
    nextLabel: `${next.emoji} ${next.title}`,
    xp,
    fromXp,
    toXp,
    remaining: Math.max(0, toXp - xp),
    percent,
    done: false,
  };
}

export function giftProgress(
  xp: number,
  gifts: XpCollectibleGift[],
  claimedIds: string[]
): XpProgressLane {
  const next = nextXpCollectibleGift(gifts, claimedIds);
  if (!next) {
    return {
      label: "Keepsake path",
      currentLabel: "All keepsake gifts collected",
      nextLabel: null,
      xp,
      fromXp: xp,
      toXp: xp,
      remaining: 0,
      percent: 100,
      done: true,
    };
  }
  const claimedSet = new Set(claimedIds);
  let prevMin = 0;
  for (const g of gifts) {
    if (g.id === next.id) break;
    if (claimedSet.has(g.id) || xp >= g.minXp) prevMin = g.minXp;
  }
  const meta = COLLECTIBLE_META[next.kind as CollectibleKind];
  const fromXp = prevMin;
  const toXp = next.minXp;
  const span = Math.max(1, toXp - fromXp);
  const percent = Math.max(0, Math.min(100, ((xp - fromXp) / span) * 100));
  return {
    label: "Keepsake path",
    currentLabel: `${meta.emoji} ${meta.name}`,
    nextLabel: `${meta.emoji} ${meta.name}`,
    xp,
    fromXp,
    toXp,
    remaining: Math.max(0, toXp - xp),
    percent,
    done: xp >= toXp,
  };
}
