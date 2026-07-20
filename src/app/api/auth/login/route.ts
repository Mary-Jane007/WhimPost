import { compareSync } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, jsonError, mapUser, setSessionCookie } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body");

  const login = String(body.login || "").trim();
  const password = String(body.password || "");
  if (!login || !password) return jsonError("Login and password are required");

  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, username, display_name, bio, forest_name, created_at, password_hash, email
       FROM users
       WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE`
    )
    .get(login, login.toLowerCase()) as
    | {
        id: string;
        username: string;
        display_name: string;
        bio: string;
        forest_name: string;
        created_at: string;
        password_hash: string;
        email: string;
      }
    | undefined;

  if (!row || !compareSync(password, row.password_hash)) {
    return jsonError("Those credentials don't match any forest mailbox", 401);
  }

  const token = await createSessionToken({
    userId: row.id,
    username: row.username,
  });
  await setSessionCookie(token);

  return NextResponse.json({ user: mapUser(row) });
}
