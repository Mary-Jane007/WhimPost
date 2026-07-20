import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body");

  const username = String(body.username || "").trim();
  if (!username) return jsonError("Username is required");

  const db = getDb();
  const target = db
    .prepare(`SELECT id, username FROM users WHERE username = ? COLLATE NOCASE`)
    .get(username) as { id: string; username: string } | undefined;

  if (!target) return jsonError("No woodland writer found with that name", 404);
  if (target.id === user.id) return jsonError("You cannot befriend yourself");

  const existing = db
    .prepare(
      `SELECT id, status, requester_id, addressee_id FROM friendships
       WHERE (requester_id = ? AND addressee_id = ?)
          OR (requester_id = ? AND addressee_id = ?)`
    )
    .get(user.id, target.id, target.id, user.id) as
    | {
        id: string;
        status: string;
        requester_id: string;
        addressee_id: string;
      }
    | undefined;

  if (existing?.status === "accepted") {
    return jsonError("You are already friends", 409);
  }
  if (existing?.status === "pending") {
    return jsonError("A friend request is already pending", 409);
  }

  if (existing?.status === "declined") {
    db.prepare(
      `UPDATE friendships SET status = 'pending', requester_id = ?, addressee_id = ?, created_at = datetime('now') WHERE id = ?`
    ).run(user.id, target.id, existing.id);
    return NextResponse.json({ ok: true, id: existing.id });
  }

  const id = uuidv4();
  db.prepare(
    `INSERT INTO friendships (id, requester_id, addressee_id, status)
     VALUES (?, ?, ?, 'pending')`
  ).run(id, user.id, target.id);

  return NextResponse.json({ ok: true, id });
}
