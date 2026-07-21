import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import {
  createFriendsRoom,
  getOrCreateVillageRoom,
  getRoomById,
  listFriendRooms,
  listChannelsForUser,
  touchPresence,
  canAccessRoom,
} from "@/lib/tvCorner";
import type { VillageId } from "@/lib/villages";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const scope = req.nextUrl.searchParams.get("scope") || "village";
  const roomId = req.nextUrl.searchParams.get("roomId");

  if (roomId) {
    const room = getRoomById(roomId);
    if (!room) return jsonError("Room not found", 404);
    if (!canAccessRoom(user, room)) {
      return jsonError("This couch is for other villagers", 403);
    }
    touchPresence(room.id, user.id);
    const fresh = getRoomById(room.id)!;
    return NextResponse.json({
      room: fresh,
      channels: listChannelsForUser(user, fresh),
      friendRooms: room.scope === "friends" ? listFriendRooms(user) : [],
    });
  }

  if (scope === "friends") {
    const friendRooms = listFriendRooms(user);
    const active = friendRooms[0] || null;
    if (active) touchPresence(active.id, user.id);
    const room = active ? getRoomById(active.id) : null;
    return NextResponse.json({
      room,
      channels: listChannelsForUser(user, room),
      friendRooms,
    });
  }

  if (!user.villageId) {
    return jsonError("Join a village before visiting the TV lounge", 400);
  }

  const room = getOrCreateVillageRoom(user, user.villageId as VillageId);
  return NextResponse.json({
    room,
    channels: listChannelsForUser(user, room),
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

  if (!user.villageId) {
    return jsonError("Join a village before starting a friends couch", 400);
  }

  const room = createFriendsRoom(user, body.title);
  return NextResponse.json({
    room,
    channels: listChannelsForUser(user, room),
    friendRooms: listFriendRooms(user),
  });
}
