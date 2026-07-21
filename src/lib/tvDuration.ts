import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

/** Fallback when ffprobe cannot read a clip (2 minutes). */
export const DEFAULT_TV_DURATION_MS = 120_000;

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export function uploadFilePath(filename: string) {
  return path.join(UPLOAD_DIR, filename);
}

/** Probe media duration in milliseconds. Returns null if unknown. */
export function probeDurationMs(filePath: string): number | null {
  if (!filePath || !fs.existsSync(filePath)) return null;
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
        filePath,
      ],
      { encoding: "utf8", timeout: 30_000 }
    ).trim();
    const seconds = Number.parseFloat(out);
    if (!Number.isFinite(seconds) || seconds <= 0) return null;
    return Math.max(1000, Math.round(seconds * 1000));
  } catch {
    return null;
  }
}

export function probeUploadDurationMs(filename: string): number {
  return (
    probeDurationMs(uploadFilePath(filename)) ?? DEFAULT_TV_DURATION_MS
  );
}
