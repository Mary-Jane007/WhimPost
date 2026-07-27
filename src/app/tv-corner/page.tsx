import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { listFriends } from "@/lib/letters";
import {
  getOrCreateVillageRoom,
  listFriendRooms,
  listChannelsForUser,
} from "@/lib/tvCorner";
import { getVillage, VILLAGES, type VillageId } from "@/lib/villages";
import { TvCorner } from "@/components/TvCorner";
import { PageCrest } from "@/components/PageCrest";

type Props = {
  searchParams?: Promise<{ scope?: string }>;
};

export default async function TvCornerPage({ searchParams }: Props) {
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

  const sp = (await searchParams) || {};
  const initialScope = sp.scope === "friends" ? "friends" : "village";
  const village = getVillage(user.villageId as VillageId)!;
  const villageRoom = getOrCreateVillageRoom(user, user.villageId as VillageId);
  const friendRooms = listFriendRooms(user);
  const room =
    initialScope === "friends"
      ? friendRooms[0] || {
          ...villageRoom,
          id: "",
          scope: "friends" as const,
          currentVideo: null,
          currentVideoId: null,
          currentChannelId: null,
          isPlaying: false,
          positionMs: 0,
          watchers: [],
          messages: [],
          schedule: [],
          airStartsAt: null,
          broadcastMode: "interactive" as const,
          title: "Friends couch",
        }
      : villageRoom;
  const channels = listChannelsForUser(user, room);
  const friends = listFriends(user.id);
  const villageOptions = VILLAGES.map((v) => ({ id: v.id, name: v.name }));

  return (
    <main className={`app-main forest-panel tv-corner-page village-${village.id}`}>
      {/*
        Classic defer script so guide air times show in the laptop timezone
        even when React fails to hydrate (next/script beforeInteractive breaks
        App Router; afterInteractive may never run without client React).
      */}
      <script src="/tv-guide-local.js" defer />
      <TvCorner
        user={user}
        villageId={village.id}
        villageName={village.name}
        mascot={village.mascot}
        mascotImage={village.mascotImage || null}
        villageOptions={villageOptions}
        initialRoom={room}
        initialChannels={channels}
        initialFriendRooms={friendRooms}
        friendCount={friends.length}
        initialScope={initialScope}
      />
    </main>
  );
}
