import fs from "fs";
import path from "path";
import {
  isValidVillageMediaKey,
  isValidVillageMediaUrl,
  type VillageMediaMap,
} from "@/lib/villageMediaShared";

export type { VillageMediaMap };
export {
  villageMediaKey,
  resolveVillageImage,
  isValidVillageMediaKey,
} from "@/lib/villageMediaShared";

/**
 * Owner overrides for catalog images in village workshops
 * (Woodland Workshop, Garden, Fireside, Observatory).
 * Keys look like `workshop:diy:bird-feeder` → `/api/uploads/….jpg`.
 */
export const PERSISTENT_VILLAGE_MEDIA_PATH = path.join(
  process.cwd(),
  "data",
  "persistent-village-media.json"
);

type VillageMediaFile = {
  version: 1;
  updatedAt: string;
  images: VillageMediaMap;
};

function readFile(): VillageMediaFile {
  try {
    if (!fs.existsSync(PERSISTENT_VILLAGE_MEDIA_PATH)) {
      return { version: 1, updatedAt: new Date().toISOString(), images: {} };
    }
    const raw = fs.readFileSync(PERSISTENT_VILLAGE_MEDIA_PATH, "utf8");
    const parsed = JSON.parse(raw) as VillageMediaFile;
    if (!parsed || typeof parsed.images !== "object" || !parsed.images) {
      return { version: 1, updatedAt: new Date().toISOString(), images: {} };
    }
    const images: VillageMediaMap = {};
    for (const [key, url] of Object.entries(parsed.images)) {
      if (
        isValidVillageMediaKey(key) &&
        typeof url === "string" &&
        isValidVillageMediaUrl(url)
      ) {
        images[key] = url;
      }
    }
    return {
      version: 1,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      images,
    };
  } catch {
    return { version: 1, updatedAt: new Date().toISOString(), images: {} };
  }
}

function writeFile(images: VillageMediaMap) {
  const dir = path.dirname(PERSISTENT_VILLAGE_MEDIA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const sorted: VillageMediaMap = {};
  for (const key of Object.keys(images).sort()) {
    sorted[key] = images[key]!;
  }
  const payload: VillageMediaFile = {
    version: 1,
    updatedAt: new Date().toISOString(),
    images: sorted,
  };
  const tmp = `${PERSISTENT_VILLAGE_MEDIA_PATH}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.renameSync(tmp, PERSISTENT_VILLAGE_MEDIA_PATH);
}

export function getVillageMediaOverrides(): VillageMediaMap {
  return { ...readFile().images };
}

export function setVillageMediaOverride(key: string, url: string) {
  if (!isValidVillageMediaKey(key)) throw new Error("Invalid media key");
  if (!isValidVillageMediaUrl(url)) throw new Error("Invalid image URL");
  const file = readFile();
  file.images[key] = url;
  writeFile(file.images);
  return file.images[key];
}

export function clearVillageMediaOverride(key: string) {
  if (!isValidVillageMediaKey(key)) throw new Error("Invalid media key");
  const file = readFile();
  if (!(key in file.images)) return false;
  delete file.images[key];
  writeFile(file.images);
  return true;
}
