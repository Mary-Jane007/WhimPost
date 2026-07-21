import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  getFriendshipRelation,
  getUserByUsername,
} from "@/lib/letters";
import { getUserVillageStats } from "@/lib/villageProgress";
import { getVillage } from "@/lib/villages";
import { markUnlocksSeen } from "@/lib/notifications";
import { CottageProfile } from "@/components/CottageProfile";
import { PageCrest } from "@/components/PageCrest";

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
  const db = getDb();
  if (isSelf) markUnlocksSeen(db, viewer.id);
  const village = getVillage(profile.villageId);
  const stats = getUserVillageStats(db, profile.id);
  const relation = isSelf
    ? ({ status: "none" } as const)
    : getFriendshipRelation(viewer.id, profile.id);

  return (
    <main className="app-main cottage-main">
      <PageCrest kinds={["hand-mirror", "candle-jar", "leafy-branch"]} />
      <CottageProfile
        profile={profile}
        village={village}
        collectibles={stats.collectibles}
        isSelf={isSelf}
        relation={relation}
        shareVillage={Boolean(
          !isSelf &&
            viewer.villageId &&
            profile.villageId &&
            viewer.villageId === profile.villageId
        )}
      />
    </main>
  );
}
