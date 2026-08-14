import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listFriends } from "@/lib/letters";
import {
  getOrCreateVillageRoom,
  listFriendRooms,
  listVideosForUser,
} from "@/lib/tvCorner";
import { getVillage, type VillageId } from "@/lib/villages";
import { TvCorner } from "@/components/TvCorner";
import { PageCrest } from "@/components/PageCrest";
import Link from "next/link";

export default async function TvCornerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!user.villageId) {
    return (
      <main className="app-main forest-panel">
        <PageCrest kinds={["moon-full", "mushroom-amanita", "fox-seated"]} />
        <header className="page-header">
          <h1>TV Corner</h1>
          <p>Join a village first — every lounge needs a hearth and neighbors.</p>
        </header>
        <p className="muted">
          <Link href="/village">Visit the village square</Link> to find your home,
          then come back for cartoons by the fire.
        </p>
      </main>
    );
  }

  const village = getVillage(user.villageId as VillageId)!;
  const room = getOrCreateVillageRoom(user, user.villageId as VillageId);
  const videos = listVideosForUser(user);
  const friendRooms = listFriendRooms(user);
  const friends = listFriends(user.id);

  return (
    <main className={`app-main forest-panel tv-corner-page village-${village.id}`}>
      <TvCorner
        user={user}
        villageId={village.id}
        villageName={village.name}
        mascot={village.mascot}
        mascotImage={village.mascotImage || null}
        initialRoom={room}
        initialVideos={videos}
        initialFriendRooms={friendRooms}
        friendCount={friends.length}
      />
    </main>
  );
}
