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
  pdf: "application/pdf",
  epub: "application/epub+zip",
};

// Larger slices cut down on stalled mid-file seeks for long cottage cartoons.
const RANGE_CHUNK = 16 * 1024 * 1024;

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
  // Client aborts (seek / tab close) must not crash the process.
  stream.on("error", () => {
    try {
      stream.destroy();
    } catch {
      // ignore
    }
  });
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
  if (!/^[a-f0-9-]+\.(jpg|jpeg|png|webp|gif|mp4|webm|mov|m4v|avi|mpg|mpeg|mkv|pdf|epub)$/i.test(filename)) {
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
  const isBook = ext === "pdf" || ext === "epub";

  if (isVideo) {
    const video = getVideoByFilename(filename);
    if (!video || !canAccessVideo(user, video)) {
      return jsonError("Clip not found", 404);
    }
  } else if (isBook) {
    const db = getDb();
    const bookUrl = `/api/uploads/${filename}`;
    const book = db
      .prepare(
        `SELECT id FROM library_books
         WHERE file_url = ? AND published = 1`
      )
      .get(bookUrl);
    if (!book && !user.isOwner) {
      return jsonError("Book not found", 404);
    }
  } else {
    // Letter attachments, library covers, and other signed-in image assets.
    const imageUrl = `/api/uploads/${filename}`;
    const db = getDb();
    const libraryCover = db
      .prepare(
        `SELECT id FROM library_books
         WHERE cover_url = ? AND published = 1`
      )
      .get(imageUrl);
    if (!libraryCover) {
      const letter = db
        .prepare(
          `SELECT id FROM letters
           WHERE image_url = ?
             AND (sender_id = ? OR recipient_id = ?)`
        )
        .get(imageUrl, user.id, user.id);
      void letter;
    }
  }

  const filePath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return jsonError(
      isVideo ? "Clip not found" : isBook ? "Book not found" : "Image not found",
      404
    );
  }

  const stat = fs.statSync(filePath);
  const contentType = MIME[ext] || "application/octet-stream";

  if (!isVideo) {
    const bytes = fs.readFileSync(filePath);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=86400",
        ...(isBook
          ? {
              "Content-Disposition": `inline; filename="${filename}"`,
            }
          : {}),
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
