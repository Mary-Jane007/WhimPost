import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError, mapUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { exportPersistentAccounts } from "@/lib/persistentAccounts";
import {
  normalizeVillagerCharacter,
  serializeVillagerCharacter,
} from "@/lib/villageCharacters";
import type { VillageId } from "@/lib/villages";

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to customize your character", 401);

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body");

  const homeVillageId = (user.homeVillageId || user.villageId) as VillageId | null;
  if (!homeVillageId) {
    return jsonError("Choose a home village before picking a character");
  }

  const character = normalizeVillagerCharacter(
    body.character ?? body,
    homeVillageId
  );
  if (!character) {
    return jsonError("That character does not belong to your village");
  }

  const db = getDb();
  db.prepare(`UPDATE users SET character_json = ? WHERE id = ?`).run(
    serializeVillagerCharacter(character),
    user.id
  );
  exportPersistentAccounts(db);

  const row = db
    .prepare(
      `SELECT id, username, display_name, bio, forest_name, created_at, is_owner,
              village_id, home_village_id, reputation, character_json
       FROM users WHERE id = ?`
    )
    .get(user.id);

  return NextResponse.json({
    user: mapUser(row as Parameters<typeof mapUser>[0]),
    character,
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to view your character", 401);
  return NextResponse.json({
    characterJson: user.characterJson,
    villageId: user.homeVillageId || user.villageId,
  });
}
