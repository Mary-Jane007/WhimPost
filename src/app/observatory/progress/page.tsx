import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getMoonProgress } from "@/lib/moon";
import { MOON_TITLES } from "@/lib/moonContent";
import { MOON_XP_COLLECTIBLE_GIFTS } from "@/lib/workshopXpGifts";
import { WorkshopProgressPanel } from "@/components/WorkshopProgressPanel";
import { PageCrest } from "@/components/PageCrest";
import { canAccessVillageWorkshop } from "@/lib/villages";

export default async function ObservatoryProgressPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!canAccessVillageWorkshop(user, "moonmere")) {
    return (
      <main className="app-main forest-panel">
        <PageCrest kinds={["moon-crescent", "moon-full", "dragonfly"]} />
        <header className="page-header">
          <h1>Observatory progress</h1>
          <p>This path belongs to Moonmere villagers.</p>
        </header>
        <p className="muted">
          <Link href="/village">Return to your village</Link>
        </p>
      </main>
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
