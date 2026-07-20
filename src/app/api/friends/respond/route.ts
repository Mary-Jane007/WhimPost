import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body");

  const requestId = String(body.requestId || "");
  const action = String(body.action || "");
  if (!requestId || !["accept", "decline"].includes(action)) {
    return jsonError("requestId and action (accept|decline) are required");
  }

  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, addressee_id, status FROM friendships WHERE id = ?`
    )
    .get(requestId) as
    | { id: string; addressee_id: string; status: string }
    | undefined;

  if (!row || row.addressee_id !== user.id) {
    return jsonError("Friend request not found", 404);
  }
  if (row.status !== "pending") {
    return jsonError("This request is no longer pending");
  }

  db.prepare(`UPDATE friendships SET status = ? WHERE id = ?`).run(
    action === "accept" ? "accepted" : "declined",
    requestId
  );

  return NextResponse.json({ ok: true });
}
