import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getHearthProgress } from "@/lib/hearth";
import {
  CANDLE_XP_COLLECTIBLE_GIFTS,
  HEARTH_TITLES,
} from "@/lib/hearthContent";
import { WorkshopProgressPanel } from "@/components/WorkshopProgressPanel";
import { PageCrest } from "@/components/PageCrest";
import { canAccessVillageWorkshop } from "@/lib/villages";

export default async function FiresideProgressPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!canAccessVillageWorkshop(user, "hearthwick")) {
    return (
      <main className="app-main forest-panel">
        <PageCrest kinds={["fox-seated", "leafy-branch", "candle-jar"]} />
        <header className="page-header">
          <h1>Fireside progress</h1>
          <p>This path belongs to Hearthwick villagers.</p>
        </header>
        <p className="muted">
          <Link href="/village">Return to your village</Link>
        </p>
      </main>
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
