import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import {
  createVideo,
  createVideoFromLink,
  deleteVideo,
  getChannelById,
  getVideoById,
  listVideosForChannel,
  renameVideo,
  resolveTvUpload,
} from "@/lib/tvCorner";
import { parseDurationMinutesInput } from "@/lib/tvLinks";
import { correctVideoDurationMs } from "@/lib/tvSchedule";
import {
  redirectSameHost,
  wantsHtmlRedirect,
} from "@/lib/requestBody";
import type { UserPublic } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 1800; // long movie uploads

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

function nextPathFrom(raw: string | undefined) {
  const nextRaw = String(raw || "/tv-corner");
  return nextRaw.startsWith("/") && !nextRaw.startsWith("//")
    ? nextRaw
    : "/tv-corner";
}

function performVideoDelete(id: string, user: UserPublic) {
  const result = deleteVideo(id, user);
  if (!result.ok) {
    return { error: String(result.error || "Could not remove video") };
  }
  if (result.isFile) {
    const filePath = path.join(UPLOAD_DIR, result.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  return { ok: true as const };
}

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
  if (!user) {
    if (wantsHtmlRedirect(req)) return redirectSameHost(req, "/login");
    return jsonError("Not signed in", 401);
  }
  if (!user.isOwner) {
    return jsonError("Only the site owner can upload channel videos", 403);
  }

  const contentType = (req.headers.get("content-type") || "").toLowerCase();

  // Progressive-enhancement remove (HTML form POST — no React required).
  // Use urlencoded forms so this never collides with multipart uploads.
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData().catch(() => null);
    if (form && String(form.get("intent") || "") === "remove") {
      const id = String(form.get("id") || "").trim();
      const removed = performVideoDelete(id, user);
      if ("error" in removed) {
        return jsonError(String(removed.error || "Could not remove video"), 403);
      }
      if (wantsHtmlRedirect(req)) {
        return redirectSameHost(
          req,
          nextPathFrom(String(form.get("next") || ""))
        );
      }
      return NextResponse.json({ ok: true });
    }
  }

  // Add-by-link: JSON body with a YouTube or direct video URL.
  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => null)) as {
      intent?: string;
      id?: string;
      channelId?: string;
      sourceUrl?: string;
      title?: string;
      durationMinutes?: number | string;
    } | null;
    if (body?.intent === "remove") {
      const id = String(body.id || "").trim();
      const removed = performVideoDelete(id, user);
      if ("error" in removed) {
        return jsonError(String(removed.error || "Could not remove video"), 403);
      }
      return NextResponse.json({ ok: true });
    }
    if (!body?.channelId) {
      return jsonError("Create a channel first, then add a link to it");
    }
    const channel = getChannelById(String(body.channelId).trim());
    if (!channel) {
      return jsonError("Create a channel first, then add a link to it");
    }
    const result = createVideoFromLink({
      sourceUrl: String(body.sourceUrl || ""),
      title: typeof body.title === "string" ? body.title : "",
      durationMs: parseDurationMinutesInput(body.durationMinutes),
      uploaderId: user.id,
      villageId: channel.villageId,
      channelId: channel.id,
    });
    if (!result.ok) return jsonError(result.error);
    return NextResponse.json({
      video: result.video,
      channel: getChannelById(channel.id),
    });
  }

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

  const body = (await req.json().catch(() => null)) as {
    id?: string;
    title?: string;
    durationMs?: number;
    currentPositionMs?: number;
    force?: boolean;
  } | null;
  if (!body?.id) return jsonError("Missing clip id");

  // Any signed-in villager can report the real runtime so the guide can
  // advance when a clip finishes sooner than its catalog estimate.
  if (body.durationMs != null) {
    const durationMs = Number(body.durationMs);
    if (!Number.isFinite(durationMs) || durationMs < 1000) {
      return jsonError("That runtime does not look valid");
    }
    const result = correctVideoDurationMs(body.id, durationMs, {
      currentPositionMs:
        body.currentPositionMs != null
          ? Number(body.currentPositionMs)
          : undefined,
      force: Boolean(body.force),
    });
    if (!result.ok) return jsonError(result.error, 404);
    return NextResponse.json({
      ok: true,
      changed: result.changed,
      durationMs: result.durationMs,
      video: getVideoById(body.id),
    });
  }

  if (!user.isOwner) {
    return jsonError("Only the site owner can rename clips", 403);
  }
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

  const removed = performVideoDelete(body.id, user);
  if ("error" in removed) {
        return jsonError(String(removed.error || "Could not remove video"), 403);
      }

  return NextResponse.json({ ok: true });
}
