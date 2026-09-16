import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  addVillageNoteComment,
  deleteOwnVillageNote,
  deleteOwnVillageNoteComment,
  listVillageNotes,
  toggleVillageNoteLike,
} from "@/lib/villageNotes";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  if (!user.villageId) return jsonError("Join a village first", 400);

  const db = getDb();
  return NextResponse.json({
    notes: listVillageNotes(db, user.villageId, user.id),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  if (!user.villageId) return jsonError("Join a village first", 400);

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body");

  const action = typeof body.action === "string" ? body.action : "create";
  const db = getDb();

  if (action === "like") {
    const noteId = String(body.noteId || "").trim();
    if (!noteId) return jsonError("Missing note");
    const result = toggleVillageNoteLike(
      db,
      noteId,
      user.id,
      user.villageId
    );
    if (!result.ok) return jsonError(result.error, result.status);
    return NextResponse.json(result);
  }

  if (action === "comment") {
    const noteId = String(body.noteId || "").trim();
    if (!noteId) return jsonError("Missing note");
    const result = addVillageNoteComment(
      db,
      noteId,
      user.id,
      user.villageId,
      String(body.body || "")
    );
    if (!result.ok) return jsonError(result.error, result.status);
    return NextResponse.json(result);
  }

  if (action === "deleteComment") {
    const commentId = String(body.commentId || "").trim();
    if (!commentId) return jsonError("Missing comment");
    const result = deleteOwnVillageNoteComment(
      db,
      commentId,
      user.id,
      user.villageId
    );
    if (!result.ok) return jsonError(result.error, result.status);
    return NextResponse.json({ ok: true });
  }

  const text = String(body.body || "").trim().slice(0, 280);
  const anonymous = Boolean(body.anonymous);
  const imageUrl =
    typeof body.imageUrl === "string" && body.imageUrl.startsWith("/api/uploads/")
      ? body.imageUrl.slice(0, 240)
      : null;
  if (text.length < 2 && !imageUrl) {
    return jsonError("Write a little something for the board");
  }

  const id = uuidv4();
  db.prepare(
    `INSERT INTO village_notes (id, village_id, author_id, body, anonymous, image_url)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    user.villageId,
    user.id,
    text || "A workshop share for the village square.",
    anonymous ? 1 : 0,
    imageUrl
  );

  return NextResponse.json({
    ok: true,
    id,
    notes: listVillageNotes(db, user.villageId, user.id),
  });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  if (!user.villageId) return jsonError("Join a village first", 400);

  const body = await req.json().catch(() => null);
  const noteId =
    (typeof body?.noteId === "string" && body.noteId.trim()) ||
    new URL(req.url).searchParams.get("noteId") ||
    "";
  if (!noteId) return jsonError("Missing note");

  const db = getDb();
  const result = deleteOwnVillageNote(db, noteId, user.id, user.villageId);
  if (!result.ok) return jsonError(result.error, result.status);

  return NextResponse.json({
    ok: true,
    notes: listVillageNotes(db, user.villageId, user.id),
  });
}
