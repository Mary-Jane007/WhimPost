import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError, mapUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listFriends } from "@/lib/letters";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const db = getDb();
  const friends = listFriends(user.id);

  const incoming = db
    .prepare(
      `SELECT f.id, f.created_at, u.id as uid, u.username, u.display_name, u.bio, u.forest_name, u.created_at as ucreated, u.is_owner, u.village_id, u.reputation
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
    village_id: string | null;
    reputation: number;
  }>;

  const outgoing = db
    .prepare(
      `SELECT f.id, f.created_at, u.id as uid, u.username, u.display_name, u.bio, u.forest_name, u.created_at as ucreated, u.is_owner, u.village_id, u.reputation
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
    village_id: string | null;
    reputation: number;
  }>;

  return NextResponse.json({
    friends,
    incoming: incoming.map((r) => ({
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
        village_id: r.village_id,
        reputation: r.reputation,
      }),
    })),
    outgoing: outgoing.map((r) => ({
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
        village_id: r.village_id,
        reputation: r.reputation,
      }),
    })),
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body");

  const displayName = String(body.displayName ?? user.displayName).trim();
  const bio = String(body.bio ?? user.bio).trim().slice(0, 280);
  const forestName = String(body.forestName ?? user.forestName).trim().slice(0, 60);

  if (displayName.length < 2 || displayName.length > 40) {
    return jsonError("Display name must be 2–40 characters");
  }

  const db = getDb();
  db.prepare(
    `UPDATE users SET display_name = ?, bio = ?, forest_name = ? WHERE id = ?`
  ).run(displayName, bio, forestName, user.id);

  return NextResponse.json({
    user: { ...user, displayName, bio, forestName },
  });
}
