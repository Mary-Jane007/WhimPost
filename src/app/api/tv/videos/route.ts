import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import {
  createVideo,
  deleteVideo,
  getChannelById,
  listVideosForChannel,
  resolveTvUpload,
} from "@/lib/tvCorner";

export const runtime = "nodejs";
export const maxDuration = 1800; // long movie uploads

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

async function saveUploadStream(file: File, destPath: string) {
  const webStream = file.stream();
  const nodeStream = Readable.fromWeb(
    webStream as unknown as import("stream/web").ReadableStream
  );
  await pipeline(nodeStream, fs.createWriteStream(destPath));
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const channelId = req.nextUrl.searchParams.get("channelId");
  if (!channelId) return jsonError("Missing channelId");

  const channel = getChannelById(channelId);
  if (!channel) return jsonError("Channel not found", 404);

  return NextResponse.json({
    videos: listVideosForChannel(channelId),
    channel,
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
  const channel = getChannelById(channelId);
  if (!channel) {
    return jsonError("Create a channel first, then upload videos to it");
  }

  const file = form.get("video");
  if (!(file instanceof File)) {
    return jsonError("Choose a cozy clip or movie for this channel");
  }

  const resolved = resolveTvUpload(file);
  if (!resolved.ok) return jsonError(resolved.error);

  const titleRaw = String(form.get("title") || "").trim();
  const title =
    titleRaw.slice(0, 80) ||
    file.name.replace(/\.[^.]+$/, "").slice(0, 80) ||
    "Untitled clip";

  const ext = resolved.ext;
  ensureUploadDir();
  const filename = `${randomUUID()}.${ext}`;
  const destPath = path.join(UPLOAD_DIR, filename);

  try {
    await saveUploadStream(file, destPath);
  } catch {
    if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
    return jsonError("Could not save that upload — try again", 500);
  }

  const sizeBytes = fs.existsSync(destPath)
    ? fs.statSync(destPath).size
    : file.size;

  if (sizeBytes <= 0) {
    if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
    return jsonError("That upload arrived empty");
  }

  const video = createVideo({
    title,
    filename,
    mime: resolved.mime,
    sizeBytes,
    uploaderId: user.id,
    villageId: channel.villageId,
    channelId: channel.id,
  });

  return NextResponse.json({
    video,
    channel: getChannelById(channel.id),
  });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  if (!user.isOwner) {
    return jsonError("Only the site owner can remove clips", 403);
  }

  const body = (await req.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) return jsonError("Missing clip id");

  const result = deleteVideo(body.id, user);
  if (!result.ok) return jsonError(result.error, 403);

  const filePath = path.join(UPLOAD_DIR, result.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return NextResponse.json({ ok: true });
}
