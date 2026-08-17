import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getGardenProgress } from "@/lib/garden";
import { getVillageMediaOverrides } from "@/lib/villageMedia";
import { BloomkeeperGarden } from "@/components/BloomkeeperGarden";
import { PageCrest } from "@/components/PageCrest";

export default async function GardenPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!user.villageId) {
    return (
      <main className="app-main forest-panel">
        <PageCrest
          kinds={["clover-blossom", "clover-butterfly-small", "clover-bunny"]}
        />
        <header className="page-header">
          <h1>The Bloomkeeper&apos;s Garden</h1>
          <p>Join Clovermeadow first — every meadow needs a gentle heart.</p>
        </header>
        <p className="muted">
          <Link href="/village">Visit the village square</Link> to find your
          place among the clovers.
        </p>
      </main>
    );
  }

  if (user.villageId !== "clovermeadow") {
    return (
      <main className="app-main forest-panel">
        <PageCrest
          kinds={["clover-blossom", "clover-butterfly-small", "clover-bunny"]}
        />
        <header className="page-header">
          <h1>The Bloomkeeper&apos;s Garden</h1>
          <p>
            This garden is exclusive to Clovermeadow. Settle among the wildflowers
            if you wish to become a Bloomkeeper.
          </p>
        </header>
        <p className="muted">
          <Link href="/village">Return to your village</Link>
        </p>
      </main>
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
      <BloomkeeperGarden
        user={user}
        initialProgress={progress}
        initialMedia={getVillageMediaOverrides()}
      />
    </main>
  );
}
