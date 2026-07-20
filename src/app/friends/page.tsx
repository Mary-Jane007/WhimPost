import { redirect } from "next/navigation";
import { getCurrentUser, mapUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listFriends } from "@/lib/letters";
import { FriendsPanel } from "@/components/FriendsPanel";
import { PageCrest } from "@/components/PageCrest";

export default async function FriendsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const friends = listFriends(user.id);

  const incoming = (
    db
      .prepare(
        `SELECT f.id, f.created_at, u.id as uid, u.username, u.display_name, u.bio, u.forest_name, u.created_at as ucreated, u.is_owner
         FROM friendships f
         JOIN users u ON u.id = f.requester_id
         WHERE f.addressee_id = ? AND f.status = 'pending'
         ORDER BY f.created_at DESC`
      )
      .all(user.id) as Array<{
      id: string;
      created_at: string;
      uid: string;
      username: string;
      display_name: string;
      bio: string;
      forest_name: string;
      ucreated: string;
      is_owner: number;
    }>
  ).map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    user: mapUser({
      id: r.uid,
      username: r.username,
      display_name: r.display_name,
      bio: r.bio,
      forest_name: r.forest_name,
      created_at: r.ucreated,
      is_owner: r.is_owner,
    }),
  }));

  const outgoing = (
    db
      .prepare(
        `SELECT f.id, f.created_at, u.id as uid, u.username, u.display_name, u.bio, u.forest_name, u.created_at as ucreated, u.is_owner
         FROM friendships f
         JOIN users u ON u.id = f.addressee_id
         WHERE f.requester_id = ? AND f.status = 'pending'
         ORDER BY f.created_at DESC`
      )
      .all(user.id) as Array<{
      id: string;
      created_at: string;
      uid: string;
      username: string;
      display_name: string;
      bio: string;
      forest_name: string;
      ucreated: string;
      is_owner: number;
    }>
  ).map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    user: mapUser({
      id: r.uid,
      username: r.username,
      display_name: r.display_name,
      bio: r.bio,
      forest_name: r.forest_name,
      created_at: r.ucreated,
      is_owner: r.is_owner,
    }),
  }));

  return (
    <main className="app-main forest-panel">
      <PageCrest kinds={["fox", "leaf", "acorn"]} />
      <header className="page-header">
        <h1>Friends</h1>
        <p>
          Grow your circle. Letters only travel between people who have accepted
          each other.
        </p>
      </header>
      <FriendsPanel
        initialFriends={friends}
        initialIncoming={incoming}
        initialOutgoing={outgoing}
      />
    </main>
  );
}
