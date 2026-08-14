import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import {
  TV_ALLOWED_MIME,
  TV_MAX_BYTES,
  TV_MIME_EXT,
  createVideo,
  deleteVideo,
  getChannelById,
  listChannelsForUser,
  listVideosForUser,
} from "@/lib/tvCorner";
import { redirectSameHost, wantsHtmlRedirect } from "@/lib/requestBody";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  return NextResponse.json({
    videos: listVideosForUser(user),
    channels: listChannelsForUser(user),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  if (!user.isOwner) {
    return jsonError("Only the site owner can upload channel videos", 403);
  }

  const form = await req.formData().catch(() => null);
  if (!form) return jsonError("Expected multipart form data");

  const channelId = String(form.get("channelId") || "").trim();
  if (!channelId) return jsonError("Pick a channel for this clip");
  const channel = getChannelById(channelId);
  if (!channel) return jsonError("Channel not found", 404);

  const file = form.get("video");
  if (!(file instanceof File)) {
    return jsonError("Choose a cozy clip to tuck onto the shelf");
  }
  if (!TV_ALLOWED_MIME.has(file.type)) {
    return jsonError("Use an MP4, WebM, or MOV video");
  }
  if (file.size > TV_MAX_BYTES) {
    return jsonError("Clips must be under 500MB");
  }

  const titleRaw = String(form.get("title") || "").trim();
  const title =
    titleRaw.slice(0, 80) ||
    file.name.replace(/\.[^.]+$/, "").slice(0, 80) ||
    "Untitled reel";

  const ext = TV_MIME_EXT[file.type] || "mp4";
  ensureUploadDir();
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);

  const video = createVideo({
    title,
    filename,
    mime: file.type,
    sizeBytes: file.size,
    uploaderId: user.id,
    villageId: channel.isGlobal ? null : channel.villageId,
    channelId: channel.id,
  });

  const nextRaw = String(form.get("next") || "/tv-corner");
  const next =
    nextRaw.startsWith("/") && !nextRaw.startsWith("//")
      ? nextRaw
      : "/tv-corner";

  if (wantsHtmlRedirect(req)) {
    return redirectSameHost(
      req,
      `${next}?tuned=${encodeURIComponent(channel.id)}`
    );
  }

  return NextResponse.json({
    video,
    channels: listChannelsForUser(user),
  });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) return jsonError("Missing clip id");

  const result = deleteVideo(body.id, user);
  if (!result.ok) return jsonError(result.error, 403);

  const filePath = path.join(UPLOAD_DIR, result.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return NextResponse.json({
    ok: true,
    channels: listChannelsForUser(user),
  });
}
