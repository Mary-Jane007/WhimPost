import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import {
  canAccessRoom,
  getRoomById,
  listVideosForUser,
  touchPresence,
  updateRoomPlayback,
} from "@/lib/tvCorner";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const { id } = await context.params;
  const room = getRoomById(id);
  if (!room) return jsonError("Room not found", 404);
  if (!canAccessRoom(user, room)) {
    return jsonError("This couch is for other villagers", 403);
  }

  touchPresence(id, user.id);
  const fresh = getRoomById(id)!;
  return NextResponse.json({
    room: fresh,
    videos: listVideosForUser(user, fresh),
  });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const { id } = await context.params;
  const body = (await req.json().catch(() => null)) as {
    videoId?: string | null;
    isPlaying?: boolean;
    positionMs?: number;
    title?: string;
  } | null;

  if (!body) return jsonError("Expected JSON body");

  const result = updateRoomPlayback(id, user, body);
  if (!result.ok) {
    return jsonError(result.error, result.status);
  }
  return NextResponse.json({
    room: result.room,
    videos: listVideosForUser(user, result.room),
  });
}
