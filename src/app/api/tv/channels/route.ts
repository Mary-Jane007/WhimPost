import { NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";

/**
 * Channels were removed in the TV Corner fresh start (back to the first
 * flat clip-shelf design). Kept as an empty stub so old clients fail softly.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  return NextResponse.json({ channels: [] });
}

export async function POST() {
  return jsonError(
    "Channels are gone — upload clips to the shelf on TV Corner",
    410
  );
}

export async function DELETE() {
  return jsonError("Channels are gone", 410);
}
