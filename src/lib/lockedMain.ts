import fs from "fs";
import path from "path";

const ROOT = process.cwd();

export const LOCKED_MAIN_PATH = path.join(ROOT, "data", "locked-main.json");
export const LOCKED_TV_MEDIA_PATH = path.join(
  ROOT,
  "data",
  "locked-tv-media.json"
);

export type LockedTvMediaClip = {
  title: string;
  filename: string;
  mime: string;
  sizeBytes: number;
  durationMs?: number;
  channelTitle: string;
  villageId: string | null;
  isGlobal?: boolean;
};

type LockedMain = {
  version: 1;
  lockedAt: string;
  mainSha: string;
  note?: string;
  features: string[];
  requiredMarkers: Array<{
    path: string;
    includes?: string;
    minClips?: number;
  }>;
  tvMediaFloorPath: string;
  mediaReleaseTag?: string;
};

type LockedTvMediaFile = {
  version: 1;
  lockedAt?: string;
  clips: LockedTvMediaClip[];
};

function readJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw.trim()) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function readLockedMain(): LockedMain | null {
  return readJson<LockedMain>(LOCKED_MAIN_PATH);
}

/** Forever floor of TV catalog clips — export must never drop these. */
export function readLockedTvMediaClips(): LockedTvMediaClip[] {
  const file = readJson<LockedTvMediaFile>(LOCKED_TV_MEDIA_PATH);
  if (!file || !Array.isArray(file.clips)) return [];
  return file.clips.filter((c) => c?.filename && c?.title && c?.channelTitle);
}

/**
 * Raise an alarm (never throw) when the running tree is missing locked
 * Meeting Bench / TV forever markers. Helps agents notice branch drift.
 */
export function assertLockedMainPresent() {
  const lock = readLockedMain();
  if (!lock) {
    console.warn("[locked-main] missing data/locked-main.json");
    return { ok: false, problems: ["missing-lock"] as string[] };
  }

  const problems: string[] = [];
  for (const marker of lock.requiredMarkers || []) {
    const abs = path.join(ROOT, marker.path);
    if (!fs.existsSync(abs)) {
      problems.push(`missing:${marker.path}`);
      continue;
    }
    if (marker.includes) {
      const text = fs.readFileSync(abs, "utf8");
      if (!text.includes(marker.includes)) {
        problems.push(`marker:${marker.path}:${marker.includes}`);
      }
    }
    if (typeof marker.minClips === "number") {
      try {
        const parsed = JSON.parse(fs.readFileSync(abs, "utf8")) as {
          clips?: unknown[];
        };
        const count = Array.isArray(parsed.clips) ? parsed.clips.length : 0;
        if (count < marker.minClips) {
          problems.push(
            `thin-catalog:${marker.path}:${count}<${marker.minClips}`
          );
        }
      } catch {
        problems.push(`unreadable:${marker.path}`);
      }
    }
  }

  if (problems.length) {
    console.error(
      `[locked-main] LOCK DRIFT — latest features/media may be lost: ${problems.join(", ")}`
    );
  } else {
    console.info(
      `[locked-main] ok — tip features locked (${lock.features.join(", ")})`
    );
  }
  return { ok: problems.length === 0, problems };
}
