import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError, mapUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, username, display_name, bio, forest_name, created_at
       FROM users
       WHERE id != ?
         AND (
           username LIKE ? COLLATE NOCASE
           OR display_name LIKE ? COLLATE NOCASE
         )
       ORDER BY username COLLATE NOCASE
       LIMIT 20`
    )
    .all(user.id, `%${q}%`, `%${q}%`) as Array<{
    id: string;
    username: string;
    display_name: string;
    bio: string;
    forest_name: string;
    created_at: string;
  }>;

  return NextResponse.json({ users: rows.map(mapUser) });
}
