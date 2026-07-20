import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError, mapUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isVillageId } from "@/lib/villages";
import { deliverWelcomeLetter } from "@/lib/welcomeLetters";

/** Join or switch village (for accounts created before villages existed). */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body");
  const villageId = String(body.villageId || "");
  if (!isVillageId(villageId)) return jsonError("Unknown village");

  const db = getDb();
  db.prepare(`UPDATE users SET village_id = ? WHERE id = ?`).run(
    villageId,
    user.id
  );
  deliverWelcomeLetter(db, user.id, villageId);

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

  return NextResponse.json({ user: mapUser(row) });
}
