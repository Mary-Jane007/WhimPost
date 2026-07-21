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
  webm: "video/webm",
  mov: "video/quicktime",
};

const RANGE_CHUNK = 2 * 1024 * 1024; // 2MB preferred range slices

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

  if (start === undefined && end === undefined) {
    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(stat.size),
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=86400",
      },
    });
  }

  const chunkSize = to - from + 1;
  return new NextResponse(webStream, {
    status: 206,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(chunkSize),
      "Content-Range": `bytes ${from}-${to}/${stat.size}`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=86400",
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
  if (!/^[a-f0-9-]+\.(jpg|jpeg|png|webp|gif|mp4|webm|mov)$/i.test(filename)) {
    return jsonError("Invalid file", 400);
  }

  const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
  const isVideo = ext === "mp4" || ext === "webm" || ext === "mov";

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
    const end = match[2]
      ? Number(match[2])
      : Math.min(start + RANGE_CHUNK - 1, stat.size - 1);
    if (
      Number.isNaN(start) ||
      Number.isNaN(end) ||
      start >= stat.size ||
      end >= stat.size ||
      start > end
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
