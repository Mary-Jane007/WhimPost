import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import type { UserPublic } from "@/lib/types";
import {
  applyGardenAction,
  getGardenProgress,
  type GardenAction,
} from "@/lib/garden";
import { chronicleAfterActivity } from "@/lib/chronicle";
import type { ChronicleActivityKey } from "@/lib/chronicleContent";
import { canAccessVillageWorkshop } from "@/lib/villages";

async function requireGardenUser(): Promise<
  { user: UserPublic } | { error: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) return { error: jsonError("Not signed in", 401) };
  if (!canAccessVillageWorkshop(user, "clovermeadow")) {
    return {
      error: jsonError(
        "The Bloomkeeper's Garden is only for Clovermeadow villagers — visitors cannot participate",
        403
      ),
    };
  }
  return { user };
}

const GARDEN_KEYS: Partial<Record<GardenAction["type"], ChronicleActivityKey>> =
  {
    completeDaily: "garden.completeDaily",
    spotFlower: "garden.spotFlower",
    completeKindness: "garden.completeKindness",
  };

export async function GET() {
  const gate = await requireGardenUser();
  if ("error" in gate) return gate.error;
  return NextResponse.json({ progress: getGardenProgress(gate.user.id) });
}

export async function POST(req: NextRequest) {
  const gate = await requireGardenUser();
  if ("error" in gate) return gate.error;

  const body = (await req.json().catch(() => null)) as GardenAction | null;
  if (!body || !body.type) {
    return jsonError("Expected a garden action");
  }

  const progress = applyGardenAction(gate.user.id, body);
  const key = GARDEN_KEYS[body.type];
  const chronicleUnlock = key
    ? chronicleAfterActivity(gate.user.id, gate.user.villageId, key)
    : null;
  return NextResponse.json({ progress, chronicleUnlock });
}
