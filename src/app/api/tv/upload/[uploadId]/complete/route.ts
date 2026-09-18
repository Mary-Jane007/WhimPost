import { NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { listChannelsForUser } from "@/lib/tvCorner";
import { completeUploadSession } from "@/lib/tvUpload";
import { durableSealTvMedia } from "@/lib/tvPersist";

export const runtime = "nodejs";
export const maxDuration = 1800; // assemble multi-GB chunked movies

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

  // Wait for release shelf + catalog git flush so the clip cannot vanish
  // after logout, exit, or an idle server restart.
  const filename = result.video.url.replace(/^\/api\/uploads\//, "");
  let durable: Awaited<ReturnType<typeof durableSealTvMedia>> | null = null;
  try {
    durable = await durableSealTvMedia([filename]);
    if (!durable.ok) {
      console.error(
        "[tv upload] durable seal incomplete for",
        filename,
        durable
      );
    }
  } catch (err) {
    console.error("[tv upload] durable seal failed:", err);
  }

  return NextResponse.json({
    video: result.video,
    channel: result.channel,
    channels: listChannelsForUser(user),
    durable: durable
      ? {
          ok: durable.ok,
          published: durable.publish.uploaded,
          committed: durable.flush.committed,
          pushed: durable.flush.pushed,
        }
      : { ok: false },
  });
}
