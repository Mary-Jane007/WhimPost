import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { toggleMeetingBenchRsvp } from "@/lib/meetingBench";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const body = (await req.json().catch(() => null)) as {
    itemId?: string;
  } | null;
  const itemId = String(body?.itemId || "").trim();
  if (!itemId) return jsonError("Missing gathering id");

  const result = toggleMeetingBenchRsvp(itemId, user.id);
  if (!result.ok) return jsonError(result.error);
  return NextResponse.json({ item: result.item });
}
