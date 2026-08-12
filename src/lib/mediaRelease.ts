import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { PERSISTENT_TV_MEDIA_PATH, UPLOAD_DIR } from "@/lib/persistentTvMedia";
import { PERSISTENT_LIBRARY_BOOKS_PATH } from "@/lib/persistentLibraryBooks";
import {
  moonSoundAbsolutePath,
  moonSoundReleaseName,
  PERSISTENT_MOON_SOUNDS_PATH,
} from "@/lib/persistentMoonSounds";
import { MOON_SOUND_DIR } from "@/lib/moonPaths";
import { isLfsPointerFile, isPlayableMediaFile } from "@/lib/tvUploadFiles";

/**
 * Durable media shelf via GitHub Releases (not Git LFS).
 * Large uploads survive any server/browser because bytes live on the release
 * and catalogs in git tell every boot which filenames to fetch.
 */
export const MEDIA_RELEASE_TAG =
  process.env.WHIMPOST_MEDIA_RELEASE_TAG?.trim() || "whimpost-media";

const ROOT = process.cwd();

type GlobalMedia = typeof globalThis & {
  whimpostMediaReleaseEnsuring?: boolean;
};

type MediaShelfEntry = {
  /** Name of the asset on the GitHub Release (flat). */
  releaseName: string;
  /** Absolute path where the playable bytes should live locally. */
  destPath: string;
};

function repoSlug(): string | null {
  try {
    const url = execFileSync("git", ["remote", "get-url", "origin"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    const match =
      /github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?$/i.exec(url) ||
      /github\.com\/([^/]+)\/([^/.]+)/i.exec(url);
    if (!match) return null;
    return `${match[1]}/${match[2]}`;
  } catch {
    return null;
  }
}

function ghAvailable() {
  try {
    execFileSync("gh", ["--version"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function releaseAssetUrl(repo: string, releaseName: string) {
  return `https://github.com/${repo}/releases/download/${encodeURIComponent(
    MEDIA_RELEASE_TAG
  )}/${encodeURIComponent(releaseName)}`;
}

function listCatalogEntries(): MediaShelfEntry[] {
  const byRelease = new Map<string, MediaShelfEntry>();

  try {
    if (fs.existsSync(PERSISTENT_TV_MEDIA_PATH)) {
      const parsed = JSON.parse(
        fs.readFileSync(PERSISTENT_TV_MEDIA_PATH, "utf8")
      ) as { clips?: Array<{ filename?: string }> };
      for (const clip of parsed.clips || []) {
        const filename = String(clip.filename || "").trim();
        if (
          !filename ||
          filename.startsWith("link-") ||
          filename.includes("..")
        ) {
          continue;
        }
        byRelease.set(filename, {
          releaseName: filename,
          destPath: path.join(UPLOAD_DIR, filename),
        });
      }
    }
  } catch {
    // ignore
  }

  try {
    if (fs.existsSync(PERSISTENT_LIBRARY_BOOKS_PATH)) {
      const parsed = JSON.parse(
        fs.readFileSync(PERSISTENT_LIBRARY_BOOKS_PATH, "utf8")
      ) as { books?: Array<{ fileUrl?: string | null }> };
      for (const book of parsed.books || []) {
        const match = /\/api\/uploads\/([a-f0-9-]+\.[a-z0-9]+)$/i.exec(
          String(book.fileUrl || "")
        );
        if (!match?.[1]) continue;
        byRelease.set(match[1], {
          releaseName: match[1],
          destPath: path.join(UPLOAD_DIR, match[1]),
        });
      }
    }
  } catch {
    // ignore
  }

  try {
    if (fs.existsSync(PERSISTENT_MOON_SOUNDS_PATH)) {
      const parsed = JSON.parse(
        fs.readFileSync(PERSISTENT_MOON_SOUNDS_PATH, "utf8")
      ) as { sounds?: Array<{ filename?: string }> };
      for (const sound of parsed.sounds || []) {
        const filename = String(sound.filename || "").trim();
        if (
          !filename ||
          filename.includes("..") ||
          !/^[a-f0-9-]+\.(mp3|wav|ogg|webm|m4a|aac)$/i.test(filename)
        ) {
          continue;
        }
        const releaseName = moonSoundReleaseName(filename);
        byRelease.set(releaseName, {
          releaseName,
          destPath: moonSoundAbsolutePath(filename),
        });
      }
    }
  } catch {
    // ignore
  }

  return [...byRelease.values()];
}

function downloadToFile(url: string, destPath: string) {
  const tmp = `${destPath}.download`;
  try {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  } catch {
    // ignore
  }
  execFileSync(
    "curl",
    [
      "-fsSL",
      "--retry",
      "5",
      "--retry-delay",
      "2",
      "--retry-all-errors",
      "-o",
      tmp,
      url,
    ],
    { cwd: ROOT, stdio: "pipe", timeout: 30 * 60_000 }
  );
  assertPlayableDownload(tmp, url);
  fs.renameSync(tmp, destPath);
}

function downloadReleaseAssetViaGh(repo: string, filename: string, destPath: string) {
  const tmp = `${destPath}.download`;
  try {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  } catch {
    // ignore
  }
  const assetId = execFileSync(
    "gh",
    [
      "api",
      `repos/${repo}/releases/tags/${MEDIA_RELEASE_TAG}`,
      "--jq",
      `.assets[] | select(.name=="${filename}") | .id`,
    ],
    { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  ).trim();
  if (!assetId) {
    throw new Error(`release asset not found: ${filename}`);
  }
  const token = execFileSync("gh", ["auth", "token"], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
  execFileSync(
    "curl",
    [
      "-fsSL",
      "--retry",
      "5",
      "--retry-delay",
      "2",
      "--retry-all-errors",
      "-H",
      "Accept: application/octet-stream",
      "-H",
      `Authorization: Bearer ${token}`,
      "-H",
      "X-GitHub-Api-Version: 2022-11-28",
      "-o",
      tmp,
      `https://api.github.com/repos/${repo}/releases/assets/${assetId}`,
    ],
    { cwd: ROOT, stdio: "pipe", timeout: 30 * 60_000 }
  );
  assertPlayableDownload(tmp, `gh:${filename}`);
  fs.renameSync(tmp, destPath);
}

function assertPlayableDownload(tmp: string, label: string) {
  const size = fs.statSync(tmp).size;
  if (size < 8_192) {
    try {
      fs.unlinkSync(tmp);
    } catch {
      // ignore
    }
    throw new Error(`download too small (${size} bytes): ${label}`);
  }
  const fd = fs.openSync(tmp, "r");
  const buf = Buffer.alloc(64);
  try {
    fs.readSync(fd, buf, 0, 64, 0);
  } finally {
    fs.closeSync(fd);
  }
  const head = buf.toString("utf8");
  if (
    head.startsWith("<!DOCTYPE") ||
    head.startsWith("<html") ||
    head.startsWith("version https://git-lfs.github.com/spec/v1") ||
    head.startsWith("{")
  ) {
    try {
      fs.unlinkSync(tmp);
    } catch {
      // ignore
    }
    throw new Error(`download was not media bytes: ${label}`);
  }
}

/** Fetch missing / LFS-pointer uploads from the durable GitHub Release. */
export function ensureMediaReleaseBytes() {
  const g = globalThis as GlobalMedia;
  if (g.whimpostMediaReleaseEnsuring) return { downloaded: 0 };
  g.whimpostMediaReleaseEnsuring = true;

  let downloaded = 0;
  try {
    const repo = repoSlug();
    if (!repo) return { downloaded: 0 };
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    if (!fs.existsSync(MOON_SOUND_DIR)) {
      fs.mkdirSync(MOON_SOUND_DIR, { recursive: true });
    }

    for (const entry of listCatalogEntries()) {
      const dest = entry.destPath;
      if (isPlayableMediaFile(dest)) continue;
      // Only replace missing files or Git LFS pointer stubs.
      if (fs.existsSync(dest) && !isLfsPointerFile(dest)) continue;

      fs.mkdirSync(path.dirname(dest), { recursive: true });
      const url = releaseAssetUrl(repo, entry.releaseName);
      try {
        downloadToFile(url, dest);
        downloaded += 1;
        console.info(`[media-release] restored ${entry.releaseName}`);
      } catch (publicErr) {
        try {
          if (!ghAvailable()) throw publicErr;
          downloadReleaseAssetViaGh(repo, entry.releaseName, dest);
          downloaded += 1;
          console.info(
            `[media-release] restored ${entry.releaseName} via gh api`
          );
        } catch (err) {
          console.warn(
            `[media-release] could not restore ${entry.releaseName}:`,
            err instanceof Error ? err.message : err
          );
        }
      }
    }
  } finally {
    g.whimpostMediaReleaseEnsuring = false;
  }
  return { downloaded };
}

function ensureReleaseExists(repo: string) {
  try {
    execFileSync(
      "gh",
      ["release", "view", MEDIA_RELEASE_TAG, "--repo", repo],
      { cwd: ROOT, stdio: "pipe" }
    );
    return;
  } catch {
    // create
  }
  execFileSync(
    "gh",
    [
      "release",
      "create",
      MEDIA_RELEASE_TAG,
      "--repo",
      repo,
      "--title",
      "WhimPost durable media",
      "--notes",
      "Uploaded TV clips and library files so media plays on any server without Git LFS.",
    ],
    { cwd: ROOT, stdio: "pipe", timeout: 120_000 }
  );
}

/** Upload playable local files listed in catalogs to the durable release. */
export function publishMediaReleaseAssets(releaseNames?: string[]) {
  if (!ghAvailable()) {
    return { ok: false, uploaded: 0, error: "gh CLI unavailable" };
  }
  const repo = repoSlug();
  if (!repo) {
    return { ok: false, uploaded: 0, error: "no origin github remote" };
  }

  const wanted = releaseNames ? new Set(releaseNames) : null;
  const targets = listCatalogEntries().filter((entry) => {
    if (wanted && !wanted.has(entry.releaseName)) return false;
    return isPlayableMediaFile(entry.destPath);
  });
  if (targets.length === 0) {
    return { ok: true, uploaded: 0 };
  }

  try {
    ensureReleaseExists(repo);
  } catch (err) {
    return {
      ok: false,
      uploaded: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const stagingDir = path.join(ROOT, "data", ".media-release-staging");
  fs.mkdirSync(stagingDir, { recursive: true });

  let uploaded = 0;
  for (const entry of targets) {
    const staged = path.join(stagingDir, entry.releaseName);
    try {
      fs.copyFileSync(entry.destPath, staged);
      execFileSync(
        "gh",
        [
          "release",
          "upload",
          MEDIA_RELEASE_TAG,
          staged,
          "--repo",
          repo,
          "--clobber",
        ],
        { cwd: ROOT, stdio: "pipe", timeout: 30 * 60_000 }
      );
      uploaded += 1;
      console.info(`[media-release] published ${entry.releaseName}`);
    } catch (err) {
      console.warn(
        `[media-release] upload failed for ${entry.releaseName}:`,
        err instanceof Error ? err.message : err
      );
    } finally {
      try {
        if (fs.existsSync(staged)) fs.unlinkSync(staged);
      } catch {
        // ignore
      }
    }
  }

  return { ok: uploaded > 0 || targets.length === 0, uploaded };
}
