import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { resolvePlayableUploadPath } from "@/lib/tvUploadFiles";

/** Fallback when ffprobe cannot read a clip (2 minutes). */
export const DEFAULT_TV_DURATION_MS = 120_000;

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export function uploadFilePath(filename: string) {
  return path.join(UPLOAD_DIR, filename);
}

/** Probe media duration in milliseconds. Returns null if unknown. */
export function probeDurationMs(filePathOrUrl: string): number | null {
  if (!filePathOrUrl) return null;
  const isRemote = /^https?:\/\//i.test(filePathOrUrl);
  if (!isRemote && !fs.existsSync(filePathOrUrl)) return null;
  try {
    const out = execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        ...(isRemote ? ["-user_agent", "WhimPostTV/1.0"] : []),
        filePathOrUrl,
      ],
      { encoding: "utf8", timeout: isRemote ? 45_000 : 30_000 }
    ).trim();
    const seconds = Number.parseFloat(out);
    if (!Number.isFinite(seconds) || seconds <= 0) return null;
    return Math.max(1000, Math.round(seconds * 1000));
  } catch {
    return null;
  }
}

export function probeUploadDurationMs(filename: string): number {
  if (filename.startsWith("link-")) return DEFAULT_TV_DURATION_MS;
  const playable = resolvePlayableUploadPath(filename);
  if (playable) {
    return probeDurationMs(playable) ?? DEFAULT_TV_DURATION_MS;
  }
  return (
    probeDurationMs(uploadFilePath(filename)) ?? DEFAULT_TV_DURATION_MS
  );
}

/** Best-effort duration for a remote direct video URL. */
export function probeRemoteDurationMs(url: string): number | null {
  return probeDurationMs(url);
}
