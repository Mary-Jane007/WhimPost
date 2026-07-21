import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { postChatMessage } from "@/lib/tvCorner";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const { id } = await context.params;
  const body = (await req.json().catch(() => null)) as { body?: string } | null;
  if (!body || typeof body.body !== "string") {
    return jsonError("Expected a chat message");
  }

  const result = postChatMessage(id, user, body.body);
  if (!result.ok) return jsonError(result.error, result.status);
  return NextResponse.json({ room: result.room });
}
