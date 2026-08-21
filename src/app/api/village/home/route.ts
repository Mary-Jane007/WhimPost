import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError, mapUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { exportPersistentAccounts } from "@/lib/persistentAccounts";
import { isVillageId } from "@/lib/villages";
import { deliverWelcomeLetter } from "@/lib/welcomeLetters";
import { trackAnalyticsEvent } from "@/lib/analytics/track";

/**
 * Update permanent home village (quiz retake / set belonging).
 * Also moves the villager there so they wake up at their new home.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const body = await req.json().catch(() => null);
  const villageId = String(body?.villageId || "").trim();
  if (!isVillageId(villageId)) {
    return jsonError("Please choose a village to call home");
  }

  const db = getDb();
  db.prepare(
    `UPDATE users SET home_village_id = ?, village_id = ? WHERE id = ?`
  ).run(villageId, villageId, user.id);

  deliverWelcomeLetter(db, user.id, villageId);
  exportPersistentAccounts(db);
  trackAnalyticsEvent({
    event: "home_village_set",
    userId: user.id,
    villageId,
    path: "/village",
  });

  const row = db
    .prepare(
      `SELECT id, username, display_name, bio, forest_name, created_at, is_owner,
              village_id, home_village_id, reputation
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
    village_id: string | null;
    home_village_id: string | null;
    reputation: number;
  };

  return NextResponse.json({ user: mapUser(row) });
}
