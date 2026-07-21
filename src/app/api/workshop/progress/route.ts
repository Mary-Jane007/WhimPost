import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import type { UserPublic } from "@/lib/types";
import {
  applyWorkshopAction,
  craftCompletionPayload,
  getWorkshopProgress,
  promptCompletionPayload,
  recipeCompletionPayload,
  type WorkshopAction,
} from "@/lib/workshop";

async function requireWorkshopUser(): Promise<
  { user: UserPublic } | { error: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) return { error: jsonError("Not signed in", 401) };
  if (user.villageId !== "bramblewood" && !user.isOwner) {
    return {
      error: jsonError(
        "The Bramblewood Workshop is for Bramblewood villagers",
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
        completeKind?: "craft" | "recipe" | "prompt";
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
    } else {
      return jsonError("Unknown completion kind");
    }
  } else {
    action = body as WorkshopAction;
  }

  const progress = applyWorkshopAction(gate.user.id, action);
  return NextResponse.json({ progress });
}
