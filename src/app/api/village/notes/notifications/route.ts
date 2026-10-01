import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  listVillageNoteNotifications,
  markVillageNoteNotificationsRead,
} from "@/lib/villageNotes";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  if (!user.villageId) return jsonError("Join a village first", 400);

  const db = getDb();
  const notifications = listVillageNoteNotifications(db, user.id);
  return NextResponse.json({
    notifications,
    unread: notifications.filter((n) => !n.isRead).length,
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const body = await req.json().catch(() => null);
  const ids = Array.isArray(body?.ids)
    ? body.ids.filter((id: unknown): id is string => typeof id === "string")
    : undefined;

  const db = getDb();
  markVillageNoteNotificationsRead(db, user.id, ids);
  return NextResponse.json({
    ok: true,
    notifications: listVillageNoteNotifications(db, user.id),
  });
}
