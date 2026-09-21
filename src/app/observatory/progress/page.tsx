import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getMoonProgress } from "@/lib/moon";
import { MOON_TITLES } from "@/lib/moonContent";
import { MOON_XP_COLLECTIBLE_GIFTS } from "@/lib/workshopXpGifts";
import { WorkshopProgressPanel } from "@/components/WorkshopProgressPanel";
import { PageCrest } from "@/components/PageCrest";
import { WorkshopAccessDenied } from "@/components/WorkshopAccessDenied";
import { evaluateWorkshopAccess } from "@/lib/workshopAccess";

export default async function ObservatoryProgressPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const decision = evaluateWorkshopAccess(user, "moonmere");
  if (!decision.allowed) {
    return (
      <WorkshopAccessDenied
        decision={decision}
        workshopTitle="Observatory progress"
        crestKinds={["moon-crescent", "moon-full", "dragonfly"]}
      />
    );
  }

  const progress = getMoonProgress(user.id);

  return (
    <main className="app-main forest-panel mm-observatory-page village-moonmere">
      <PageCrest
        kinds={["moon-crescent", "moon-full", "dragonfly"]}
        villageStickers={[
          { village: "moonmere", id: "luna-moth" },
          { village: "moonmere", id: "moon-crescent" },
          { village: "moonmere", id: "fairy-moon" },
        ]}
      />
      <WorkshopProgressPanel
        villageId="moonmere"
        hubHref="/observatory"
        hubLabel="the Observatory"
        eyebrow="Moonmere · The Observatory"
        title="XP & collectibles"
        lead="Track your observatory title path, keepsake gifts, and how to earn more XP."
        xp={progress.xp}
        xpLabel="observatory XP"
        titles={MOON_TITLES}
        gifts={MOON_XP_COLLECTIBLE_GIFTS}
        claimedIds={progress.xpGiftsClaimed || []}
        giftLead="Reach XP milestones to gift Moonmere collectibles"
      />
    </main>
  );
}
