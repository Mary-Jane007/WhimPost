import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { toLetterView } from "@/lib/letters";
import type { LetterRecord } from "@/lib/types";
import { markLetterRead } from "@/lib/welcomeLetters";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const { id } = await context.params;
  const db = getDb();
  const row = db.prepare(`SELECT * FROM letters WHERE id = ?`).get(id) as
    | LetterRecord
    | undefined;

  if (!row) return jsonError("Letter not found", 404);
  if (row.sender_id !== user.id && row.recipient_id !== user.id) {
    return jsonError("This letter is not for you", 403);
  }

  if (row.recipient_id === user.id && !row.is_read) {
    db.prepare(`UPDATE letters SET is_read = 1 WHERE id = ?`).run(id);
    row.is_read = 1;
  }

  const letter = toLetterView(row);
  if (!letter) return jsonError("Letter not found", 404);
  return NextResponse.json({ letter });
}

export async function PATCH(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const { id } = await context.params;
  const db = getDb();
  const row = db
    .prepare(`SELECT id, recipient_id FROM letters WHERE id = ?`)
    .get(id) as { id: string; recipient_id: string } | undefined;

  if (!row) return jsonError("Letter not found", 404);
  if (row.recipient_id !== user.id) {
    return jsonError("This letter is not for you", 403);
  }

  markLetterRead(db, id, user.id);
  return NextResponse.json({ ok: true });
}
