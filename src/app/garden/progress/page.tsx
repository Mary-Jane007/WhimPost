import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getGardenProgress } from "@/lib/garden";
import { GARDEN_TITLES } from "@/lib/gardenContent";
import { GARDEN_XP_COLLECTIBLE_GIFTS } from "@/lib/workshopXpGifts";
import { WorkshopProgressPanel } from "@/components/WorkshopProgressPanel";
import { PageCrest } from "@/components/PageCrest";
import { WorkshopAccessDenied } from "@/components/WorkshopAccessDenied";
import { evaluateWorkshopAccess } from "@/lib/workshopAccess";

export default async function GardenProgressPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const decision = evaluateWorkshopAccess(user, "clovermeadow");
  if (!decision.allowed) {
    return (
      <WorkshopAccessDenied
        decision={decision}
        workshopTitle="Garden progress"
        crestKinds={["clover-blossom", "clover-butterfly-small", "clover-bunny"]}
      />
    );
  }

  const progress = getGardenProgress(user.id);

  return (
    <main className="app-main forest-panel cm-garden-page village-clovermeadow">
      <PageCrest
        kinds={[
          "clover-blossom-branch",
          "clover-butterfly-silk",
          "clover-bunny",
          "clover-orchid",
        ]}
      />
      <WorkshopProgressPanel
        villageId="clovermeadow"
        hubHref="/garden"
        hubLabel="the Bloomkeeper's Garden"
        eyebrow="Clovermeadow · The Meadow"
        title="XP & collectibles"
        lead="Track your garden title path, keepsake gifts, and how to earn more XP."
        xp={progress.xp}
        xpLabel="garden XP"
        titles={GARDEN_TITLES}
        gifts={GARDEN_XP_COLLECTIBLE_GIFTS}
        claimedIds={progress.xpGiftsClaimed || []}
        giftLead="Reach XP milestones to gift Clovermeadow collectibles"
      />
    </main>
  );
}
