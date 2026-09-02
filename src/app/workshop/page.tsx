import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getWorkshopProgress } from "@/lib/workshop";
import { getVillageMediaOverrides } from "@/lib/villageMedia";
import { BramblewoodWorkshop } from "@/components/BramblewoodWorkshop";
import { VillageTasksBoard } from "@/components/VillageTasksBoard";
import { PageCrest } from "@/components/PageCrest";
import { canAccessVillageWorkshop } from "@/lib/villages";

export default async function WorkshopPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const homeVillageId = user.homeVillageId || user.villageId;

  if (!canAccessVillageWorkshop(user, "bramblewood")) {
    if (!homeVillageId) {
      return (
        <main className="app-main forest-panel">
          <PageCrest
            kinds={["fox-seated", "leafy-branch", "candle-jar"]}
            villageStickers={[
              { village: "bramblewood", id: "fox-face" },
              { village: "bramblewood", id: "maple-branch" },
              { village: "bramblewood", id: "candle-jar" },
            ]}
          />
          <header className="page-header">
            <h1>The Woodland Workshop</h1>
            <p>Join Bramblewood first — every workshop needs a woodland home.</p>
          </header>
          <p className="muted">
            <Link href="/village">Visit the village square</Link> to find your
            home among the autumn trees.
          </p>
        </main>
      );
    }

    return (
      <main className="app-main forest-panel">
        <PageCrest kinds={["fox-seated", "leafy-branch", "candle-jar"]} />
        <header className="page-header">
          <h1>The Woodland Workshop</h1>
          <p>
            This atelier is exclusive to Bramblewood villagers. Visitors cannot
            participate — join that village if you want a seat among the autumn
            crafts.
          </p>
        </header>
        <p className="muted">
          <Link href="/village">Return to your village</Link>
        </p>
      </main>
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
