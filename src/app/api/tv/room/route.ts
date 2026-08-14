import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import {
  createFriendsRoom,
  getOrCreateVillageRoom,
  getRoomById,
  listChannelsForUser,
  listFriendRooms,
  listVideosForUser,
  touchPresence,
  canAccessRoom,
} from "@/lib/tvCorner";
import type { VillageId } from "@/lib/villages";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const scope = req.nextUrl.searchParams.get("scope") || "village";
  const roomId = req.nextUrl.searchParams.get("roomId");
  const channels = listChannelsForUser(user);
  const videos = listVideosForUser(user);

  if (roomId) {
    const room = getRoomById(roomId);
    if (!room) return jsonError("Room not found", 404);
    if (!canAccessRoom(user, room)) {
      return jsonError("This couch is for other villagers", 403);
    }
    touchPresence(room.id, user.id);
    return NextResponse.json({
      room: getRoomById(room.id),
      videos,
      channels,
      friendRooms: room.scope === "friends" ? listFriendRooms(user) : [],
    });
  }

  if (scope === "friends") {
    const friendRooms = listFriendRooms(user);
    const active = friendRooms[0] || null;
    if (active) touchPresence(active.id, user.id);
    return NextResponse.json({
      room: active ? getRoomById(active.id) : null,
      videos,
      channels,
      friendRooms,
    });
  }

  if (!user.villageId) {
    return jsonError("Join a village before visiting the TV lounge", 400);
  }

  const room = getOrCreateVillageRoom(user, user.villageId as VillageId);
  return NextResponse.json({
    room,
    videos,
    channels,
    friendRooms: [],
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const body = (await req.json().catch(() => null)) as {
    scope?: string;
    title?: string;
  } | null;

  if (!body || body.scope !== "friends") {
    return jsonError("Start a friends couch with scope: friends");
  }

  const room = createFriendsRoom(user, body.title);
  return NextResponse.json({
    room,
    videos: listVideosForUser(user),
    channels: listChannelsForUser(user),
    friendRooms: listFriendRooms(user),
  });
}
