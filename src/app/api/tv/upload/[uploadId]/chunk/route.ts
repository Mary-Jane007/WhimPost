import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { readUploadMeta, saveChunk } from "@/lib/tvUpload";

export const runtime = "nodejs";
export const maxDuration = 600;

type Ctx = { params: Promise<{ uploadId: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  if (!user.isOwner) {
    return jsonError("Only the site owner can upload channel videos", 403);
  }

  const { uploadId } = await ctx.params;
  const meta = readUploadMeta(uploadId);
  if (!meta) return jsonError("Upload session expired — try again", 404);
  if (meta.uploaderId !== user.id) {
    return jsonError("Not your upload session", 403);
  }

  const index = Number(
    req.nextUrl.searchParams.get("index") ||
      req.headers.get("x-chunk-index") ||
      ""
  );
  if (!Number.isInteger(index) || index < 0) {
    return jsonError("Missing chunk index");
  }

  const buf = Buffer.from(await req.arrayBuffer());
  const result = saveChunk(uploadId, index, buf);
  if (!result.ok) {
    return jsonError(result.error, result.status || 400);
  }

  return NextResponse.json({
    ok: true,
    index,
    received: result.meta.received.length,
    chunkCount: result.meta.chunkCount,
  });
}
