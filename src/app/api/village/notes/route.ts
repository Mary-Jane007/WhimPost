import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError, mapUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

function mapNote(r: {
  id: string;
  body: string;
  anonymous: number;
  image_url: string | null;
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
}) {
  return {
    id: r.id,
    body: r.body,
    anonymous: Boolean(r.anonymous),
    imageUrl: r.image_url || null,
    createdAt: r.created_at,
    author: r.anonymous
      ? null
      : mapUser({
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
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  if (!user.villageId) return jsonError("Join a village first", 400);

  const db = getDb();
  const rows = db
    .prepare(
      `SELECT n.id, n.body, n.anonymous, n.image_url, n.created_at,
              u.id as uid, u.username, u.display_name, u.bio, u.forest_name,
              u.created_at as ucreated, u.is_owner, u.village_id, u.reputation
       FROM village_notes n
       JOIN users u ON u.id = n.author_id
       WHERE n.village_id = ?
       ORDER BY n.created_at DESC
       LIMIT 40`
    )
    .all(user.villageId) as Array<{
    id: string;
    body: string;
    anonymous: number;
    image_url: string | null;
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
    notes: rows.map(mapNote),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  if (!user.villageId) return jsonError("Join a village first", 400);

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body");

  const text = String(body.body || "").trim().slice(0, 280);
  const anonymous = Boolean(body.anonymous);
  const imageUrl =
    typeof body.imageUrl === "string" && body.imageUrl.startsWith("/api/uploads/")
      ? body.imageUrl.slice(0, 240)
      : null;
  if (text.length < 2 && !imageUrl) {
    return jsonError("Write a little something for the board");
  }

  const db = getDb();
  const id = uuidv4();
  db.prepare(
    `INSERT INTO village_notes (id, village_id, author_id, body, anonymous, image_url)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    user.villageId,
    user.id,
    text || "A workshop share for the village square.",
    anonymous ? 1 : 0,
    imageUrl
  );

  return NextResponse.json({ ok: true, id });
}
