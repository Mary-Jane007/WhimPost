import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import type { UserPublic } from "@/lib/types";
import {
  applyMoonAction,
  getMoonProgress,
  type MoonAction,
} from "@/lib/moon";
import { chronicleAfterActivity } from "@/lib/chronicle";
import type { ChronicleActivityKey } from "@/lib/chronicleContent";
import { canAccessVillageWorkshop } from "@/lib/villages";

async function requireMoonUser(): Promise<
  { user: UserPublic } | { error: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) return { error: jsonError("Not signed in", 401) };
  if (!canAccessVillageWorkshop(user, "moonmere")) {
    return {
      error: jsonError(
        "The Observatory is only for Moonmere villagers — visitors cannot participate",
        403
      ),
    };
  }
  return { user };
}

const MOON_KEYS: Partial<Record<MoonAction["type"], ChronicleActivityKey>> = {
  completeRitual: "moon.completeRitual",
  saveJournal: "moon.saveJournal",
  submitDream: "moon.submitDream",
};

export async function GET() {
  const gate = await requireMoonUser();
  if ("error" in gate) return gate.error;
  return NextResponse.json({ progress: getMoonProgress(gate.user.id) });
}

export async function POST(req: NextRequest) {
  const gate = await requireMoonUser();
  if ("error" in gate) return gate.error;

  const body = (await req.json().catch(() => null)) as MoonAction | null;
  if (!body || !body.type) {
    return jsonError("Expected an observatory action");
  }

  const { progress, grantedCollectibles } = applyMoonAction(
    gate.user.id,
    body
  );
  const key = MOON_KEYS[body.type];
  const chronicleUnlock = key
    ? chronicleAfterActivity(gate.user.id, gate.user.villageId, key)
    : null;
  return NextResponse.json({ progress, grantedCollectibles, chronicleUnlock });
}
