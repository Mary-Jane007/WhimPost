import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { canAccessVideo, getVideoByFilename } from "@/lib/tvCorner";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  m4v: "video/x-m4v",
  webm: "video/webm",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  mpg: "video/mpeg",
  mpeg: "video/mpeg",
  mkv: "video/x-matroska",
};

const RANGE_CHUNK = 5 * 1024 * 1024; // 5MB preferred range slices for smooth movie start

function fileStreamResponse(
  filePath: string,
  contentType: string,
  start?: number,
  end?: number
) {
  const stat = fs.statSync(filePath);
  const from = start ?? 0;
  const to = end ?? stat.size - 1;
  const stream = fs.createReadStream(filePath, { start: from, end: to });
  const webStream = Readable.toWeb(stream) as unknown as ReadableStream;

  const common = {
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=86400",
    "X-Content-Type-Options": "nosniff",
  } as Record<string, string>;

  if (start === undefined && end === undefined) {
    return new NextResponse(webStream, {
      status: 200,
      headers: {
        ...common,
        "Content-Length": String(stat.size),
      },
    });
  }

  const chunkSize = to - from + 1;
  return new NextResponse(webStream, {
    status: 206,
    headers: {
      ...common,
      "Content-Length": String(chunkSize),
      "Content-Range": `bytes ${from}-${to}/${stat.size}`,
    },
  });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const { filename } = await context.params;
  if (!/^[a-f0-9-]+\.(jpg|jpeg|png|webp|gif|mp4|webm|mov|m4v|avi|mpg|mpeg|mkv)$/i.test(filename)) {
    return jsonError("Invalid file", 400);
  }

  const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
  const isVideo = [
    "mp4",
    "webm",
    "mov",
    "m4v",
    "avi",
    "mpg",
    "mpeg",
    "mkv",
  ].includes(ext);

  if (isVideo) {
    const video = getVideoByFilename(filename);
    if (!video || !canAccessVideo(user, video)) {
      return jsonError("Clip not found", 404);
    }
  } else {
    const imageUrl = `/api/uploads/${filename}`;
    const db = getDb();
    const letter = db
      .prepare(
        `SELECT id FROM letters
         WHERE image_url = ?
           AND (sender_id = ? OR recipient_id = ?)`
      )
      .get(imageUrl, user.id, user.id);
    void letter;
  }

  const filePath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return jsonError(isVideo ? "Clip not found" : "Image not found", 404);
  }

  const stat = fs.statSync(filePath);
  const contentType = MIME[ext] || "application/octet-stream";

  if (!isVideo) {
    const bytes = fs.readFileSync(filePath);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=86400",
      },
    });
  }

  const range = req.headers.get("range");
  if (range) {
    const match = /bytes=(\d+)-(\d*)/.exec(range);
    if (!match) return jsonError("Invalid range", 416);

    const start = Number(match[1]);
    const requestedEnd = match[2] ? Number(match[2]) : NaN;
    const end = Number.isFinite(requestedEnd)
      ? Math.min(requestedEnd, stat.size - 1)
      : Math.min(start + RANGE_CHUNK - 1, stat.size - 1);
    if (
      Number.isNaN(start) ||
      Number.isNaN(end) ||
      start < 0 ||
      start >= stat.size ||
      end < start
    ) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          "Content-Range": `bytes */${stat.size}`,
        },
      });
    }

    return fileStreamResponse(filePath, contentType, start, end);
  }

  return fileStreamResponse(filePath, contentType);
}
