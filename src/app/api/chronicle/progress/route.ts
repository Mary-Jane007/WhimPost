import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { getChronicleProgress } from "@/lib/chronicle";
import { isVillageId } from "@/lib/villages";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const villageId =
    req.nextUrl.searchParams.get("villageId") || user.villageId;
  if (!villageId || !isVillageId(villageId)) {
    return jsonError("Join a village to open The Lost Chronicles");
  }
  if (user.villageId !== villageId && !user.isOwner) {
    return jsonError("That Chronicle belongs to another village", 403);
  }

  return NextResponse.json({
    progress: getChronicleProgress(user.id, villageId),
  });
}
