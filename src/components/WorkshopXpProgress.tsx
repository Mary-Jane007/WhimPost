"use client";

import type { XpCollectibleGift } from "@/lib/workshopXpGifts";
import {
  giftProgress,
  titleProgress,
  type XpTitleStep,
} from "@/lib/xpProgress";

type Props = {
  xp: number;
  xpLabel?: string;
  titles: readonly XpTitleStep[];
  gifts?: XpCollectibleGift[];
  claimedIds?: string[];
  /** Optional second lane (e.g. Fireside candle XP). */
  secondary?: {
    xp: number;
    xpLabel: string;
    gifts: XpCollectibleGift[];
    claimedIds: string[];
    titles?: readonly XpTitleStep[];
  };
  className?: string;
};

function Lane({
  eyebrow,
  percent,
  left,
  right,
  hint,
}: {
  eyebrow: string;
  percent: number;
  left: string;
  right: string;
  hint: string;
}) {
  return (
    <div className="wxp-lane">
      <div className="wxp-lane-head">
        <span className="wxp-eyebrow">{eyebrow}</span>
        <span className="wxp-hint">{hint}</span>
      </div>
      <div
        className="wxp-bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        aria-label={eyebrow}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      <div className="wxp-lane-foot">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}

/** Live XP progress on a workshop homepage — title path + next keepsake. */
export function WorkshopXpProgress({
  xp,
  xpLabel = "XP",
  titles,
  gifts = [],
  claimedIds = [],
  secondary,
  className,
}: Props) {
  const titleLane = titleProgress(xp, titles);
  const giftLane =
    gifts.length > 0 ? giftProgress(xp, gifts, claimedIds) : null;

  const secondaryGift =
    secondary && secondary.gifts.length > 0
      ? giftProgress(secondary.xp, secondary.gifts, secondary.claimedIds)
      : null;

  return (
    <section
      className={["wxp-progress", className].filter(Boolean).join(" ")}
      aria-label="Your workshop XP progress"
    >
      <header className="wxp-head">
        <p className="wxp-kicker">Your path through this workshop</p>
        <p className="wxp-total">
          <strong>{xp}</strong> {xpLabel}
          {secondary ? (
            <>
              {" "}
              · <strong>{secondary.xp}</strong> {secondary.xpLabel}
            </>
          ) : null}
        </p>
      </header>

      <Lane
        eyebrow="Next title"
        percent={titleLane.percent}
        left={titleLane.currentLabel}
        right={
          titleLane.done
            ? "Highest title reached"
            : `${titleLane.remaining} XP → ${titleLane.nextLabel}`
        }
        hint={
          titleLane.done
            ? "You wear the tallest crown of this path."
            : `Growing toward ${titleLane.nextLabel}`
        }
      />

      {giftLane ? (
        <Lane
          eyebrow="Next keepsake"
          percent={giftLane.done ? 100 : giftLane.percent}
          left={giftLane.done ? "Jar is full of gifts" : giftLane.currentLabel}
          right={
            giftLane.done
              ? "All keepsakes gifted"
              : giftLane.remaining <= 0
                ? "Ready to claim on your next action"
                : `${giftLane.remaining} XP → ${giftLane.nextLabel}`
          }
          hint={
            giftLane.done
              ? "Every milestone keepsake has found you."
              : `Next gift: ${giftLane.nextLabel}`
          }
        />
      ) : null}

      {secondaryGift ? (
        <Lane
          eyebrow={`Next ${secondary!.xpLabel} gift`}
          percent={secondaryGift.done ? 100 : secondaryGift.percent}
          left={
            secondaryGift.done
              ? "Candle gifts complete"
              : `${secondary!.xp} ${secondary!.xpLabel}`
          }
          right={
            secondaryGift.done
              ? "All candle keepsakes gifted"
              : secondaryGift.remaining <= 0
                ? "Ready on your next candle craft"
                : `${secondaryGift.remaining} → ${secondaryGift.nextLabel}`
          }
          hint={
            secondaryGift.done
              ? "The candle shelf is fully lit."
              : `Candle path: ${secondaryGift.nextLabel}`
          }
        />
      ) : null}
    </section>
  );
}
