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
  renameVideo,
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

function decodeHeader(value: string | null) {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function safeBasename(name: string) {
  return path.basename(name).replace(/[/\\]/g, "").slice(0, 180);
}

async function saveUploadStream(
  webStream: ReadableStream<Uint8Array>,
  destPath: string
) {
  const nodeStream = Readable.fromWeb(
    webStream as unknown as import("stream/web").ReadableStream
  );
  await pipeline(nodeStream, fs.createWriteStream(destPath));
}

async function finalizeVideo(opts: {
  title: string;
  filename: string;
  mime: string;
  destPath: string;
  expectedSize?: number;
  uploaderId: string;
  villageId: string | null;
  channelId: string;
}): Promise<
  | { video: NonNullable<ReturnType<typeof createVideo>>; channel: ReturnType<typeof getChannelById> }
  | { error: string; status: number }
> {
  const sizeBytes = fs.existsSync(opts.destPath)
    ? fs.statSync(opts.destPath).size
    : 0;

  if (sizeBytes <= 0) {
    if (fs.existsSync(opts.destPath)) fs.unlinkSync(opts.destPath);
    return { error: "That upload arrived empty", status: 400 };
  }

  if (
    typeof opts.expectedSize === "number" &&
    opts.expectedSize > 0 &&
    sizeBytes < Math.min(opts.expectedSize, opts.expectedSize * 0.98)
  ) {
    if (fs.existsSync(opts.destPath)) fs.unlinkSync(opts.destPath);
    return {
      error:
        "Upload was cut off before it finished — try again (keep this tab open)",
      status: 400,
    };
  }

  const video = createVideo({
    title: opts.title,
    filename: opts.filename,
    mime: opts.mime,
    sizeBytes,
    uploaderId: opts.uploaderId,
    villageId: opts.villageId,
    channelId: opts.channelId,
  });

  return {
    video,
    channel: getChannelById(opts.channelId),
  };
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

  const contentType = (req.headers.get("content-type") || "").toLowerCase();

  // Preferred path: raw binary body (streams to disk, works better for large movies).
  if (!contentType.includes("multipart/form-data")) {
    const channelId = String(
      decodeHeader(req.headers.get("x-tv-channel-id")) ||
        req.nextUrl.searchParams.get("channelId") ||
        ""
    ).trim();
    const channel = getChannelById(channelId);
    if (!channel) {
      return jsonError("Create a channel first, then upload videos to it");
    }

    const originalName = safeBasename(
      decodeHeader(req.headers.get("x-tv-filename")) ||
        decodeHeader(req.headers.get("x-file-name")) ||
        "clip.mp4"
    );
    const titleRaw = decodeHeader(req.headers.get("x-tv-title")).trim();
    const declaredSize = Number(req.headers.get("content-length") || 0);

    const resolved = resolveTvUpload({
      name: originalName,
      type: contentType.split(";")[0].trim(),
      size: declaredSize > 0 ? declaredSize : 1,
    });
    if (!resolved.ok) return jsonError(resolved.error);

    if (!req.body) {
      return jsonError("Upload body was empty");
    }

    ensureUploadDir();
    const filename = `${randomUUID()}.${resolved.ext}`;
    const destPath = path.join(UPLOAD_DIR, filename);

    try {
      await saveUploadStream(req.body, destPath);
    } catch (err) {
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      console.error("[tv upload] stream failed", err);
      return jsonError("Could not save that upload — try again", 500);
    }

    const title =
      titleRaw.slice(0, 80) ||
      originalName.replace(/\.[^.]+$/, "").slice(0, 80) ||
      "Untitled clip";

    const result = await finalizeVideo({
      title,
      filename,
      mime: resolved.mime,
      destPath,
      expectedSize: declaredSize > 0 ? declaredSize : undefined,
      uploaderId: user.id,
      villageId: channel.villageId,
      channelId: channel.id,
    });

    if ("error" in result) {
      return jsonError(result.error, result.status);
    }

    return NextResponse.json(result);
  }

  // Legacy multipart FormData path (still supported).
  const form = await req.formData().catch((err) => {
    console.error("[tv upload] formData failed", err);
    return null;
  });
  if (!form) {
    return jsonError(
      "Upload did not arrive intact — try again, or use a smaller file first"
    );
  }

  const channelId = String(form.get("channelId") || "").trim();
  const channel = getChannelById(channelId);
  if (!channel) {
    return jsonError("Create a channel first, then upload videos to it");
  }

  const file = form.get("video");
  // Next/undici may give a Blob that isn't `instanceof File`.
  const isBlob =
    file !== null &&
    typeof file === "object" &&
    typeof (file as Blob).arrayBuffer === "function" &&
    typeof (file as Blob).size === "number";
  if (!isBlob || typeof file === "string") {
    return jsonError("Choose a cozy clip or movie for this channel");
  }
  const blob = file as Blob & { name?: string; type: string };
  const originalName =
    typeof blob.name === "string" && blob.name
      ? blob.name
      : "clip.mp4";

  const resolved = resolveTvUpload({
    name: originalName,
    type: blob.type || "",
    size: blob.size,
  });
  if (!resolved.ok) return jsonError(resolved.error);

  const titleRaw = String(form.get("title") || "").trim();
  const title =
    titleRaw.slice(0, 80) ||
    originalName.replace(/\.[^.]+$/, "").slice(0, 80) ||
    "Untitled clip";

  const ext = resolved.ext;
  ensureUploadDir();
  const filename = `${randomUUID()}.${ext}`;
  const destPath = path.join(UPLOAD_DIR, filename);

  try {
    await saveUploadStream(blob.stream(), destPath);
  } catch (err) {
    if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
    console.error("[tv upload] save failed", err);
    return jsonError("Could not save that upload — try again", 500);
  }

  const result = await finalizeVideo({
    title,
    filename,
    mime: resolved.mime,
    destPath,
    expectedSize: blob.size > 0 ? blob.size : undefined,
    uploaderId: user.id,
    villageId: channel.villageId,
    channelId: channel.id,
  });

  if ("error" in result) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);
  if (!user.isOwner) {
    return jsonError("Only the site owner can rename clips", 403);
  }

  const body = (await req.json().catch(() => null)) as {
    id?: string;
    title?: string;
  } | null;
  if (!body?.id) return jsonError("Missing clip id");
  if (typeof body.title !== "string") return jsonError("Missing new title");

  const result = renameVideo(body.id, body.title, user);
  if (!result.ok) return jsonError(result.error, 400);

  return NextResponse.json({
    video: result.video,
    channel: result.channel,
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
