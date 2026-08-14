import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { PERSISTENT_TV_MEDIA_PATH, TV_CACHE_DIR } from "@/lib/tvMediaPaths";
import { UPLOAD_DIR } from "@/lib/uploadPaths";
import { isLfsPointerFile, isPlayableMediaFile } from "@/lib/lfsPointer";

export { UPLOAD_DIR } from "@/lib/uploadPaths";
export { isLfsPointerFile, isPlayableMediaFile } from "@/lib/lfsPointer";
export { TV_CACHE_DIR } from "@/lib/tvMediaPaths";

/**
 * Prefer a real upload; fall back to a local tv-cache stand-in when the
 * tracked file is still a Git LFS pointer (common when LFS budget is exhausted).
 */
export function resolvePlayableUploadPath(filename: string): string | null {
  const safe = path.basename(filename);
  if (!safe || safe !== filename || filename.includes("..")) return null;
  if (!UPLOAD_DIR) return null;

  const primary = path.join(UPLOAD_DIR, safe);
  if (isPlayableMediaFile(primary)) return primary;

  const cached = path.join(TV_CACHE_DIR, safe);
  if (isPlayableMediaFile(cached)) return cached;

  return null;
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function escapeDrawText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/%/g, "\\%")
    .slice(0, 48);
}

/** Build a short title-card MP4 so the set is never blank when LFS is unavailable. */
function writeStandinMp4(destPath: string, title: string) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const label = escapeDrawText(title.trim() || "Cottage cartoon");
  const tmp = `${destPath}.tmp.mp4`;
  try {
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-f",
        "lavfi",
        "-i",
        "color=c=0x152019:s=960x540:d=12",
        "-f",
        "lavfi",
        "-i",
        "anullsrc=r=44100:cl=stereo",
        "-vf",
        `drawtext=text='${label}':fontcolor=0xe8dcc8:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2-18,drawtext=text='Re-upload to restore full episode':fontcolor=0x6b8f71:fontsize=20:x=(w-text_w)/2:y=(h-text_h)/2+28`,
        "-shortest",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-movflags",
        "+faststart",
        tmp,
      ],
      { stdio: "pipe", timeout: 60_000 }
    );
    fs.renameSync(tmp, destPath);
    return true;
  } catch (err) {
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } catch {
      // ignore
    }
    // Fallback without drawtext (some builds lack the filter).
    try {
      execFileSync(
        "ffmpeg",
        [
          "-y",
          "-f",
          "lavfi",
          "-i",
          "color=c=0x152019:s=960x540:d=12",
          "-f",
          "lavfi",
          "-i",
          "anullsrc=r=44100:cl=stereo",
          "-shortest",
          "-c:v",
          "libx264",
          "-pix_fmt",
          "yuv420p",
          "-c:a",
          "aac",
          "-movflags",
          "+faststart",
          tmp,
        ],
        { stdio: "pipe", timeout: 60_000 }
      );
      fs.renameSync(tmp, destPath);
      return true;
    } catch (err2) {
      console.warn("[tv-cache] stand-in render failed:", err2);
      return false;
    }
  }
}

/**
 * After LFS pull fails or leaves pointers, create local playable stand-ins so
 * the village set never mounts a broken 134-byte pointer as video/mp4.
 */
export function materializeTvStandins() {
  try {
    const catalogPath =
      PERSISTENT_TV_MEDIA_PATH ||
      path.join(process.cwd(), "data", "persistent-tv-media.json");
    if (!catalogPath || !fs.existsSync(catalogPath)) return { created: 0 };
    const raw = fs.readFileSync(catalogPath, "utf8");
    const parsed = JSON.parse(raw) as {
      clips?: Array<{ filename?: string; title?: string }>;
    };
    const clips = Array.isArray(parsed.clips) ? parsed.clips : [];
    let created = 0;
    for (const clip of clips) {
      const filename = String(clip.filename || "").trim();
      if (!filename || filename.startsWith("link-")) continue;
      if (resolvePlayableUploadPath(filename)) continue;

      const primary = path.join(UPLOAD_DIR || path.join(process.cwd(), "data", "uploads"), filename);
      const needsStandin =
        !fs.existsSync(primary) || isLfsPointerFile(primary);
      if (!needsStandin) continue;

      const dest = path.join(TV_CACHE_DIR, filename);
      if (isPlayableMediaFile(dest)) continue;
      if (writeStandinMp4(dest, String(clip.title || filename))) {
        created += 1;
      }
    }
    if (created) {
      console.warn(
        `[tv-cache] created ${created} local stand-in clip(s) (Git LFS media unavailable)`
      );
    }
    return { created };
  } catch (err) {
    console.warn("[tv-cache] materialize failed:", err);
    return { created: 0 };
  }
}

/** True when we are serving a stand-in instead of the real LFS object. */
export function isServingTvStandin(filename: string) {
  const safe = path.basename(filename);
  const primary = path.join(UPLOAD_DIR, safe);
  if (isPlayableMediaFile(primary)) return false;
  return isPlayableMediaFile(path.join(TV_CACHE_DIR, safe));
}

// silence unused in case tree-shaking complains about shellQuote helper
void shellQuote;
