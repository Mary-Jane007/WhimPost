import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { createUploadSession, TV_CHUNK_SIZE } from "@/lib/tvUpload";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  if (!user.isOwner) {
    return jsonError("Only the site owner can upload channel videos", 403);
  }

  const body = (await req.json().catch(() => null)) as {
    channelId?: string;
    title?: string;
    filename?: string;
    mime?: string;
    size?: number;
  } | null;

  if (!body?.channelId || !body.filename || !body.size) {
    return jsonError("Missing upload details (channel, filename, size)");
  }

  const result = createUploadSession({
    channelId: String(body.channelId).trim(),
    title: String(body.title || "").trim(),
    filename: String(body.filename).trim(),
    mime: String(body.mime || "").trim(),
    size: Number(body.size) || 0,
    uploaderId: user.id,
    villageId: user.villageId,
  });

  if (!result.ok) return jsonError(result.error);

  return NextResponse.json({
    uploadId: result.meta.id,
    chunkSize: result.meta.chunkSize || TV_CHUNK_SIZE,
    chunkCount: result.meta.chunkCount,
  });
}
