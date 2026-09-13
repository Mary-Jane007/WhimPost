#!/usr/bin/env node
/**
 * Verify TV Corner durable shelf: catalog floor, lock markers, and release assets.
 * Exit 1 when the shelf is thinner than the lock or release holes remain.
 */
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const root = process.cwd();
const RELEASE_TAG = process.env.WHIMPOST_MEDIA_RELEASE_TAG || "whimpost-media";
const catalogPath = path.join(root, "data", "persistent-tv-media.json");
const floorPath = path.join(root, "data", "locked-tv-media.json");
const lockPath = path.join(root, "data", "locked-main.json");
const uploadDir = path.join(root, "data", "uploads");

function readClips(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return Array.isArray(parsed.clips) ? parsed.clips : [];
}

const problems = [];

if (!fs.existsSync(lockPath)) problems.push("missing data/locked-main.json");
if (!fs.existsSync(floorPath)) problems.push("missing data/locked-tv-media.json");
if (!fs.existsSync(catalogPath)) {
  problems.push("missing data/persistent-tv-media.json");
}

const lock = fs.existsSync(lockPath)
  ? JSON.parse(fs.readFileSync(lockPath, "utf8"))
  : null;
const floor = fs.existsSync(floorPath) ? readClips(floorPath) : [];
const catalog = fs.existsSync(catalogPath) ? readClips(catalogPath) : [];
const catalogNames = new Set(catalog.map((c) => c.filename));

for (const clip of floor) {
  if (!catalogNames.has(clip.filename)) {
    problems.push(`catalog missing locked clip: ${clip.channelTitle} / ${clip.title}`);
  }
}

if (lock?.requiredMarkers) {
  for (const marker of lock.requiredMarkers) {
    const abs = path.join(root, marker.path);
    if (!fs.existsSync(abs)) {
      problems.push(`missing marker file: ${marker.path}`);
      continue;
    }
    if (marker.includes) {
      const text = fs.readFileSync(abs, "utf8");
      if (!text.includes(marker.includes)) {
        problems.push(`marker missing in ${marker.path}: ${marker.includes}`);
      }
    }
    if (typeof marker.minClips === "number") {
      try {
        const clips = readClips(abs);
        if (clips.length < marker.minClips) {
          problems.push(
            `thin catalog ${marker.path}: ${clips.length}<${marker.minClips}`
          );
        }
      } catch {
        // non-json marker paths are fine
      }
    }
  }
}

let releaseAssets = new Set();
try {
  const raw = execFileSync(
    "gh",
    ["release", "view", RELEASE_TAG, "--json", "assets", "--jq", ".assets[].name"],
    { encoding: "utf8" }
  );
  releaseAssets = new Set(raw.split("\n").map((s) => s.trim()).filter(Boolean));
} catch (err) {
  problems.push(
    `could not list release ${RELEASE_TAG}: ${err instanceof Error ? err.message : err}`
  );
}

const missingRelease = [];
const standinOnly = [];
for (const clip of catalog) {
  const fn = clip.filename;
  const onRelease =
    releaseAssets.has(fn) ||
    [...releaseAssets].some(
      (a) => a.startsWith(`${fn}.part`) || a === `${fn}.whimparts.json`
    );
  if (!onRelease) missingRelease.push(`${clip.channelTitle} / ${clip.title} (${fn})`);

  const local = path.join(uploadDir, fn);
  if (fs.existsSync(local)) {
    const size = fs.statSync(local).size;
    const head = fs.readFileSync(local).subarray(0, 40).toString("utf8");
    if (size < 8192 || head.startsWith("version https://git-lfs")) {
      standinOnly.push(fn);
    }
  }
}

if (missingRelease.length) {
  for (const row of missingRelease) {
    problems.push(`missing on ${RELEASE_TAG}: ${row}`);
  }
}

console.log(
  JSON.stringify(
    {
      catalogClips: catalog.length,
      lockedClips: floor.length,
      releaseAssets: releaseAssets.size,
      missingRelease: missingRelease.length,
      lfsOrTinyLocal: standinOnly.length,
      ok: problems.length === 0,
      problems,
    },
    null,
    2
  )
);

if (problems.length) process.exit(1);
