import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { MOON_SOUND_DIR } from "@/lib/moon";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  webm: "audio/webm",
  m4a: "audio/mp4",
  aac: "audio/aac",
};

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const { filename } = await context.params;
  if (!/^[a-f0-9-]+\.(mp3|wav|ogg|webm|m4a|aac)$/i.test(filename)) {
    return jsonError("Invalid file", 400);
  }

  const db = getDb();
  const row = db
    .prepare(`SELECT playlist_id FROM moon_playlist_sounds WHERE filename = ?`)
    .get(filename) as { playlist_id: string } | undefined;
  if (!row) return jsonError("Sound not found", 404);

  const filePath = path.join(MOON_SOUND_DIR, filename);
  if (!fs.existsSync(filePath)) return jsonError("Sound not found", 404);

  const ext = filename.split(".").pop()?.toLowerCase() || "mp3";
  const contentType = MIME[ext] || "application/octet-stream";
  const stream = fs.createReadStream(filePath);
  const webStream = Readable.toWeb(stream) as unknown as ReadableStream;
  const stat = fs.statSync(filePath);

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(stat.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
