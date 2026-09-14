import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CharacterCustomizeClient } from "@/components/CharacterCustomizeClient";
import type { VillageId } from "@/lib/villages";
import { getVillage, isVillageId } from "@/lib/villages";

export default async function CharacterPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const villageId = (user.homeVillageId || user.villageId) as string | null;
  if (!villageId || !isVillageId(villageId)) {
    redirect("/village");
  }

  const village = getVillage(villageId as VillageId);
  if (!village) redirect("/village");

  return (
    <main className="app-main character-main">
      <div className="character-page">
        <p className="belonging-kicker">Cottage resident</p>
        <h1>
          Choose your character{" "}
          <span aria-hidden>{village.mascot}</span>
        </h1>
        <p className="character-page-lead">
          Your resident lives in {village.name}. Pick a species and male or
          female version — each has a fixed look. Letters and your cottage
          profile will update.
        </p>
        <CharacterCustomizeClient
          villageId={villageId as VillageId}
          initialCharacterJson={user.characterJson}
          username={user.username}
        />
      </div>
    </main>
  );
}
