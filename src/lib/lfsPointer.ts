import fs from "fs";
import path from "path";

/**
 * Tiny leaf helpers — keep this file free of app imports.
 * (Importing these via tvUploadFiles can break under Turbopack production
 * bundles when that module sits in a circular graph.)
 */

const MIN_VIDEO_BYTES = 8_192;
const MIN_IMAGE_BYTES = 32;
const MIN_DOC_BYTES = 256;

/** Minimum credible byte size for a playable file of this name. */
export function minPlayableBytes(filePath: string) {
  const ext = path.extname(filePath || "").toLowerCase();
  if (/\.(jpe?g|png|webp|gif)$/.test(ext)) return MIN_IMAGE_BYTES;
  if (/\.(pdf|epub)$/.test(ext)) return MIN_DOC_BYTES;
  if (/\.(mp3|wav|ogg|m4a|aac)$/.test(ext)) return MIN_DOC_BYTES;
  return MIN_VIDEO_BYTES;
}

/** True when the path is a Git LFS pointer stub instead of real bytes. */
export function isLfsPointerFile(filePath: string) {
  if (!filePath || typeof filePath !== "string") return false;
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 1024) return false;
    const head = fs.readFileSync(filePath, "utf8");
    return head.startsWith("version https://git-lfs.github.com/spec/v1");
  } catch {
    return false;
  }
}

/** True when the path exists and holds playable (non-pointer) media bytes. */
export function isPlayableMediaFile(filePath: string) {
  if (!filePath || typeof filePath !== "string") return false;
  try {
    if (!fs.existsSync(filePath)) return false;
    if (isLfsPointerFile(filePath)) return false;
    return fs.statSync(filePath).size >= minPlayableBytes(filePath);
  } catch {
    return false;
  }
}
