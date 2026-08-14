import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { toLetterView } from "@/lib/letters";
import {
  readRequestFields,
  redirectSameHost,
  wantsHtmlRedirect,
} from "@/lib/requestBody";
import type { LetterRecord } from "@/lib/types";
import { markLetterRead } from "@/lib/welcomeLetters";
import { trackAnalyticsEvent } from "@/lib/analytics/track";

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
    markLetterRead(db, id, user.id);
    row.is_read = 1;
    trackAnalyticsEvent({
      event: "letter_opened",
      userId: user.id,
      villageId: user.villageId || null,
      path: `/inbox`,
    });
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

/** Form fallback for “Tuck into my inbox” when the client never hydrates. */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    if (wantsHtmlRedirect(req)) return redirectSameHost(req, "/login");
    return jsonError("Not signed in", 401);
  }

  const { id } = await context.params;
  const fields = await readRequestFields(req);
  const db = getDb();
  const row = db
    .prepare(`SELECT id, recipient_id FROM letters WHERE id = ?`)
    .get(id) as { id: string; recipient_id: string } | undefined;

  if (!row) return jsonError("Letter not found", 404);
  if (row.recipient_id !== user.id) {
    return jsonError("This letter is not for you", 403);
  }

  markLetterRead(db, id, user.id);

  if (wantsHtmlRedirect(req)) {
    const nextRaw = fields.next || "/village";
    const next =
      nextRaw.startsWith("/") && !nextRaw.startsWith("//")
        ? nextRaw
        : "/village";
    return redirectSameHost(req, next);
  }
  return NextResponse.json({ ok: true });
}
