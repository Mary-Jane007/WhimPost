import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  readRequestFields,
  redirectSameHost,
  wantsHtmlRedirect,
} from "@/lib/requestBody";
import { rewardWelcome } from "@/lib/villageProgress";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    if (wantsHtmlRedirect(req)) return redirectSameHost(req, "/login");
    return jsonError("Not signed in", 401);
  }

  const fields = await readRequestFields(req);
  const requestId = String(fields.requestId || "");
  const action = String(fields.action || "");
  if (!requestId || !["accept", "decline"].includes(action)) {
    return jsonError("requestId and action (accept|decline) are required");
  }

  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, requester_id, addressee_id, status FROM friendships WHERE id = ?`
    )
    .get(requestId) as
    | {
        id: string;
        requester_id: string;
        addressee_id: string;
        status: string;
      }
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

  if (action === "accept") {
    rewardWelcome(db, user.id);
  }

  if (wantsHtmlRedirect(req)) {
    const nextRaw = fields.next || "/friends";
    const next =
      nextRaw.startsWith("/") && !nextRaw.startsWith("//")
        ? nextRaw
        : "/friends";
    return redirectSameHost(req, next);
  }
  return NextResponse.json({ ok: true });
}
