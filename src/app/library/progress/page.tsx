import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLibraryProgress } from "@/lib/library";
import { LIBRARY_TITLES } from "@/lib/libraryContent";
import { LIBRARY_XP_COLLECTIBLE_GIFTS } from "@/lib/workshopXpGifts";
import { WorkshopProgressPanel } from "@/components/WorkshopProgressPanel";
import { PageCrest } from "@/components/PageCrest";
import { WorkshopAccessDenied } from "@/components/WorkshopAccessDenied";
import { evaluateWorkshopAccess } from "@/lib/workshopAccess";

export default async function LibraryProgressPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const decision = evaluateWorkshopAccess(user, "mosshollow");
  if (!decision.allowed) {
    return (
      <WorkshopAccessDenied
        decision={decision}
        workshopTitle="Library progress"
        crestKinds={["moss-books-stack", "moss-ink-bottle", "leafy-branch", "candle-jar"]}
      />
    );
  }

  const progress = getLibraryProgress(user.id);

  return (
    <main className="app-main forest-panel mh-library-page village-mosshollow">
      <PageCrest
        kinds={[
          "moss-books-stack",
          "moss-ink-bottle",
          "leafy-branch",
          "candle-jar",
        ]}
      />
      <WorkshopProgressPanel
        villageId="mosshollow"
        hubHref="/library"
        hubLabel="the Mosshollow Library"
        eyebrow="Mosshollow · The Archives"
        title="XP & collectibles"
        lead="Track your library title path, keepsake gifts, and how to earn more XP."
        xp={progress.xp}
        xpLabel="library XP"
        titles={LIBRARY_TITLES}
        gifts={LIBRARY_XP_COLLECTIBLE_GIFTS}
        claimedIds={progress.xpGiftsClaimed || []}
        giftLead="Reach XP milestones to gift Mosshollow collectibles"
      />
    </main>
  );
}
