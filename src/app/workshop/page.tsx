import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getWorkshopProgress } from "@/lib/workshop";
import { getVillageMediaOverrides } from "@/lib/villageMedia";
import { BramblewoodWorkshop } from "@/components/BramblewoodWorkshop";
import { VillageTasksBoard } from "@/components/VillageTasksBoard";
import { PageCrest } from "@/components/PageCrest";
import { WorkshopAccessDenied } from "@/components/WorkshopAccessDenied";
import { evaluateWorkshopAccess } from "@/lib/workshopAccess";

export default async function WorkshopPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const decision = evaluateWorkshopAccess(user, "bramblewood");
  if (!decision.allowed) {
    return (
      <WorkshopAccessDenied
        decision={decision}
        workshopTitle="The Woodland Workshop"
        crestKinds={["fox-seated", "leafy-branch", "candle-jar"]}
      />
    );
  }

  const progress = getWorkshopProgress(user.id);
  const media = getVillageMediaOverrides();

  return (
    <main className="app-main forest-panel bw-workshop-page village-bramblewood">
      <PageCrest
        kinds={["fox-seated", "leafy-branch", "candle-jar"]}
        villageStickers={[
          { village: "bramblewood", id: "fox-face" },
          { village: "bramblewood", id: "monarch" },
          { village: "bramblewood", id: "maple-branch" },
        ]}
      />
      <VillageTasksBoard villageId="bramblewood" hub="workshop" />
      <BramblewoodWorkshop
        user={user}
        initialProgress={progress}
        initialMedia={media}
      />
    </main>
  );
}
