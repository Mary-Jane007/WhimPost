import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import {
  isLfsPointerFile,
  isPlayableMediaFile,
  minPlayableBytes,
} from "@/lib/lfsPointer";
import { PERSISTENT_LIBRARY_BOOKS_PATH } from "@/lib/persistentLibraryBooks";
import { PERSISTENT_TV_MEDIA_PATH } from "@/lib/tvMediaPaths";
import {
  moonSoundAbsolutePath,
  moonSoundReleaseName,
  PERSISTENT_MOON_SOUNDS_PATH,
} from "@/lib/persistentMoonSounds";
import { MOON_SOUND_DIR } from "@/lib/moonPaths";
import { UPLOAD_DIR } from "@/lib/uploadPaths";

/**
 * Durable media shelf via GitHub Releases (not Git LFS).
 * Large uploads survive any server/browser because bytes live on the release
 * and catalogs in git tell every boot which filenames to fetch.
 *
 * Files over ~1.8GB are split into `.partNNN` + `.whimparts.json` because
 * GitHub release assets cannot exceed 2GB.
 */
export const MEDIA_RELEASE_TAG =
  process.env.WHIMPOST_MEDIA_RELEASE_TAG?.trim() || "whimpost-media";

/** Stay under GitHub's 2GiB release-asset cap. */
export const MEDIA_RELEASE_PART_MAX = 1_800 * 1024 * 1024;

const ROOT = process.cwd();
const PARTS_SUFFIX = ".whimparts.json";

type GlobalMedia = typeof globalThis & {
  whimpostMediaReleaseEnsuring?: boolean;
  whimpostMediaReleaseAssetNames?: Set<string> | null;
  whimpostMediaReleaseAttempted?: Set<string>;
};

type MediaShelfEntry = {
  /** Canonical filename / release base name (e.g. uuid.mp4). */
  releaseName: string;
  /** Absolute path where the playable bytes should live locally. */
  destPath: string;
};

type PartsManifest = {
  version: 1;
  filename: string;
  sizeBytes: number;
  partSize: number;
  parts: string[];
};

function partsManifestName(releaseName: string) {
  return `${releaseName}${PARTS_SUFFIX}`;
}

function partAssetName(releaseName: string, index: number) {
  return `${releaseName}.part${String(index).padStart(3, "0")}`;
}

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

  try {
    const sitePath = path.join(ROOT, "data", "persistent-site-uploads.json");
    if (fs.existsSync(sitePath)) {
      const parsed = JSON.parse(fs.readFileSync(sitePath, "utf8")) as {
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
    const villagePath = path.join(ROOT, "data", "persistent-village-media.json");
    if (fs.existsSync(villagePath)) {
      const parsed = JSON.parse(fs.readFileSync(villagePath, "utf8")) as {
        images?: Record<string, string>;
      };
      for (const url of Object.values(parsed.images || {})) {
        const match = /\/api\/uploads\/([a-f0-9-]+\.[a-z0-9]+)$/i.exec(
          String(url || "")
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

  return [...byRelease.values()];
}

function listReleaseAssetNames(repo: string): Set<string> {
  const g = globalThis as GlobalMedia;
  if (g.whimpostMediaReleaseAssetNames) {
    return g.whimpostMediaReleaseAssetNames;
  }
  try {
    if (!ghAvailable()) {
      g.whimpostMediaReleaseAssetNames = new Set();
      return g.whimpostMediaReleaseAssetNames;
    }
    const raw = execFileSync(
      "gh",
      [
        "api",
        `repos/${repo}/releases/tags/${MEDIA_RELEASE_TAG}`,
        "--jq",
        ".assets[].name",
      ],
      {
        cwd: ROOT,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 20_000,
      }
    ).trim();
    const names = new Set(
      raw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    );
    g.whimpostMediaReleaseAssetNames = names;
    return names;
  } catch {
    // Release may not exist yet — remember empty so we do not hammer the API.
    g.whimpostMediaReleaseAssetNames = new Set();
    return g.whimpostMediaReleaseAssetNames;
  }
}

/** Invalidate cached release asset names after publishing new uploads. */
export function invalidateMediaReleaseAssetCache() {
  const g = globalThis as GlobalMedia;
  g.whimpostMediaReleaseAssetNames = undefined;
}

function downloadToFile(url: string, destPath: string) {
  const tmp = `${destPath}.download`;
  try {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  } catch {
    // ignore
  }
  // Do NOT use --retry-all-errors: that retries HTTP 404s and freezes boot.
  execFileSync(
    "curl",
    [
      "-fsSL",
      "--connect-timeout",
      "8",
      "--max-time",
      "7200",
      "--retry",
      "2",
      "--retry-delay",
      "1",
      "-o",
      tmp,
      url,
    ],
    { cwd: ROOT, stdio: "pipe", timeout: 7_300_000 }
  );
  assertPlayableDownload(tmp, url);
  fs.renameSync(tmp, destPath);
}

function downloadReleaseAssetViaGh(
  repo: string,
  filename: string,
  destPath: string
) {
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
    {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 20_000,
    }
  ).trim();
  if (!assetId) {
    throw new Error(`release asset not found: ${filename}`);
  }
  const token = execFileSync("gh", ["auth", "token"], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 10_000,
  }).trim();
  execFileSync(
    "curl",
    [
      "-fsSL",
      "--connect-timeout",
      "8",
      "--max-time",
      "7200",
      "--retry",
      "2",
      "--retry-delay",
      "1",
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
    { cwd: ROOT, stdio: "pipe", timeout: 7_300_000 }
  );
  assertPlayableDownload(tmp, `gh:${filename}`);
  fs.renameSync(tmp, destPath);
}

function assertPlayableDownload(tmp: string, label: string) {
  const size = fs.statSync(tmp).size;
  const needed = Math.max(
    minPlayableBytes(tmp),
    minPlayableBytes(label)
  );
  if (size < needed) {
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
    head.startsWith("version https://git-lfs.github.com/spec/v1")
  ) {
    try {
      fs.unlinkSync(tmp);
    } catch {
      // ignore
    }
    throw new Error(`download was not media bytes: ${label}`);
  }
}

function releaseHasAsset(available: Set<string>, releaseName: string) {
  return (
    available.has(releaseName) || available.has(partsManifestName(releaseName))
  );
}

function downloadReleaseAssetTo(
  repo: string,
  releaseName: string,
  destPath: string
) {
  const url = releaseAssetUrl(repo, releaseName);
  try {
    downloadToFile(url, destPath);
  } catch (publicErr) {
    if (!ghAvailable()) throw publicErr;
    downloadReleaseAssetViaGh(repo, releaseName, destPath);
  }
}

function restoreChunkedReleaseAsset(
  repo: string,
  releaseName: string,
  destPath: string,
  available: Set<string>
) {
  const manifestName = partsManifestName(releaseName);
  if (!available.has(manifestName)) {
    throw new Error(`missing parts manifest: ${manifestName}`);
  }
  const manifestPath = `${destPath}${PARTS_SUFFIX}.download`;
  downloadReleaseAssetTo(repo, manifestName, manifestPath);
  const manifest = JSON.parse(
    fs.readFileSync(manifestPath, "utf8")
  ) as PartsManifest;
  try {
    fs.unlinkSync(manifestPath);
  } catch {
    // ignore
  }
  if (!manifest?.parts?.length) {
    throw new Error(`invalid parts manifest: ${manifestName}`);
  }

  const tmp = `${destPath}.assemble`;
  try {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  } catch {
    // ignore
  }
  const out = fs.openSync(tmp, "w");
  try {
    for (const partName of manifest.parts) {
      if (!available.has(partName)) {
        throw new Error(`missing release part: ${partName}`);
      }
      const partTmp = `${destPath}.${partName}.download`;
      downloadReleaseAssetTo(repo, partName, partTmp);
      const bytes = fs.readFileSync(partTmp);
      fs.writeSync(out, bytes);
      try {
        fs.unlinkSync(partTmp);
      } catch {
        // ignore
      }
    }
  } finally {
    fs.closeSync(out);
  }
  assertPlayableDownload(tmp, destPath);
  fs.renameSync(tmp, destPath);
}

/** Fetch missing / LFS-pointer uploads from the durable GitHub Release. */
export function ensureMediaReleaseBytes() {
  const g = globalThis as GlobalMedia;
  if (g.whimpostMediaReleaseEnsuring) return { downloaded: 0 };
  g.whimpostMediaReleaseEnsuring = true;
  if (!g.whimpostMediaReleaseAttempted) {
    g.whimpostMediaReleaseAttempted = new Set();
  }

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

    // One cheap API list — skip assets that are not on the release (avoids
    // multi-minute curl retries against 404s during boot).
    const available = listReleaseAssetNames(repo);

    for (const entry of listCatalogEntries()) {
      const dest = entry.destPath;
      if (isPlayableMediaFile(dest)) continue;
      // Only replace missing files or Git LFS pointer stubs.
      if (fs.existsSync(dest) && !isLfsPointerFile(dest)) continue;
      if (g.whimpostMediaReleaseAttempted.has(entry.releaseName)) continue;
      g.whimpostMediaReleaseAttempted.add(entry.releaseName);

      if (!releaseHasAsset(available, entry.releaseName)) {
        continue;
      }

      fs.mkdirSync(path.dirname(dest), { recursive: true });
      try {
        if (available.has(partsManifestName(entry.releaseName))) {
          restoreChunkedReleaseAsset(
            repo,
            entry.releaseName,
            dest,
            available
          );
        } else {
          downloadReleaseAssetTo(repo, entry.releaseName, dest);
        }
        downloaded += 1;
        console.info(`[media-release] restored ${entry.releaseName}`);
      } catch (err) {
        console.warn(
          `[media-release] could not restore ${entry.releaseName}:`,
          err instanceof Error ? err.message : err
        );
      }
    }
  } finally {
    g.whimpostMediaReleaseEnsuring = false;
  }
  return { downloaded };
}

/**
 * Restore one upload from the release shelf (library EPUB/PDF, TV clip,
 * celestial audio, letter images, etc.).
 * Returns the local path when playable bytes are present afterward.
 */
export function ensureMediaReleaseAsset(filename: string): string | null {
  const raw = String(filename || "").trim();
  if (!raw || raw.includes("..") || raw.includes("/") || raw.includes("\\")) {
    return null;
  }
  const safe = path.basename(raw);
  if (!safe || safe !== raw) return null;

  // Celestial Sounds live under data/uploads/moon-sounds/ with a prefixed
  // release asset name (moon-sounds--<file>).
  const isMoonSound = /^[a-f0-9-]+\.(mp3|wav|ogg|webm|m4a|aac)$/i.test(safe);
  const dest = isMoonSound
    ? moonSoundAbsolutePath(safe)
    : path.join(UPLOAD_DIR, safe);
  const releaseName = isMoonSound ? moonSoundReleaseName(safe) : safe;

  if (isPlayableMediaFile(dest)) return dest;

  const repo = repoSlug();
  if (!repo) return isPlayableMediaFile(dest) ? dest : null;

  const available = listReleaseAssetNames(repo);
  if (!releaseHasAsset(available, releaseName)) {
    return isPlayableMediaFile(dest) ? dest : null;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    if (available.has(partsManifestName(releaseName))) {
      restoreChunkedReleaseAsset(repo, releaseName, dest, available);
    } else {
      downloadReleaseAssetTo(repo, releaseName, dest);
    }
  } catch (err) {
    console.warn(
      `[media-release] on-demand restore failed for ${releaseName}:`,
      err instanceof Error ? err.message : err
    );
    return isPlayableMediaFile(dest) ? dest : null;
  }

  return isPlayableMediaFile(dest) ? dest : null;
}

/** Convenience wrapper for Observatory playlist audio. */
export function ensureMoonSoundAsset(filename: string): string | null {
  return ensureMediaReleaseAsset(path.basename(filename));
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

function uploadReleaseFile(repo: string, filePath: string) {
  execFileSync(
    "gh",
    [
      "release",
      "upload",
      MEDIA_RELEASE_TAG,
      filePath,
      "--repo",
      repo,
      "--clobber",
    ],
    { cwd: ROOT, stdio: "pipe", timeout: 3 * 60 * 60_000 }
  );
  invalidateMediaReleaseAssetCache();
}

function publishOneShelfEntry(
  repo: string,
  entry: MediaShelfEntry,
  available: Set<string> | null
) {
  if (available && releaseHasAsset(available, entry.releaseName)) {
    return false;
  }
  const size = fs.statSync(entry.destPath).size;
  const stagingDir = path.join(ROOT, "data", ".media-release-staging");
  fs.mkdirSync(stagingDir, { recursive: true });

  if (size <= MEDIA_RELEASE_PART_MAX) {
    // gh names the asset from the file basename — stage when release name differs
    // (celestial sounds use moon-sounds--<file> on the shelf).
    if (path.basename(entry.destPath) === entry.releaseName) {
      uploadReleaseFile(repo, entry.destPath);
      return true;
    }
    const staged = path.join(stagingDir, entry.releaseName);
    try {
      fs.copyFileSync(entry.destPath, staged);
      uploadReleaseFile(repo, staged);
      return true;
    } finally {
      try {
        if (fs.existsSync(staged)) fs.unlinkSync(staged);
      } catch {
        // ignore
      }
    }
  }
  const partCount = Math.ceil(size / MEDIA_RELEASE_PART_MAX);
  const parts: string[] = [];
  const fd = fs.openSync(entry.destPath, "r");
  try {
    for (let i = 0; i < partCount; i++) {
      const partName = partAssetName(entry.releaseName, i);
      parts.push(partName);
      const partPath = path.join(stagingDir, partName);
      const start = i * MEDIA_RELEASE_PART_MAX;
      const length = Math.min(MEDIA_RELEASE_PART_MAX, size - start);
      const buf = Buffer.alloc(length);
      fs.readSync(fd, buf, 0, length, start);
      fs.writeFileSync(partPath, buf);
      try {
        uploadReleaseFile(repo, partPath);
      } finally {
        try {
          fs.unlinkSync(partPath);
        } catch {
          // ignore
        }
      }
    }
  } finally {
    fs.closeSync(fd);
  }

  const manifest: PartsManifest = {
    version: 1,
    filename: entry.releaseName,
    sizeBytes: size,
    partSize: MEDIA_RELEASE_PART_MAX,
    parts,
  };
  const manifestPath = path.join(
    stagingDir,
    partsManifestName(entry.releaseName)
  );
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`, "utf8");
  try {
    uploadReleaseFile(repo, manifestPath);
  } finally {
    try {
      fs.unlinkSync(manifestPath);
    } catch {
      // ignore
    }
  }
  return true;
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
  let available: Set<string> | null = null;
  try {
    available = listReleaseAssetNames(repo);
  } catch {
    available = null;
  }
  const targets = listCatalogEntries().filter((entry) => {
    if (wanted && !wanted.has(entry.releaseName)) return false;
    if (!isPlayableMediaFile(entry.destPath)) return false;
    // Skip assets already on the release (single file or chunked parts).
    if (available && releaseHasAsset(available, entry.releaseName)) {
      return false;
    }
    return true;
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

  let uploaded = 0;
  for (const entry of targets) {
    try {
      if (publishOneShelfEntry(repo, entry, available)) {
        uploaded += 1;
        console.info(`[media-release] published ${entry.releaseName}`);
        // Refresh so later targets in this batch see new assets.
        try {
          available = listReleaseAssetNames(repo);
        } catch {
          available = null;
        }
      }
    } catch (err) {
      console.warn(
        `[media-release] upload failed for ${entry.releaseName}:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  return { ok: uploaded > 0 || targets.length === 0, uploaded };
}

/**
 * Publish specific uploaded filenames to the durable shelf immediately
 * (does not wait for the debounced catalog git sync).
 */
export function publishUploadedMediaNow(filenames: string[]) {
  const names = filenames
    .map((name) => path.basename(String(name || "").trim()))
    .filter(Boolean);
  if (!names.length) return { ok: true, uploaded: 0 };
  try {
    return publishMediaReleaseAssets(names);
  } catch (err) {
    console.warn(
      "[media-release] eager publish failed:",
      err instanceof Error ? err.message : err
    );
    return {
      ok: false,
      uploaded: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
