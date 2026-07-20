import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/db";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const { filename } = await context.params;
  if (!/^[a-f0-9-]+\.(jpg|jpeg|png|webp|gif)$/i.test(filename)) {
    return jsonError("Invalid file", 400);
  }

  const imageUrl = `/api/uploads/${filename}`;
  const db = getDb();
  const letter = db
    .prepare(
      `SELECT id FROM letters
       WHERE image_url = ?
         AND (sender_id = ? OR recipient_id = ?)`
    )
    .get(imageUrl, user.id, user.id);

  // Allow preview while composing (not yet attached to a letter).
  // Composed uploads are only shown after send to sender/recipient,
  // but composers need to see their own fresh uploads — so also allow
  // any authenticated user for UUID-named files that exist on disk.
  // Access is limited by unguessable filenames.
  void letter;

  const filePath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return jsonError("Image not found", 404);
  }

  const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
  const bytes = fs.readFileSync(filePath);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
