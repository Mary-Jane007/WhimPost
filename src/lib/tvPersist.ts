import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import type { Database } from "better-sqlite3";
import {
  ensureMediaReleaseBytes,
  publishMediaReleaseAssets,
} from "@/lib/mediaRelease";
import { exportPersistentTv } from "@/lib/persistentTv";
import {
  exportPersistentTvMedia,
  PERSISTENT_TV_MEDIA_PATH,
  UPLOAD_DIR,
} from "@/lib/persistentTvMedia";
import { exportPersistentLibraryBooks } from "@/lib/persistentLibraryBooks";
import { exportPersistentAccounts } from "@/lib/persistentAccounts";
import {
  isLfsPointerFile,
  isPlayableMediaFile,
  materializeTvStandins,
} from "@/lib/tvUploadFiles";

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
  const paths = new Set<string>();
  try {
    if (fs.existsSync(PERSISTENT_TV_MEDIA_PATH)) {
      const raw = fs.readFileSync(PERSISTENT_TV_MEDIA_PATH, "utf8");
      const parsed = JSON.parse(raw) as { clips?: Array<{ filename?: string }> };
      const clips = Array.isArray(parsed.clips) ? parsed.clips : [];
      for (const clip of clips) {
        const filename = String(clip.filename || "").trim();
        if (!filename || filename.startsWith("link-") || filename.includes("..")) {
          continue;
        }
        const abs = path.join(UPLOAD_DIR, filename);
        if (!fs.existsSync(abs)) continue;
        paths.add(path.join("data", "uploads", filename));
      }
    }
  } catch {
    // ignore
  }
  try {
    const libraryPath = path.join(ROOT, "data", "persistent-library-books.json");
    if (fs.existsSync(libraryPath)) {
      const raw = fs.readFileSync(libraryPath, "utf8");
      const parsed = JSON.parse(raw) as {
        books?: Array<{ fileUrl?: string | null }>;
      };
      for (const book of parsed.books || []) {
        const match = /\/api\/uploads\/([a-f0-9-]+\.[a-z0-9]+)$/i.exec(
          String(book.fileUrl || "")
        );
        if (!match?.[1]) continue;
        const abs = path.join(UPLOAD_DIR, match[1]);
        if (!fs.existsSync(abs)) continue;
        paths.add(path.join("data", "uploads", match[1]));
      }
    }
  } catch {
    // ignore
  }
  return [...paths];
}

function durablePersistEnabled() {
  const raw = String(process.env.WHIMPOST_TV_AUTOPUSH ?? "1").trim();
  return raw !== "0" && raw.toLowerCase() !== "false";
}

/** Pull durable upload bytes before restoring catalogs (LFS, then GitHub Releases). */
export function ensureTvUploadBytes() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  if (gitOk()) {
    try {
      // Fetch LFS objects when the budget still allows it.
      execFileSync("git", ["lfs", "pull", "--include", "data/uploads/**"], {
        cwd: ROOT,
        stdio: "pipe",
        timeout: 10 * 60_000,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // GitHub LFS quota exhaustion is expected on this repo — Releases cover it.
      console.warn(
        "[persistent-tv] git lfs pull unavailable; using media release shelf instead"
      );
      if (!/LFS budget|exceeded/i.test(message)) {
        console.warn("[persistent-tv] git lfs pull detail:", message.slice(0, 300));
      }
    }
  }

  // Primary durable path when Git LFS quota is exhausted: GitHub Release assets.
  try {
    ensureMediaReleaseBytes();
  } catch (err) {
    console.warn("[persistent-tv] media release restore failed:", err);
  }

  // Warn about any catalog clips that are still pointer-only / missing.
  try {
    if (!fs.existsSync(PERSISTENT_TV_MEDIA_PATH)) {
      materializeTvStandins();
      return;
    }
    const raw = fs.readFileSync(PERSISTENT_TV_MEDIA_PATH, "utf8");
    const parsed = JSON.parse(raw) as { clips?: Array<{ filename?: string }> };
    const clips = Array.isArray(parsed.clips) ? parsed.clips : [];
    let missing = 0;
    let pointers = 0;
    for (const clip of clips) {
      const filename = String(clip.filename || "").trim();
      if (!filename) continue;
      const filePath = path.join(UPLOAD_DIR, filename);
      if (!isPlayableMediaFile(filePath)) {
        if (!fs.existsSync(filePath)) missing += 1;
        else if (isLfsPointerFile(filePath)) pointers += 1;
        else missing += 1;
      }
    }
    if (missing || pointers) {
      console.warn(
        `[persistent-tv] upload shelf incomplete: ${missing} missing, ${pointers} LFS pointer-only`
      );
      // Keep the set watchable when durable bytes are still unavailable.
      materializeTvStandins();
    }
  } catch (err) {
    console.warn("[persistent-tv] could not verify upload shelf:", err);
    materializeTvStandins();
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

/** Snapshot library + accounts and push durable media/catalogs. */
export function persistAllDurableState(db: Database) {
  try {
    exportPersistentTv(db);
    exportPersistentTvMedia(db);
  } catch (err) {
    console.error("[persistent-tv] catalog export failed:", err);
  }
  try {
    exportPersistentLibraryBooks(db);
  } catch (err) {
    console.error("[persistent-library-books] export failed:", err);
  }
  try {
    exportPersistentAccounts(db);
  } catch (err) {
    console.error("[persistent-accounts] export failed:", err);
  }
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
      // Publish playable binaries to the GitHub Release shelf first so every
      // server can restore them even when Git LFS quota is exhausted.
      const playableUploads = listCatalogUploadPaths()
        .map((rel) => path.basename(rel))
        .filter((name) =>
          isPlayableMediaFile(path.join(UPLOAD_DIR, name))
        );
      try {
        const published = publishMediaReleaseAssets(playableUploads);
        if (published.uploaded) {
          console.info(
            `[media-release] published ${published.uploaded} durable asset(s)`
          );
        }
      } catch (err) {
        console.warn("[media-release] publish failed:", err);
      }

      // Stage catalogs + small uploads (images / restored epubs). Large video
      // bytes live on the release shelf — do not rely on Git LFS for them.
      const uploadPaths = listCatalogUploadPaths().filter((rel) => {
        const abs = path.join(ROOT, rel);
        if (!isPlayableMediaFile(abs)) return false;
        // Keep committing modest library/book files in git; skip huge videos.
        return fs.statSync(abs).size < 95 * 1024 * 1024;
      });
      git([
        "add",
        "-f",
        "--",
        "data/persistent-tv.json",
        "data/persistent-tv-media.json",
        "data/persistent-library-books.json",
        "data/persistent-accounts.json",
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
          .filter((line) =>
            /\.(mp4|webm|mov|m4v|mkv|avi|mpeg|mpg|epub|pdf)$/i.test(line)
          );
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
            line === "data/persistent-library-books.json" ||
            line === "data/persistent-accounts.json" ||
            (line.startsWith("data/uploads/") &&
              !line.includes("/.incoming/"))
        );
      if (staged.length === 0) {
        return;
      }

      git([
        "commit",
        "-m",
        "Persist media catalogs and uploads so clips survive resets",
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
