"use client";

import { COLLECTIBLE_META } from "@/lib/villages";
import {
  almanacForVillage,
  type XpAlmanacSection,
} from "@/lib/xpCelebrate";
import type { VillageId } from "@/lib/villages";

type Props = {
  villageId: VillageId | "letters";
  compact?: boolean;
  className?: string;
};

/** Readable cottagecore card listing XP tasks (and gift milestones). */
export function XpAlmanacCard({ villageId, compact, className }: Props) {
  const section: XpAlmanacSection | undefined = almanacForVillage(villageId);
  if (!section) return null;

  return (
    <section
      className={["xp-almanac", compact ? "compact" : "", className]
        .filter(Boolean)
        .join(" ")}
      aria-label={`${section.title} XP almanac`}
    >
      <header className="xp-almanac-head">
        <p className="xp-almanac-eyebrow">Forest almanac</p>
        <h2>
          <span aria-hidden>{section.emoji}</span> {section.title}
        </h2>
        <p className="xp-almanac-lead">{section.lead}</p>
      </header>
      <ul className="xp-almanac-tasks">
        {section.tasks.map((row) => (
          <li key={row.task}>
            <span className="xp-almanac-task">{row.task}</span>
            <span className="xp-almanac-xp">
              {row.xp > 0 ? `+${row.xp}` : "✧"}
            </span>
            {row.note ? (
              <span className="xp-almanac-note">{row.note}</span>
            ) : null}
          </li>
        ))}
      </ul>
      {section.gifts && section.gifts.length > 0 ? (
        <div className="xp-almanac-gifts">
          {section.giftLead ? <p>{section.giftLead}</p> : null}
          <ul>
            {section.gifts.map((g) => (
              <li key={`${g.minXp}-${g.kind}`}>
                <strong>{g.minXp} XP</strong> → {COLLECTIBLE_META[g.kind].emoji}{" "}
                {COLLECTIBLE_META[g.kind].name}
                <em> · {g.label}</em>
              </li>
            ))}
          </ul>
        </div>
      ) : section.giftLead ? (
        <p className="xp-almanac-gift-lead">{section.giftLead}</p>
      ) : null}
    </section>
  );
}
