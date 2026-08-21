import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isSiteOwner } from "@/lib/owner";
import { VILLAGES, isVillageId, type CollectibleKind } from "@/lib/villages";
import {
  assertVillageHubPair,
  collectibleOptionsForVillage,
  createVillageTask,
  deleteVillageTask,
  isVillageHubId,
  listVillageTasks,
  updateVillageTask,
  VILLAGE_HUBS,
  VILLAGE_TO_HUB,
  type VillageHubId,
} from "@/lib/villageTasks";

async function requireOwner() {
  const user = await getCurrentUser();
  if (!user) return { error: jsonError("Not signed in", 401) };
  const db = getDb();
  if (!user.isOwner && !isSiteOwner(db, user.id)) {
    return {
      error: jsonError("Only the site owner can manage village tasks.", 403),
    };
  }
  return { user, db };
}

function villageOptions() {
  return VILLAGES.map((v) => ({
    id: v.id,
    name: v.name,
    hub: VILLAGE_TO_HUB[v.id],
    hubLabel: VILLAGE_HUBS[VILLAGE_TO_HUB[v.id]].label,
  }));
}

export async function GET(req: NextRequest) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;

  const villageId = req.nextUrl.searchParams.get("villageId");
  const hubParam = req.nextUrl.searchParams.get("hub");

  if (villageId && !isVillageId(villageId)) {
    return jsonError("Unknown village.", 400);
  }
  if (hubParam && !isVillageHubId(hubParam)) {
    return jsonError("Unknown hub.", 400);
  }

  const hub = (hubParam as VillageHubId | null) || undefined;
  const tasks = listVillageTasks(auth.db, {
    villageId: villageId && isVillageId(villageId) ? villageId : undefined,
    hub,
    includeInactive: true,
  });

  const collectibles =
    villageId && isVillageId(villageId)
      ? collectibleOptionsForVillage(villageId)
      : [];

  return NextResponse.json({
    tasks,
    villages: villageOptions(),
    hubs: Object.entries(VILLAGE_HUBS).map(([id, meta]) => ({
      id,
      label: meta.label,
      villageId: meta.villageId,
    })),
    collectibles,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const villageId = typeof body?.villageId === "string" ? body.villageId : "";
  const hubRaw = typeof body?.hub === "string" ? body.hub : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const detail = typeof body?.detail === "string" ? body.detail.trim() : "";
  const rewards = Array.isArray(body?.rewards)
    ? (body.rewards as CollectibleKind[])
    : [];
  const sortOrder =
    typeof body?.sortOrder === "number" ? body.sortOrder : undefined;

  const pair =
    assertVillageHubPair(villageId, hubRaw) ||
    (isVillageId(villageId)
      ? { villageId, hub: VILLAGE_TO_HUB[villageId] }
      : null);

  if (!pair) {
    return jsonError("Choose a valid village (and matching hub).", 400);
  }
  if (!title) return jsonError("Give the task a title.", 400);
  if (title.length > 120) {
    return jsonError("Title is a bit long — keep it under 120 characters.", 400);
  }
  if (detail.length > 2000) {
    return jsonError("Task details are too long.", 400);
  }
  if (rewards.length === 0) {
    return jsonError("Pick at least one collectible reward.", 400);
  }

  try {
    const task = createVillageTask(auth.db, {
      villageId: pair.villageId,
      hub: pair.hub,
      title,
      detail,
      rewards,
      sortOrder,
      createdBy: auth.user.id,
    });
    return NextResponse.json({ ok: true, task });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not create task.";
    return jsonError(message, 400);
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const taskId = typeof body?.id === "string" ? body.id : "";
  if (!taskId) return jsonError("Missing task id.", 400);

  try {
    const task = updateVillageTask(auth.db, taskId, {
      title: typeof body?.title === "string" ? body.title : undefined,
      detail: typeof body?.detail === "string" ? body.detail : undefined,
      rewards: Array.isArray(body?.rewards)
        ? (body.rewards as CollectibleKind[])
        : undefined,
      sortOrder:
        typeof body?.sortOrder === "number" ? body.sortOrder : undefined,
      active: typeof body?.active === "boolean" ? body.active : undefined,
    });
    if (!task) return jsonError("Task not found.", 404);
    return NextResponse.json({ ok: true, task });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not update task.";
    return jsonError(message, 400);
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const taskId =
    typeof body?.id === "string"
      ? body.id
      : req.nextUrl.searchParams.get("id") || "";
  if (!taskId) return jsonError("Missing task id.", 400);

  const ok = deleteVillageTask(auth.db, taskId);
  if (!ok) return jsonError("Task not found.", 404);
  return NextResponse.json({ ok: true });
}
