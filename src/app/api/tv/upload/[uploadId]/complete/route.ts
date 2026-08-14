import { NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { listChannelsForUser } from "@/lib/tvCorner";
import { completeUploadSession } from "@/lib/tvUpload";

export const runtime = "nodejs";
export const maxDuration = 600;

type Ctx = { params: Promise<{ uploadId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  if (!user.isOwner) {
    return jsonError("Only the site owner can upload channel videos", 403);
  }

  const { uploadId } = await ctx.params;
  const result = completeUploadSession(uploadId, user.id);
  if (!result.ok) {
    return jsonError(result.error, result.status || 400);
  }

  return NextResponse.json({
    video: result.video,
    channel: result.channel,
    channels: listChannelsForUser(user),
  });
}
