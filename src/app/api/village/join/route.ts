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

type Intent = "visit" | "makeHome" | "returnHome";

function readUserRow(db: ReturnType<typeof getDb>, userId: string) {
  return db
    .prepare(
      `SELECT id, username, display_name, bio, forest_name, created_at, is_owner,
              village_id, home_village_id, reputation
       FROM users WHERE id = ?`
    )
    .get(userId) as {
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
}

/**
 * Visit another village, return home, or remake a place your permanent home.
 * Quiz belonging lives in home_village_id; village_id is where you are now.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    if (wantsHtmlRedirect(req)) return redirectSameHost(req, "/login");
    return jsonError("Not signed in", 401);
  }

  const fields = await readRequestFields(req);
  const intentRaw = String(fields.intent || fields.mode || "visit").trim();
  const intent = (
    intentRaw === "makeHome" || intentRaw === "home" || intentRaw === "move"
      ? "makeHome"
      : intentRaw === "returnHome" || intentRaw === "return"
        ? "returnHome"
        : "visit"
  ) as Intent;

  const db = getDb();
  const homeId = user.homeVillageId || user.villageId;

  let villageId = String(fields.villageId || "").trim();
  if (intent === "returnHome") {
    if (!homeId || !isVillageId(homeId)) {
      return jsonError("You don't have a home village yet");
    }
    villageId = homeId;
  } else if (!isVillageId(villageId)) {
    return jsonError("Unknown village");
  }

  if (intent === "visit") {
    if (user.villageId === villageId) {
      return jsonError("You're already in that village");
    }
    db.prepare(`UPDATE users SET village_id = ? WHERE id = ?`).run(
      villageId,
      user.id
    );
  } else if (intent === "returnHome") {
    if (user.villageId === villageId) {
      return jsonError("You're already home");
    }
    db.prepare(`UPDATE users SET village_id = ? WHERE id = ?`).run(
      villageId,
      user.id
    );
  } else {
    // makeHome — permanent belonging + move there
    db.prepare(
      `UPDATE users SET village_id = ?, home_village_id = ? WHERE id = ?`
    ).run(villageId, villageId, user.id);
  }

  deliverWelcomeLetter(db, user.id, villageId);
  exportPersistentAccounts(db);
  trackAnalyticsEvent({
    event: intent === "makeHome" ? "village_joined" : "village_visited",
    userId: user.id,
    villageId,
    path: "/village",
  });

  const row = readUserRow(db, user.id);
  if (wantsHtmlRedirect(req)) return redirectSameHost(req, "/village");
  return NextResponse.json({ user: mapUser(row), intent });
}
