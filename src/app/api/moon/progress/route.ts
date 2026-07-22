import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import type { UserPublic } from "@/lib/types";
import {
  applyMoonAction,
  getMoonProgress,
  type MoonAction,
} from "@/lib/moon";

async function requireMoonUser(): Promise<
  { user: UserPublic } | { error: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) return { error: jsonError("Not signed in", 401) };
  if (user.villageId !== "moonmere") {
    return {
      error: jsonError(
        "The Observatory is only for Moonmere villagers",
        403
      ),
    };
  }
  return { user };
}

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

  const progress = applyMoonAction(gate.user.id, body);
  return NextResponse.json({ progress });
}
