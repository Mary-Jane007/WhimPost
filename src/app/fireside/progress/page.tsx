import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getHearthProgress } from "@/lib/hearth";
import {
  CANDLE_XP_COLLECTIBLE_GIFTS,
  HEARTH_TITLES,
} from "@/lib/hearthContent";
import { WorkshopProgressPanel } from "@/components/WorkshopProgressPanel";
import { PageCrest } from "@/components/PageCrest";
import { WorkshopAccessDenied } from "@/components/WorkshopAccessDenied";
import { evaluateWorkshopAccess } from "@/lib/workshopAccess";

export default async function FiresideProgressPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const decision = evaluateWorkshopAccess(user, "hearthwick");
  if (!decision.allowed) {
    return (
      <WorkshopAccessDenied
        decision={decision}
        workshopTitle="Fireside progress"
        crestKinds={["fox-seated", "leafy-branch", "candle-jar"]}
      />
    );
  }

  const progress = getHearthProgress(user.id);

  return (
    <main className="app-main forest-panel hw-fireside-page village-hearthwick">
      <PageCrest
        kinds={["fox-seated", "leafy-branch", "candle-jar"]}
        villageStickers={[
          { village: "hearthwick", id: "hedgehog" },
          { village: "hearthwick", id: "lavender-bouquet" },
          { village: "hearthwick", id: "herbal-jar" },
        ]}
      />
      <WorkshopProgressPanel
        villageId="hearthwick"
        hubHref="/fireside"
        hubLabel="the Fireside"
        eyebrow="Hearthwick · The Hearth Hall"
        title="XP & collectibles"
        lead="Track your fireside title path, candle XP gifts, and how to earn more."
        xp={progress.xp}
        xpLabel="fireside XP"
        titles={HEARTH_TITLES}
        gifts={[]}
        claimedIds={[]}
        secondary={{
          xp: progress.candleXp || 0,
          xpLabel: "candle XP",
          gifts: CANDLE_XP_COLLECTIBLE_GIFTS.map((g) => ({
            id: g.id,
            minXp: g.minCandleXp,
            kind: g.kind,
            label: g.label,
          })),
          claimedIds: progress.candleGiftsClaimed || [],
        }}
        giftLead="Candle crafts gift Hearthwick collectibles at XP milestones"
      />
    </main>
  );
}
