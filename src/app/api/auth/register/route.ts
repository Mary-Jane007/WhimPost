import { hashSync } from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, jsonError, mapUser, setSessionCookie } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { claimOwnerIfUnset } from "@/lib/owner";
import { exportPersistentAccounts } from "@/lib/persistentAccounts";
import { isVillageId } from "@/lib/villages";
import {
  deliverWelcomeLetter,
  isSystemUsername,
} from "@/lib/welcomeLetters";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body");

  const username = String(body.username || "").trim();
  const displayName = String(body.displayName || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const forestName = String(body.forestName || "").trim();
  const villageId = String(body.villageId || "").trim();

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    return jsonError("Username must be 3–24 letters, numbers, or underscores");
  }
  if (isSystemUsername(username)) {
    return jsonError("That username is reserved by the forest", 409);
  }
  if (displayName.length < 2 || displayName.length > 40) {
    return jsonError("Display name must be 2–40 characters");
  }
  if (!email.includes("@") || email.length > 120) {
    return jsonError("Please enter a valid email");
  }
  if (password.length < 6) {
    return jsonError("Password must be at least 6 characters");
  }
  if (!isVillageId(villageId)) {
    return jsonError("Please choose a village to call home");
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM users WHERE username = ? OR email = ?")
    .get(username, email);
  if (existing) {
    return jsonError("That username or email is already taken", 409);
  }

  const id = uuidv4();
  db.prepare(
    `INSERT INTO users (
      id, username, display_name, email, password_hash, forest_name,
      is_owner, village_id, reputation, collectibles_json
    ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, 0, '{}')`
  ).run(
    id,
    username,
    displayName,
    email,
    hashSync(password, 10),
    forestName,
    villageId
  );

  claimOwnerIfUnset(db, id);
  deliverWelcomeLetter(db, id, villageId);
  exportPersistentAccounts(db);

  const user = db
    .prepare(
      `SELECT id, username, display_name, bio, forest_name, created_at, is_owner,
              village_id, reputation
       FROM users WHERE id = ?`
    )
    .get(id) as {
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

  const token = await createSessionToken({ userId: id, username });
  await setSessionCookie(token);

  return NextResponse.json({ user: mapUser(user) });
}
