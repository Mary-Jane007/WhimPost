"use client";

import Link from "next/link";
import { WorkshopXpProgress } from "@/components/WorkshopXpProgress";
import { XpCollectibleGiftBoard } from "@/components/XpCollectibleGiftBoard";
import { XpAlmanacCard } from "@/components/XpAlmanacCard";
import type { XpCollectibleGift } from "@/lib/workshopXpGifts";
import type { XpTitleStep } from "@/lib/xpProgress";
import type { VillageId } from "@/lib/villages";

type SecondaryLane = {
  xp: number;
  xpLabel: string;
  gifts: XpCollectibleGift[];
  claimedIds: string[];
  titles?: readonly XpTitleStep[];
};

export function WorkshopProgressPanel({
  villageId,
  hubHref,
  hubLabel,
  eyebrow,
  title,
  lead,
  xp,
  xpLabel,
  titles,
  gifts,
  claimedIds,
  secondary,
  giftLead,
}: {
  villageId: VillageId;
  hubHref: string;
  hubLabel: string;
  eyebrow: string;
  title: string;
  lead: string;
  xp: number;
  xpLabel: string;
  titles: readonly XpTitleStep[];
  gifts: XpCollectibleGift[];
  claimedIds: string[];
  secondary?: SecondaryLane;
  giftLead: string;
}) {
  return (
    <div className="workshop-progress-page">
      <p className="workshop-progress-back">
        <Link href={hubHref}>← Back to {hubLabel}</Link>
      </p>
      <header className="workshop-progress-hero">
        <p className="workshop-progress-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="workshop-progress-lead">{lead}</p>
        <p className="workshop-progress-stat">
          <strong>{xp}</strong> {xpLabel}
          {secondary ? (
            <>
              {" "}
              · <strong>{secondary.xp}</strong> {secondary.xpLabel}
            </>
          ) : null}
        </p>
      </header>

      <WorkshopXpProgress
        xp={xp}
        xpLabel={xpLabel}
        titles={titles}
        gifts={gifts}
        claimedIds={claimedIds}
        secondary={secondary}
      />

      {gifts.length > 0 ? (
        <XpCollectibleGiftBoard
          xp={xp}
          xpLabel={xpLabel}
          gifts={gifts}
          claimedIds={claimedIds}
          lead={giftLead}
        />
      ) : null}

      {secondary && secondary.gifts.length > 0 ? (
        <XpCollectibleGiftBoard
          title={`${secondary.xpLabel} collectible gifts`}
          xp={secondary.xp}
          xpLabel={secondary.xpLabel}
          gifts={secondary.gifts}
          claimedIds={secondary.claimedIds}
          lead={`Reach ${secondary.xpLabel} milestones for extra keepsakes`}
        />
      ) : null}

      <XpAlmanacCard villageId={villageId} />
    </div>
  );
}

export function WorkshopProgressLink({
  href,
  label = "XP & collectibles progress",
}: {
  href: string;
  label?: string;
}) {
  return (
    <p className="workshop-progress-link">
      <Link href={href}>{label} →</Link>
    </p>
  );
}
