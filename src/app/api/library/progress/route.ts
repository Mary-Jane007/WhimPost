import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import type { UserPublic } from "@/lib/types";
import {
  applyLibraryAction,
  getLibraryProgress,
  type LibraryAction,
} from "@/lib/library";
import { chronicleAfterActivity } from "@/lib/chronicle";
import type { ChronicleActivityKey } from "@/lib/chronicleContent";

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

const LIBRARY_KEYS: Partial<
  Record<LibraryAction["type"], ChronicleActivityKey>
> = {
  finishBook: "library.finishBook",
  solveMystery: "library.solveMystery",
  claimSecret: "library.claimSecret",
  journalEntry: "library.journalEntry",
};

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
  const key = LIBRARY_KEYS[body.type];
  const chronicleUnlock = key
    ? chronicleAfterActivity(gate.user.id, gate.user.villageId, key)
    : null;
  return NextResponse.json({ progress, chronicleUnlock });
}
