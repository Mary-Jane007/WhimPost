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
} from "@/lib/persistentTvMedia";
import { PERSISTENT_TV_MEDIA_PATH } from "@/lib/tvMediaPaths";
import { UPLOAD_DIR } from "@/lib/uploadPaths";
import { exportPersistentLibraryBooks } from "@/lib/persistentLibraryBooks";
import { exportPersistentAccounts } from "@/lib/persistentAccounts";
import {
  exportPersistentMoonSounds,
  importPersistentMoonSounds,
  moonSoundAbsolutePath,
  moonSoundReleaseName,
  PERSISTENT_MOON_SOUNDS_PATH,
} from "@/lib/persistentMoonSounds";
import { PERSISTENT_SITE_UPLOADS_PATH } from "@/lib/persistentSiteUploads";
import { isLfsPointerFile, isPlayableMediaFile } from "@/lib/lfsPointer";
import { materializeTvStandins } from "@/lib/tvUploadFiles";

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

function safeExists(filePath: string | null | undefined) {
  if (!filePath || typeof filePath !== "string") return false;
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function listCatalogUploadPaths() {
  const paths = new Set<string>();
  const uploadDir = UPLOAD_DIR || path.join(ROOT, "data", "uploads");
  try {
    const catalogPath =
      PERSISTENT_TV_MEDIA_PATH ||
      path.join(ROOT, "data", "persistent-tv-media.json");
    if (safeExists(catalogPath)) {
      const raw = fs.readFileSync(catalogPath, "utf8");
      const parsed = JSON.parse(raw) as { clips?: Array<{ filename?: string }> };
      const clips = Array.isArray(parsed.clips) ? parsed.clips : [];
      for (const clip of clips) {
        const filename = String(clip.filename || "").trim();
        if (!filename || filename.startsWith("link-") || filename.includes("..")) {
          continue;
        }
        const abs = path.join(uploadDir, filename);
        if (!safeExists(abs)) continue;
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
  try {
    if (fs.existsSync(PERSISTENT_MOON_SOUNDS_PATH)) {
      const raw = fs.readFileSync(PERSISTENT_MOON_SOUNDS_PATH, "utf8");
      const parsed = JSON.parse(raw) as {
        sounds?: Array<{ filename?: string }>;
      };
      for (const sound of parsed.sounds || []) {
        const filename = String(sound.filename || "").trim();
        if (
          !filename ||
          filename.includes("..") ||
          !/^[a-f0-9-]+\.(mp3|wav|ogg|webm|m4a|aac)$/i.test(filename)
        ) {
          continue;
        }
        const abs = moonSoundAbsolutePath(filename);
        if (!fs.existsSync(abs)) continue;
        paths.add(path.join("data", "uploads", "moon-sounds", filename));
      }
    }
  } catch {
    // ignore
  }
  try {
    if (fs.existsSync(PERSISTENT_SITE_UPLOADS_PATH)) {
      const raw = fs.readFileSync(PERSISTENT_SITE_UPLOADS_PATH, "utf8");
      const parsed = JSON.parse(raw) as {
        files?: Array<{ filename?: string }>;
      };
      for (const file of parsed.files || []) {
        const filename = String(file.filename || "").trim();
        if (
          !filename ||
          filename.includes("..") ||
          !/^[a-f0-9-]+\.(jpe?g|png|webp|gif|pdf|epub)$/i.test(filename)
        ) {
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
  return [...paths];
}

function listReleaseNamesForPlayableUploads() {
  const names: string[] = [];
  for (const rel of listCatalogUploadPaths()) {
    const abs = path.join(ROOT, rel);
    if (!isPlayableMediaFile(abs)) continue;
    if (rel.startsWith("data/uploads/moon-sounds/")) {
      names.push(moonSoundReleaseName(path.basename(rel)));
    } else {
      names.push(path.basename(rel));
    }
  }
  return names;
}

function durablePersistEnabled() {
  const raw = String(process.env.WHIMPOST_TV_AUTOPUSH ?? "1").trim();
  return raw !== "0" && raw.toLowerCase() !== "false";
}

/**
 * Pull durable upload bytes (LFS, then GitHub Releases).
 * Keep this off the request hot-path — call scheduleEnsureTvUploadBytes().
 */
export function ensureTvUploadBytes(opts?: { skipNetwork?: boolean }) {
  const uploadDir = UPLOAD_DIR || path.join(ROOT, "data", "uploads");
  if (!safeExists(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  if (!opts?.skipNetwork && gitOk()) {
    try {
      // Fetch LFS objects when the budget still allows it.
      execFileSync("git", ["lfs", "pull", "--include", "data/uploads/**"], {
        cwd: ROOT,
        stdio: "pipe",
        timeout: 15_000,
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

  if (!opts?.skipNetwork) {
    // Primary durable path when Git LFS quota is exhausted: GitHub Release assets.
    try {
      ensureMediaReleaseBytes();
    } catch (err) {
      console.warn("[persistent-tv] media release restore failed:", err);
    }
  }

  // Warn about any catalog clips that are still pointer-only / missing.
  try {
    const catalogPath =
      PERSISTENT_TV_MEDIA_PATH ||
      path.join(ROOT, "data", "persistent-tv-media.json");
    if (!safeExists(catalogPath)) {
      materializeTvStandins();
      return;
    }
    const raw = fs.readFileSync(catalogPath, "utf8");
    const parsed = JSON.parse(raw) as { clips?: Array<{ filename?: string }> };
    const clips = Array.isArray(parsed.clips) ? parsed.clips : [];
    let missing = 0;
    let pointers = 0;
    for (const clip of clips) {
      const filename = String(clip.filename || "").trim();
      if (!filename) continue;
      const filePath = path.join(uploadDir, filename);
      if (!isPlayableMediaFile(filePath)) {
        if (!safeExists(filePath)) missing += 1;
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

type GlobalRestore = typeof globalThis & {
  whimpostMediaRestoreScheduled?: boolean;
};

/** Restore durable media in the background so page loads stay snappy. */
export function scheduleEnsureTvUploadBytes() {
  const g = globalThis as GlobalRestore;
  if (g.whimpostMediaRestoreScheduled) return;
  g.whimpostMediaRestoreScheduled = true;
  setTimeout(() => {
    try {
      ensureTvUploadBytes();
      // Celestial audio may land after the first import — re-bind rows now.
      try {
        const { getDb } = require("@/lib/db") as typeof import("@/lib/db");
        importPersistentMoonSounds(getDb());
      } catch (err) {
        console.warn("[persistent-moon-sounds] post-restore import failed:", err);
      }
    } catch (err) {
      console.warn("[persistent-tv] background media restore failed:", err);
    }
  }, 0);
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

/** Snapshot library + accounts + celestial sounds and push durable media/catalogs. */
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
    exportPersistentMoonSounds(db);
  } catch (err) {
    console.error("[persistent-moon-sounds] export failed:", err);
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
      try {
        const published = publishMediaReleaseAssets(
          listReleaseNamesForPlayableUploads()
        );
        if (published.uploaded) {
          console.info(
            `[media-release] published ${published.uploaded} durable asset(s)`
          );
        }
      } catch (err) {
        console.warn("[media-release] publish failed:", err);
      }

      // Stage catalogs + small uploads (images / restored epubs / audio).
      // Large video bytes live on the release shelf — do not rely on Git LFS.
      const uploadPaths = listCatalogUploadPaths().filter((rel) => {
        const abs = path.join(ROOT, rel);
        if (!isPlayableMediaFile(abs)) return false;
        // Keep committing modest files in git; skip huge videos.
        return fs.statSync(abs).size < 95 * 1024 * 1024;
      });
      git([
        "add",
        "-f",
        "--",
        "data/persistent-tv.json",
        "data/persistent-tv-media.json",
        "data/persistent-library-books.json",
        "data/persistent-moon-sounds.json",
        "data/persistent-site-uploads.json",
        "data/persistent-accounts.json",
        "data/persistent-welcome-letters.json",
        "data/persistent-meeting-bench.json",
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
            /\.(mp4|webm|mov|m4v|mkv|avi|mpeg|mpg|epub|pdf|mp3|wav|ogg|m4a|aac)$/i.test(
              line
            )
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
            line === "data/persistent-moon-sounds.json" ||
            line === "data/persistent-site-uploads.json" ||
            line === "data/persistent-accounts.json" ||
            line === "data/persistent-welcome-letters.json" ||
            line === "data/persistent-meeting-bench.json" ||
            (line.startsWith("data/uploads/") &&
              !line.includes("/.incoming/") &&
              !line.includes("/.media-release-staging/"))
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
