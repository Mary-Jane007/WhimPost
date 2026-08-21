import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isVillageId, type VillageId } from "@/lib/villages";
import {
  assertVillageHubPair,
  completeVillageTask,
  isVillageHubId,
  listVillageTasksForUser,
  VILLAGE_HUBS,
  VILLAGE_TO_HUB,
  type VillageHubId,
} from "@/lib/villageTasks";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const villageId = req.nextUrl.searchParams.get("villageId");
  const hubParam = req.nextUrl.searchParams.get("hub");

  let pair =
    villageId && hubParam
      ? assertVillageHubPair(villageId, hubParam)
      : null;

  if (!pair && villageId && isVillageId(villageId)) {
    pair = { villageId, hub: VILLAGE_TO_HUB[villageId] };
  }
  if (!pair && hubParam && isVillageHubId(hubParam)) {
    pair = {
      villageId: VILLAGE_HUBS[hubParam as VillageHubId].villageId,
      hub: hubParam as VillageHubId,
    };
  }

  if (!pair) {
    return jsonError("Choose a village hub.", 400);
  }

  const db = getDb();
  const tasks = listVillageTasksForUser(db, user.id, pair);
  return NextResponse.json({
    villageId: pair.villageId,
    hub: pair.hub,
    tasks,
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const body = await req.json().catch(() => null);
  const taskId = typeof body?.taskId === "string" ? body.taskId : "";
  if (!taskId) return jsonError("Missing task id.", 400);

  const db = getDb();
  const homeVillageId = (user.homeVillageId ||
    user.villageId ||
    null) as VillageId | null;

  const result = completeVillageTask(db, user.id, taskId, homeVillageId);
  if (!result.ok) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({
    ok: true,
    task: result.task,
    granted: result.granted,
    reputationGained: result.reputationGained,
  });
}
