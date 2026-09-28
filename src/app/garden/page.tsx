import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getGardenProgress } from "@/lib/garden";
import { getVillageMediaOverrides } from "@/lib/villageMedia";
import { BloomkeeperGarden } from "@/components/BloomkeeperGarden";
import { VillageTasksBoard } from "@/components/VillageTasksBoard";
import { PageCrest } from "@/components/PageCrest";
import { WorkshopAccessDenied } from "@/components/WorkshopAccessDenied";
import { evaluateWorkshopAccess } from "@/lib/workshopAccess";

export default async function GardenPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const decision = evaluateWorkshopAccess(user, "clovermeadow");
  if (!decision.allowed) {
    return (
      <WorkshopAccessDenied
        decision={decision}
        workshopTitle="The Bloomkeeper's Garden"
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
      <VillageTasksBoard villageId="clovermeadow" hub="garden" />
      <BloomkeeperGarden
        user={user}
        initialProgress={progress}
        initialMedia={getVillageMediaOverrides()}
      />
    </main>
  );
}
