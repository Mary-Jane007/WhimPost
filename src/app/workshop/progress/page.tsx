import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getWorkshopProgress } from "@/lib/workshop";
import { WORKSHOP_TITLES } from "@/lib/workshopContent";
import { WORKSHOP_XP_COLLECTIBLE_GIFTS } from "@/lib/workshopXpGifts";
import { WorkshopProgressPanel } from "@/components/WorkshopProgressPanel";
import { PageCrest } from "@/components/PageCrest";
import { canAccessVillageWorkshop } from "@/lib/villages";

export default async function WorkshopProgressPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!canAccessVillageWorkshop(user, "bramblewood")) {
    return (
      <main className="app-main forest-panel">
        <PageCrest kinds={["fox-seated", "leafy-branch", "candle-jar"]} />
        <header className="page-header">
          <h1>Workshop progress</h1>
          <p>This path belongs to Bramblewood villagers.</p>
        </header>
        <p className="muted">
          <Link href="/village">Return to your village</Link>
        </p>
      </main>
    );
  }

  const progress = getWorkshopProgress(user.id);

  return (
    <main className="app-main forest-panel bw-workshop-page village-bramblewood">
      <PageCrest
        kinds={["fox-seated", "leafy-branch", "candle-jar"]}
        villageStickers={[
          { village: "bramblewood", id: "fox-face" },
          { village: "bramblewood", id: "maple-branch" },
        ]}
      />
      <WorkshopProgressPanel
        villageId="bramblewood"
        hubHref="/workshop"
        hubLabel="the Woodland Workshop"
        eyebrow="Bramblewood · Explorer's Guild"
        title="XP & collectibles"
        lead="Track your woodland workshop title path, keepsake gifts, and how to earn more XP."
        xp={progress.xp}
        xpLabel="workshop XP"
        titles={WORKSHOP_TITLES}
        gifts={WORKSHOP_XP_COLLECTIBLE_GIFTS}
        claimedIds={progress.xpGiftsClaimed || []}
        giftLead="Reach XP milestones to gift Bramblewood collectibles"
      />
    </main>
  );
}
