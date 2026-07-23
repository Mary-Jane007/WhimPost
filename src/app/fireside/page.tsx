import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getHearthProgress } from "@/lib/hearth";
import { HearthwickFireside } from "@/components/HearthwickFireside";
import { PageCrest } from "@/components/PageCrest";

export default async function FiresidePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!user.villageId) {
    return (
      <main className="app-main forest-panel">
        <PageCrest
          kinds={["fox-seated", "leafy-branch", "candle-jar"]}
          villageStickers={[
            { village: "hearthwick", id: "hedgehog" },
            { village: "hearthwick", id: "lavender-bouquet" },
            { village: "hearthwick", id: "potion-bottles" },
          ]}
        />
        <header className="page-header">
          <h1>The Fireside</h1>
          <p>Join Hearthwick first — every hearth needs a home village.</p>
        </header>
        <p className="muted">
          <Link href="/village">Visit the village square</Link> to find your
          seat beside the fire.
        </p>
      </main>
    );
  }

  if (user.villageId !== "hearthwick") {
    return (
      <main className="app-main forest-panel">
        <PageCrest kinds={["fox-seated", "leafy-branch", "candle-jar"]} />
        <header className="page-header">
          <h1>The Fireside</h1>
          <p>
            This cottage is exclusive to Hearthwick. Join that village if you
            wish to warm your hands by our fire.
          </p>
        </header>
        <p className="muted">
          <Link href="/village">Return to your village</Link>
        </p>
      </main>
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
      <HearthwickFireside user={user} initialProgress={progress} />
    </main>
  );
}
