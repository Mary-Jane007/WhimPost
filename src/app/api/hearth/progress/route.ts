import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import type { UserPublic } from "@/lib/types";
import {
  applyHearthAction,
  getHearthProgress,
  type HearthAction,
} from "@/lib/hearth";
import { chronicleAfterActivity } from "@/lib/chronicle";
import type { ChronicleActivityKey } from "@/lib/chronicleContent";

async function requireHearthUser(): Promise<
  { user: UserPublic } | { error: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) return { error: jsonError("Not signed in", 401) };
  if (user.villageId !== "hearthwick") {
    return {
      error: jsonError(
        "The Fireside is only for Hearthwick villagers",
        403
      ),
    };
  }
  return { user };
}

const HEARTH_KEYS: Partial<Record<HearthAction["type"], ChronicleActivityKey>> =
  {
    completeRitual: "hearth.completeRitual",
    leaveNote: "hearth.leaveNote",
    toggleRecipeFavorite: "hearth.toggleRecipeFavorite",
  };

export async function GET() {
  const gate = await requireHearthUser();
  if ("error" in gate) return gate.error;
  return NextResponse.json({ progress: getHearthProgress(gate.user.id) });
}

export async function POST(req: NextRequest) {
  const gate = await requireHearthUser();
  if ("error" in gate) return gate.error;

  const body = (await req.json().catch(() => null)) as HearthAction | null;
  if (!body || !body.type) {
    return jsonError("Expected a fireside action");
  }

  const progress = applyHearthAction(gate.user.id, body);
  const key = HEARTH_KEYS[body.type];
  const chronicleUnlock = key
    ? chronicleAfterActivity(gate.user.id, gate.user.villageId, key)
    : null;
  return NextResponse.json({ progress, chronicleUnlock });
}
