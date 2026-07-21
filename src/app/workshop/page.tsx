import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getWorkshopProgress } from "@/lib/workshop";
import { BramblewoodWorkshop } from "@/components/BramblewoodWorkshop";
import { PageCrest } from "@/components/PageCrest";

export default async function WorkshopPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!user.villageId) {
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
          <h1>The Bramblewood Workshop</h1>
          <p>Join Bramblewood first — every workshop needs a woodland home.</p>
        </header>
        <p className="muted">
          <Link href="/village">Visit the village square</Link> to find your
          home among the autumn trees.
        </p>
      </main>
    );
  }

  if (user.villageId !== "bramblewood" && !user.isOwner) {
    return (
      <main className="app-main forest-panel">
        <PageCrest kinds={["fox-seated", "leafy-branch", "candle-jar"]} />
        <header className="page-header">
          <h1>The Bramblewood Workshop</h1>
          <p>
            This cozy atelier belongs to Bramblewood villagers. You&apos;re
            welcome to visit their square, or settle there if your heart leans
            autumn-orange.
          </p>
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
          { village: "bramblewood", id: "monarch" },
          { village: "bramblewood", id: "maple-branch" },
        ]}
      />
      <BramblewoodWorkshop user={user} initialProgress={progress} />
    </main>
  );
}
