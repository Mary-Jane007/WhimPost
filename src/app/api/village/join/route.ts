import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError, mapUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { exportPersistentAccounts } from "@/lib/persistentAccounts";
import {
  readRequestFields,
  redirectSameHost,
  wantsHtmlRedirect,
} from "@/lib/requestBody";
import { isVillageId } from "@/lib/villages";
import { deliverWelcomeLetter } from "@/lib/welcomeLetters";
import { trackAnalyticsEvent } from "@/lib/analytics/track";

/** Join or switch village (for accounts created before villages existed). */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    if (wantsHtmlRedirect(req)) return redirectSameHost(req, "/login");
    return jsonError("Not signed in", 401);
  }

  const fields = await readRequestFields(req);
  const villageId = String(fields.villageId || "");
  if (!isVillageId(villageId)) return jsonError("Unknown village");

  const db = getDb();
  if (user.villageId === villageId) {
    return jsonError("You're already settled in that village");
  }
  db.prepare(`UPDATE users SET village_id = ? WHERE id = ?`).run(
    villageId,
    user.id
  );
  deliverWelcomeLetter(db, user.id, villageId);
  exportPersistentAccounts(db);
  trackAnalyticsEvent({
    event: "village_joined",
    userId: user.id,
    villageId,
    path: "/village",
  });

  const row = db
    .prepare(
      `SELECT id, username, display_name, bio, forest_name, created_at, is_owner,
              village_id, reputation
       FROM users WHERE id = ?`
    )
    .get(user.id) as {
    id: string;
    username: string;
    display_name: string;
    bio: string;
    forest_name: string;
    created_at: string;
    is_owner: number;
    village_id: string;
    reputation: number;
  };

  if (wantsHtmlRedirect(req)) return redirectSameHost(req, "/village");
  return NextResponse.json({ user: mapUser(row) });
}
