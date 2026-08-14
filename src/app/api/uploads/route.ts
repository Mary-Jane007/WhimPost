import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { recordPersistentSiteUpload } from "@/lib/persistentSiteUploads";
import { persistAllDurableState } from "@/lib/tvPersist";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MAX_BYTES = 4 * 1024 * 1024; // 4MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Not signed in", 401);

  const form = await req.formData().catch(() => null);
  if (!form) return jsonError("Expected multipart form data");

  const file = form.get("image");
  if (!(file instanceof File)) {
    return jsonError("Choose an image to tuck into your letter");
  }
  if (!ALLOWED.has(file.type)) {
    return jsonError("Use a JPG, PNG, WebP, or GIF image");
  }
  if (file.size > MAX_BYTES) {
    return jsonError("Images must be under 4MB");
  }

  const ext =
    file.type === "image/jpeg"
      ? "jpg"
      : file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "gif";

  ensureUploadDir();
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);

  try {
    recordPersistentSiteUpload({
      filename,
      mime: file.type,
      sizeBytes: file.size,
    });
    persistAllDurableState(getDb());
  } catch (err) {
    console.error("[persistent-site-uploads] export failed:", err);
  }

  return NextResponse.json({
    url: `/api/uploads/${filename}`,
    filename,
  });
}
