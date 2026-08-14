import fs from "fs";

/**
 * Tiny leaf helpers — keep this file free of app imports.
 * (Importing these via tvUploadFiles can break under Turbopack production
 * bundles when that module sits in a circular graph.)
 */

const MIN_PLAYABLE_BYTES = 8_192;

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
    return fs.statSync(filePath).size >= MIN_PLAYABLE_BYTES;
  } catch {
    return false;
  }
}
