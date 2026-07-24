import { compareSync } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import {
  attachSessionCookie,
  createSessionToken,
  jsonError,
  mapUser,
} from "@/lib/auth";
import { getDb } from "@/lib/db";
import { claimOwnerIfUnset } from "@/lib/owner";
import { exportPersistentAccounts } from "@/lib/persistentAccounts";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body");

  const login = String(body.login || "").trim();
  const password = String(body.password || "");
  if (!login || !password) return jsonError("Login and password are required");

  const db = getDb();
  const loginKey = login.toLowerCase();
  const row = db
    .prepare(
      `SELECT id, username, display_name, bio, forest_name, created_at, password_hash, email, is_owner,
              village_id, reputation
       FROM users
       WHERE username = ? COLLATE NOCASE
          OR email = ? COLLATE NOCASE
          OR display_name = ? COLLATE NOCASE`
    )
    .get(login, loginKey, login) as
    | {
        id: string;
        username: string;
        display_name: string;
        bio: string;
        forest_name: string;
        created_at: string;
        password_hash: string;
        email: string;
        is_owner: number;
        village_id: string | null;
        reputation: number;
      }
    | undefined;

  if (!row || !compareSync(password, row.password_hash)) {
    return jsonError("Those credentials don't match any forest mailbox", 401);
  }

  // The account you sign in with becomes the remembered site owner
  // when no owner has been claimed yet.
  const becameOwner = claimOwnerIfUnset(db, row.id);
  if (becameOwner && !row.is_owner) {
    exportPersistentAccounts(db);
  }
  const refreshed = db
    .prepare(
      `SELECT id, username, display_name, bio, forest_name, created_at, is_owner,
              village_id, reputation
       FROM users WHERE id = ?`
    )
    .get(row.id) as {
    id: string;
    username: string;
    display_name: string;
    bio: string;
    forest_name: string;
    created_at: string;
    is_owner: number;
    village_id: string | null;
    reputation: number;
  };

  const token = await createSessionToken({
    userId: refreshed.id,
    username: refreshed.username,
  });

  // Set-Cookie on the response itself — more reliable than cookies().set() alone
  // when the browser immediately navigates after fetch().
  const res = NextResponse.json({ user: mapUser(refreshed) });
  await attachSessionCookie(res, token);
  return res;
}
