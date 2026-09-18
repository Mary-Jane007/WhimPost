import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isVillageId, type VillageId, VILLAGES } from "@/lib/villages";
import {
  WORKSHOP_ACCESS_MODES,
  listActivityAccess,
  listWorkshopAccessSettings,
  setWorkshopAccessMode,
  upsertActivityAccess,
  type WorkshopAccessMode,
} from "@/lib/workshopAccess";

function requireOwner() {
  return getCurrentUser().then((user) => {
    if (!user) return { error: jsonError("Not signed in", 401) } as const;
    if (!user.isOwner) {
      return {
        error: jsonError("Only the site owner can manage workshop access", 403),
      } as const;
    }
    return { user } as const;
  });
}

function isMode(raw: unknown): raw is WorkshopAccessMode {
  return (
    typeof raw === "string" &&
    (WORKSHOP_ACCESS_MODES as string[]).includes(raw)
  );
}

export async function GET() {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  getDb();
  const workshops = listWorkshopAccessSettings();
  const activitiesByVillage: Partial<
    Record<VillageId, ReturnType<typeof listActivityAccess>>
  > = {};
  for (const v of VILLAGES) {
    activitiesByVillage[v.id] = listActivityAccess(v.id);
  }
  return NextResponse.json({ workshops, activitiesByVillage });
}

/** Update workshop-level access / temporary event window. */
export async function PUT(req: NextRequest) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const villageId = String(body?.villageId || "").trim();
  if (!isVillageId(villageId)) return jsonError("Unknown village");
  if (!isMode(body?.accessMode)) return jsonError("Invalid access mode");

  const eventAccessMode = body?.clearEvent
    ? null
    : body?.eventAccessMode == null || body?.eventAccessMode === ""
      ? null
      : isMode(body.eventAccessMode)
        ? body.eventAccessMode
        : undefined;

  if (eventAccessMode === undefined && body?.eventAccessMode) {
    return jsonError("Invalid event access mode");
  }

  const workshop = setWorkshopAccessMode(villageId, body.accessMode, {
    updatedBy: auth.user.id,
    eventAccessMode:
      body?.clearEvent ? null : (eventAccessMode as WorkshopAccessMode | null),
    eventStartsAt: body?.clearEvent ? null : body?.eventStartsAt ?? undefined,
    eventEndsAt: body?.clearEvent ? null : body?.eventEndsAt ?? undefined,
    clearEvent: Boolean(body?.clearEvent),
  });

  return NextResponse.json({ workshop });
}

/** Upsert a per-activity access override (incl. cross-village). */
export async function POST(req: NextRequest) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const villageId = String(body?.villageId || "").trim();
  const activityKey = String(body?.activityKey || "").trim();
  if (!isVillageId(villageId)) return jsonError("Unknown village");
  if (!activityKey) return jsonError("Activity key required");
  if (!isMode(body?.accessMode)) return jsonError("Invalid access mode");

  const activity = upsertActivityAccess(villageId, activityKey, {
    label: String(body?.label || activityKey),
    accessMode: body.accessMode,
    isCrossVillage: Boolean(body?.isCrossVillage),
  });

  return NextResponse.json({ activity });
}
