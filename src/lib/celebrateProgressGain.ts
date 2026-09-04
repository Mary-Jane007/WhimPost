import type { CollectibleKind } from "@/lib/villages";
import { buildXpCelebration } from "@/lib/xpCelebrate";
import { emitXpCelebration } from "@/lib/xpCelebrateClient";

/** Compare before/after hub XP and celebrate cottagecore-style. */
export function celebrateProgressGain(input: {
  prevXp: number;
  nextXp: number;
  grantedCollectibles?: CollectibleKind[];
  activityHint?: string;
  reputation?: number;
}) {
  const xp = Math.max(0, (input.nextXp || 0) - (input.prevXp || 0));
  emitXpCelebration(
    buildXpCelebration({
      xp,
      reputation: input.reputation,
      collectibles: input.grantedCollectibles,
      activityHint: input.activityHint,
    })
  );
}
