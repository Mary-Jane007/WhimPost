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

  // Visitors may read public Chronicle leaves of the village they are exploring.
  // Home villagers may always open their own Chronicle even while away.
  const home = user.homeVillageId || user.villageId;
  const visiting = user.villageId;
  const allowed =
    user.isOwner ||
    visiting === villageId ||
    home === villageId;
  if (!allowed) {
    return jsonError(
      "Visit that village square to explore its Chronicle",
      403
    );
  }

  return NextResponse.json({
    progress: getChronicleProgress(user.id, villageId, {
      id: user.id,
      isOwner: user.isOwner,
      homeVillageId: user.homeVillageId,
      villageId: user.villageId,
    }),
  });
}
