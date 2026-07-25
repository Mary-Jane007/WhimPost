import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import type { Database } from "better-sqlite3";
import { exportPersistentTv } from "@/lib/persistentTv";
import {
  exportPersistentTvMedia,
  PERSISTENT_TV_MEDIA_PATH,
  UPLOAD_DIR,
} from "@/lib/persistentTvMedia";

const ROOT = process.cwd();
const LOCK_PATH = path.join(ROOT, "data", ".tv-persist.lock");
const DEBOUNCE_MS = 2500;

type GlobalPersist = typeof globalThis & {
  whimpostTvPersistTimer?: ReturnType<typeof setTimeout>;
  whimpostTvPersistRunning?: boolean;
};

function gitOk() {
  return fs.existsSync(path.join(ROOT, ".git"));
}

function listCatalogUploadPaths() {
  try {
    if (!fs.existsSync(PERSISTENT_TV_MEDIA_PATH)) return [] as string[];
    const raw = fs.readFileSync(PERSISTENT_TV_MEDIA_PATH, "utf8");
    const parsed = JSON.parse(raw) as { clips?: Array<{ filename?: string }> };
    const clips = Array.isArray(parsed.clips) ? parsed.clips : [];
    const paths: string[] = [];
    for (const clip of clips) {
      const filename = String(clip.filename || "").trim();
      if (!filename || filename.startsWith("link-") || filename.includes("..")) {
        continue;
      }
      const abs = path.join(UPLOAD_DIR, filename);
      if (!fs.existsSync(abs)) continue;
      paths.push(path.join("data", "uploads", filename));
    }
    return paths;
  } catch {
    return [] as string[];
  }
}

function durablePersistEnabled() {
  const raw = String(process.env.WHIMPOST_TV_AUTOPUSH ?? "1").trim();
  return raw !== "0" && raw.toLowerCase() !== "false";
}

function isLfsPointerFile(filePath: string) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 1024) return false;
    const head = fs.readFileSync(filePath, "utf8");
    return head.startsWith("version https://git-lfs.github.com/spec/v1");
  } catch {
    return false;
  }
}

/** Pull Git LFS bytes for TV uploads before restoring the catalog. */
export function ensureTvUploadBytes() {
  if (!gitOk()) return;
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    // Fetch LFS objects for the upload shelf (no-op when already present).
    execFileSync("git", ["lfs", "pull", "--include", "data/uploads/**"], {
      cwd: ROOT,
      stdio: "pipe",
      timeout: 10 * 60_000,
    });
  } catch (err) {
    console.warn("[persistent-tv] git lfs pull failed:", err);
  }

  // Warn about any catalog clips that are still pointer-only / missing.
  try {
    if (!fs.existsSync(PERSISTENT_TV_MEDIA_PATH)) return;
    const raw = fs.readFileSync(PERSISTENT_TV_MEDIA_PATH, "utf8");
    const parsed = JSON.parse(raw) as { clips?: Array<{ filename?: string }> };
    const clips = Array.isArray(parsed.clips) ? parsed.clips : [];
    let missing = 0;
    let pointers = 0;
    for (const clip of clips) {
      const filename = String(clip.filename || "").trim();
      if (!filename) continue;
      const filePath = path.join(UPLOAD_DIR, filename);
      if (!fs.existsSync(filePath)) {
        missing += 1;
        continue;
      }
      if (isLfsPointerFile(filePath)) pointers += 1;
    }
    if (missing || pointers) {
      console.warn(
        `[persistent-tv] upload shelf incomplete: ${missing} missing, ${pointers} LFS pointer-only`
      );
    }
  } catch (err) {
    console.warn("[persistent-tv] could not verify upload shelf:", err);
  }
}

/**
 * Refresh both git-tracked TV catalogs from SQLite.
 * Call after every create / rename / delete of channels or clips.
 */
export function persistTvCatalogs(db: Database) {
  exportPersistentTv(db);
  exportPersistentTvMedia(db);
  scheduleDurableTvGitSync();
}

/** Debounced git add/commit/push so uploads survive server resets. */
export function scheduleDurableTvGitSync() {
  if (!durablePersistEnabled() || !gitOk()) return;
  const g = globalThis as GlobalPersist;
  if (g.whimpostTvPersistTimer) {
    clearTimeout(g.whimpostTvPersistTimer);
  }
  g.whimpostTvPersistTimer = setTimeout(() => {
    g.whimpostTvPersistTimer = undefined;
    void runDurableTvGitSync();
  }, DEBOUNCE_MS);
}

function withLock(fn: () => void) {
  if (fs.existsSync(LOCK_PATH)) {
    try {
      const age = Date.now() - fs.statSync(LOCK_PATH).mtimeMs;
      // Steal a stale lock after 15 minutes (large LFS push).
      if (age < 15 * 60_000) return false;
    } catch {
      // continue
    }
  }
  fs.mkdirSync(path.dirname(LOCK_PATH), { recursive: true });
  fs.writeFileSync(LOCK_PATH, String(process.pid));
  try {
    fn();
  } finally {
    try {
      fs.unlinkSync(LOCK_PATH);
    } catch {
      // ignore
    }
  }
  return true;
}

function git(args: string[], opts?: { timeout?: number }) {
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: opts?.timeout ?? 60_000,
  }).trim();
}

export async function runDurableTvGitSync(): Promise<{
  ok: boolean;
  committed: boolean;
  pushed: boolean;
  error?: string;
}> {
  if (!durablePersistEnabled() || !gitOk()) {
    return { ok: true, committed: false, pushed: false };
  }

  const g = globalThis as GlobalPersist;
  if (g.whimpostTvPersistRunning) {
    scheduleDurableTvGitSync();
    return { ok: true, committed: false, pushed: false };
  }
  g.whimpostTvPersistRunning = true;

  try {
    let committed = false;
    let pushed = false;
    let error: string | undefined;

    const ran = withLock(() => {
      // Stage catalogs + only the video files listed in the media catalog
      // (never letter/library uploads living under the same folder).
      const uploadPaths = listCatalogUploadPaths();
      git([
        "add",
        "--",
        "data/persistent-tv.json",
        "data/persistent-tv-media.json",
        ...uploadPaths,
      ]);

      // Also stage deletions of previously tracked TV videos that left the catalog.
      try {
        const deleted = git([
          "ls-files",
          "--deleted",
          "--",
          "data/uploads",
        ])
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => /\.(mp4|webm|mov|m4v|mkv|avi|mpeg|mpg)$/i.test(line));
        if (deleted.length) {
          git(["add", "--", ...deleted]);
        }
      } catch {
        // ignore
      }

      const staged = git(["diff", "--cached", "--name-only"])
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .filter(
          (line) =>
            line === "data/persistent-tv.json" ||
            line === "data/persistent-tv-media.json" ||
            (line.startsWith("data/uploads/") &&
              !line.includes("/.incoming/") &&
              /\.(mp4|webm|mov|m4v|mkv|avi|mpeg|mpg)$/i.test(line))
        );
      if (staged.length === 0) {
        return;
      }

      git([
        "commit",
        "-m",
        "Persist TV Corner uploads so clips survive resets",
        "--",
        ...staged,
      ]);
      committed = true;

      const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
      if (!branch || branch === "HEAD") {
        console.warn(
          "[persistent-tv] durable commit saved locally (detached HEAD; not pushed)"
        );
        return;
      }

      // Large LFS pushes can take a while — allow up to 20 minutes.
      git(["push", "-u", "origin", "HEAD"], { timeout: 20 * 60_000 });
      pushed = true;
      console.info(
        `[persistent-tv] durable shelf pushed to origin (${staged.length} path(s))`
      );
    });

    if (!ran) {
      // Another sync holds the lock — try again shortly.
      scheduleDurableTvGitSync();
    }

    return { ok: !error, committed, pushed, error };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[persistent-tv] durable git sync failed:", message);
    return { ok: false, committed: false, pushed: false, error: message };
  } finally {
    g.whimpostTvPersistRunning = false;
  }
}
