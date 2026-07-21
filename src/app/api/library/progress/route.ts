import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import type { UserPublic } from "@/lib/types";
import {
  applyLibraryAction,
  getLibraryProgress,
  type LibraryAction,
} from "@/lib/library";

async function requireLibraryUser(): Promise<
  { user: UserPublic } | { error: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) return { error: jsonError("Not signed in", 401) };
  if (user.villageId !== "mosshollow") {
    return {
      error: jsonError(
        "The Grand Library is only for Mosshollow villagers",
        403
      ),
    };
  }
  return { user };
}

export async function GET() {
  const gate = await requireLibraryUser();
  if ("error" in gate) return gate.error;
  return NextResponse.json({ progress: getLibraryProgress(gate.user.id) });
}

export async function POST(req: NextRequest) {
  const gate = await requireLibraryUser();
  if ("error" in gate) return gate.error;

  const body = (await req.json().catch(() => null)) as LibraryAction | null;
  if (!body || !body.type) {
    return jsonError("Expected a library action");
  }

  const progress = applyLibraryAction(gate.user.id, body);
  return NextResponse.json({ progress });
}
