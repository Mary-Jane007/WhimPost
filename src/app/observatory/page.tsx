import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getMoonProgress } from "@/lib/moon";
import { getVillageMediaOverrides } from "@/lib/villageMedia";
import { MoonmereObservatory } from "@/components/MoonmereObservatory";
import { VillageTasksBoard } from "@/components/VillageTasksBoard";
import { PageCrest } from "@/components/PageCrest";
import { WorkshopAccessDenied } from "@/components/WorkshopAccessDenied";
import { evaluateWorkshopAccess } from "@/lib/workshopAccess";

export default async function ObservatoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const decision = evaluateWorkshopAccess(user, "moonmere");
  if (!decision.allowed) {
    return (
      <WorkshopAccessDenied
        decision={decision}
        workshopTitle="The Observatory"
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
      <VillageTasksBoard villageId="moonmere" hub="observatory" />
      <MoonmereObservatory
        user={user}
        initialProgress={progress}
        initialMedia={getVillageMediaOverrides()}
      />
    </main>
  );
}
