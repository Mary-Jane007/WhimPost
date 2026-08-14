import fs from "fs";
import path from "path";
import { UPLOAD_DIR } from "@/lib/persistentTvMedia";

/**
 * Git-tracked catalog of generic site uploads (letter images, covers,
 * workshop photos, chronicle images, etc.) so they restore from the
 * whimpost-media release shelf on any server until removed.
 */
export const PERSISTENT_SITE_UPLOADS_PATH = path.join(
  process.cwd(),
  "data",
  "persistent-site-uploads.json"
);

export type PersistentSiteUpload = {
  filename: string;
  mime: string;
  sizeBytes: number;
  uploadedAt: string;
};

type PersistentSiteUploadsFile = {
  version: 1;
  updatedAt: string;
  files: PersistentSiteUpload[];
};

const SAFE_NAME = /^[a-f0-9-]+\.(jpe?g|png|webp|gif|pdf|epub)$/i;

function readFile(): PersistentSiteUploadsFile {
  try {
    if (!fs.existsSync(PERSISTENT_SITE_UPLOADS_PATH)) {
      return { version: 1, updatedAt: new Date().toISOString(), files: [] };
    }
    const raw = fs.readFileSync(PERSISTENT_SITE_UPLOADS_PATH, "utf8");
    const parsed = JSON.parse(raw) as PersistentSiteUploadsFile;
    if (!parsed || !Array.isArray(parsed.files)) {
      return { version: 1, updatedAt: new Date().toISOString(), files: [] };
    }
    return parsed;
  } catch {
    return { version: 1, updatedAt: new Date().toISOString(), files: [] };
  }
}

function writeFile(files: PersistentSiteUpload[]) {
  const dir = path.dirname(PERSISTENT_SITE_UPLOADS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const payload: PersistentSiteUploadsFile = {
    version: 1,
    updatedAt: new Date().toISOString(),
    files: files
      .filter((f) => SAFE_NAME.test(f.filename))
      .sort((a, b) => a.filename.localeCompare(b.filename)),
  };
  const tmp = `${PERSISTENT_SITE_UPLOADS_PATH}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.renameSync(tmp, PERSISTENT_SITE_UPLOADS_PATH);
}

/** Record a freshly uploaded site file so it survives server resets. */
export function recordPersistentSiteUpload(input: {
  filename: string;
  mime: string;
  sizeBytes: number;
}) {
  const filename = path.basename(String(input.filename || "").trim());
  if (!SAFE_NAME.test(filename)) return;
  const abs = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(abs)) return;

  const file = readFile();
  const next = file.files.filter((f) => f.filename !== filename);
  next.push({
    filename,
    mime: String(input.mime || "application/octet-stream").slice(0, 80),
    sizeBytes: Math.max(0, Math.floor(input.sizeBytes || 0)),
    uploadedAt: new Date().toISOString(),
  });
  writeFile(next);
}

/** Drop a site upload from the durable catalog (manual delete). */
export function removePersistentSiteUpload(filename: string) {
  const safe = path.basename(String(filename || "").trim());
  if (!safe) return;
  const file = readFile();
  writeFile(file.files.filter((f) => f.filename !== safe));
}

/** List catalogued site uploads that still exist on disk. */
export function listPersistentSiteUploads(): PersistentSiteUpload[] {
  const file = readFile();
  return file.files.filter((f) => {
    const abs = path.join(UPLOAD_DIR, f.filename);
    try {
      return fs.existsSync(abs) && fs.statSync(abs).size >= 32;
    } catch {
      return false;
    }
  });
}
