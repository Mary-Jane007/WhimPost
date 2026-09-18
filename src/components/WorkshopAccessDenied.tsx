import Link from "next/link";
import type { WorkshopAccessDecision } from "@/lib/workshopAccess";
import { PageCrest } from "@/components/PageCrest";
import type { StickerKind } from "@/lib/types";

const KIND_EMOJI: Record<string, string> = {
  closed: "🕯️",
  home_only: "🔒",
  invite_only: "✉️",
  visitors_welcome: "🌿",
  everyone: "🌎",
  allowed: "✦",
};

export function WorkshopAccessDenied({
  decision,
  workshopTitle,
  crestKinds,
}: {
  decision: WorkshopAccessDecision;
  workshopTitle: string;
  crestKinds?: StickerKind[];
}) {
  const emoji = KIND_EMOJI[decision.kind] || "🔒";
  return (
    <main className="app-main forest-panel workshop-access-denied">
      {crestKinds?.length ? <PageCrest kinds={crestKinds} /> : null}
      <header className="page-header">
        <h1>{workshopTitle}</h1>
      </header>
      <section className="workshop-access-card" data-kind={decision.kind}>
        <p className="workshop-access-emoji" aria-hidden>
          {emoji}
        </p>
        <h2>{decision.headline}</h2>
        <p>{decision.body}</p>
        <p className="muted">
          <Link href="/village">Return to the village square</Link>
        </p>
      </section>
    </main>
  );
}
