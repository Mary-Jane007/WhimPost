"use client";

import { COLLECTIBLE_META, type CollectibleKind } from "@/lib/villages";
import type { XpCollectibleGift } from "@/lib/workshopXpGifts";

type Props = {
  title?: string;
  lead?: string;
  xp: number;
  xpLabel?: string;
  gifts: XpCollectibleGift[];
  claimedIds: string[];
  className?: string;
};

/** Shared milestone board: hub XP → village collectible gifts. */
export function XpCollectibleGiftBoard({
  title = "XP collectible gifts",
  lead,
  xp,
  xpLabel = "XP",
  gifts,
  claimedIds,
  className,
}: Props) {
  const claimed = new Set(claimedIds);

  return (
    <div
      className={["xp-gift-board", className].filter(Boolean).join(" ")}
      aria-label={title}
    >
      <p className="xp-gift-stat">
        <strong>{xp}</strong> {xpLabel}
        {lead ? <span className="xp-gift-lead"> · {lead}</span> : null}
      </p>
      <ul className="xp-gift-list">
        {gifts.map((gift) => {
          const isClaimed = claimed.has(gift.id);
          const reached = xp >= gift.minXp;
          const meta = COLLECTIBLE_META[gift.kind as CollectibleKind];
          return (
            <li
              key={gift.id}
              className={isClaimed ? "claimed" : reached ? "ready" : "locked"}
            >
              <span className="xp-gift-xp">{gift.minXp} XP</span>
              <span>
                {meta.emoji} {meta.name}
              </span>
              <span className="xp-gift-label">
                {isClaimed ? "Gifted" : reached ? "Ready" : gift.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function formatGrantedCollectibles(kinds: CollectibleKind[]): string {
  return kinds.map((k) => COLLECTIBLE_META[k].name).join(", ");
}
