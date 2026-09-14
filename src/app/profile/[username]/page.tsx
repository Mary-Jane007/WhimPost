import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  countUserLetters,
  getOrCreateCottage,
} from "@/lib/cottageState";
import { getDb } from "@/lib/db";
import {
  getFriendshipRelation,
  getUserByUsername,
} from "@/lib/letters";
import { getUserVillageStats } from "@/lib/villageProgress";
import { getVillage } from "@/lib/villages";
import { CottageProfile } from "@/components/CottageProfile";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/login");

  const { username } = await params;
  const profile = getUserByUsername(username);
  if (!profile) notFound();

  const isSelf = viewer.id === profile.id;
  const homeVillageId = profile.homeVillageId || profile.villageId;
  const village = getVillage(homeVillageId);
  const db = getDb();
  const stats = getUserVillageStats(db, profile.id);
  const letterCount = countUserLetters(db, profile.id);
  const cottage = getOrCreateCottage(
    db,
    {
      id: profile.id,
      displayName: profile.displayName,
      createdAt: profile.createdAt,
      reputation: profile.reputation,
      homeVillageId: profile.homeVillageId,
      villageId: profile.villageId,
    },
    stats.collectibles,
    letterCount
  );
  const relation = isSelf
    ? ({ status: "none" } as const)
    : getFriendshipRelation(viewer.id, profile.id);

  return (
    <main className="app-main cottage-main">
      <CottageProfile
        profile={profile}
        village={village}
        collectibles={stats.collectibles}
        isSelf={isSelf}
        relation={relation}
        initialCottage={cottage}
        letterCount={letterCount}
        activityCount={0}
        tvCount={0}
      />
    </main>
  );
}
