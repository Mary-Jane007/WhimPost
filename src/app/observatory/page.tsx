import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getMoonProgress } from "@/lib/moon";
import { getVillageMediaOverrides } from "@/lib/villageMedia";
import { MoonmereObservatory } from "@/components/MoonmereObservatory";
import { VillageTasksBoard } from "@/components/VillageTasksBoard";
import { PageCrest } from "@/components/PageCrest";
import { canAccessVillageWorkshop } from "@/lib/villages";

export default async function ObservatoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const homeVillageId = user.homeVillageId || user.villageId;

  if (!canAccessVillageWorkshop(user, "moonmere")) {
    if (!homeVillageId) {
      return (
        <main className="app-main forest-panel">
          <PageCrest
            kinds={["moon-crescent", "moon-full", "dragonfly"]}
            villageStickers={[
              { village: "moonmere", id: "luna-moth" },
              { village: "moonmere", id: "moon-crescent" },
              { village: "moonmere", id: "lantern-star" },
            ]}
          />
          <header className="page-header">
            <h1>The Observatory</h1>
            <p>Join Moonmere first — every telescope needs a home village.</p>
          </header>
          <p className="muted">
            <Link href="/village">Visit the village square</Link> to find your
            place beneath the stars.
          </p>
        </main>
      );
    }

    return (
      <main className="app-main forest-panel">
        <PageCrest kinds={["moon-crescent", "moon-full", "dragonfly"]} />
        <header className="page-header">
          <h1>The Observatory</h1>
          <p>
            This dome is exclusive to Moonmere. Join that village if you wish
            to watch the night with us.
          </p>
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
      <VillageTasksBoard villageId="moonmere" hub="observatory" />
      <MoonmereObservatory
        user={user}
        initialProgress={progress}
        initialMedia={getVillageMediaOverrides()}
      />
    </main>
  );
}
