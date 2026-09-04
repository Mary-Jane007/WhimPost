import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import type { UserPublic } from "@/lib/types";
import {
  applyWorkshopAction,
  craftCompletionPayload,
  diyCompletionPayload,
  expeditionCompletionPayload,
  getWorkshopProgress,
  promptCompletionPayload,
  recipeCompletionPayload,
  skillCompletionPayload,
  type WorkshopAction,
} from "@/lib/workshop";
import { chronicleAfterActivity } from "@/lib/chronicle";
import type { ChronicleActivityKey } from "@/lib/chronicleContent";
import { canAccessVillageWorkshop } from "@/lib/villages";

async function requireWorkshopUser(): Promise<
  { user: UserPublic } | { error: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) return { error: jsonError("Not signed in", 401) };
  if (!canAccessVillageWorkshop(user, "bramblewood")) {
    return {
      error: jsonError(
        "The Bramblewood Workshop is only for Bramblewood villagers — visitors cannot participate",
        403
      ),
    };
  }
  return { user };
}

export async function GET() {
  const gate = await requireWorkshopUser();
  if ("error" in gate) return gate.error;
  return NextResponse.json({ progress: getWorkshopProgress(gate.user.id) });
}

export async function POST(req: NextRequest) {
  const gate = await requireWorkshopUser();
  if ("error" in gate) return gate.error;

  const body = (await req.json().catch(() => null)) as
    | (Partial<WorkshopAction> & {
        type?: string;
        completeKind?:
          | "craft"
          | "recipe"
          | "prompt"
          | "diy"
          | "skill"
          | "expedition";
        id?: string;
        photoUrl?: string;
      })
    | null;

  if (!body || !body.type) {
    return jsonError("Expected a workshop action");
  }

  let action: WorkshopAction;

  if (body.type === "complete" && body.completeKind) {
    if (body.completeKind === "craft" && body.id) {
      action = craftCompletionPayload(body.id, body.photoUrl);
    } else if (body.completeKind === "recipe" && body.id) {
      action = recipeCompletionPayload(body.id, body.photoUrl);
    } else if (body.completeKind === "prompt" && body.id) {
      action = promptCompletionPayload(body.id, body.photoUrl);
    } else if (body.completeKind === "diy" && body.id) {
      action = diyCompletionPayload(body.id, body.photoUrl);
    } else if (body.completeKind === "skill" && body.id) {
      action = skillCompletionPayload(body.id);
    } else if (body.completeKind === "expedition" && body.id) {
      action = expeditionCompletionPayload(body.id, body.photoUrl);
    } else {
      return jsonError("Unknown completion kind");
    }
  } else {
    action = body as WorkshopAction;
  }

  const { progress, grantedCollectibles } = applyWorkshopAction(
    gate.user.id,
    action
  );

  let key: ChronicleActivityKey | null = null;
  if (action.type === "complete") key = "workshop.complete";
  else if (action.type === "journalEntry") key = "workshop.journalEntry";
  else if (action.type === "bird" || action.type === "wildlife") {
    key = "workshop.bird";
  }

  const chronicleUnlock = key
    ? chronicleAfterActivity(gate.user.id, gate.user.villageId, key)
    : null;

  return NextResponse.json({ progress, grantedCollectibles, chronicleUnlock });
}
