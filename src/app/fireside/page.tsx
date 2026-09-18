import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getHearthProgress } from "@/lib/hearth";
import { getVillageMediaOverrides } from "@/lib/villageMedia";
import { HearthwickFireside } from "@/components/HearthwickFireside";
import { VillageTasksBoard } from "@/components/VillageTasksBoard";
import { PageCrest } from "@/components/PageCrest";
import { WorkshopAccessDenied } from "@/components/WorkshopAccessDenied";
import { evaluateWorkshopAccess } from "@/lib/workshopAccess";

export default async function FiresidePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const decision = evaluateWorkshopAccess(user, "hearthwick");
  if (!decision.allowed) {
    return (
      <WorkshopAccessDenied
        decision={decision}
        workshopTitle="The Fireside"
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
      <VillageTasksBoard villageId="hearthwick" hub="fireside" />
      <HearthwickFireside
        user={user}
        initialProgress={progress}
        initialMedia={getVillageMediaOverrides()}
      />
    </main>
  );
}
