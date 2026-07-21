import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  createVideo,
  getChannelById,
  resolveTvUpload,
  type TvChannel,
  type TvVideo,
} from "@/lib/tvCorner";

export const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
export const INCOMING_DIR = path.join(UPLOAD_DIR, ".incoming");

/** Keep chunks small so tunnel / proxy body limits don't kill big movies. */
export const TV_CHUNK_SIZE = 2 * 1024 * 1024; // 2MB
export const TV_CHUNK_MAX = 5 * 1024 * 1024 * 1024;

export type UploadSessionMeta = {
  id: string;
  channelId: string;
  title: string;
  filename: string;
  mime: string;
  ext: string;
  size: number;
  chunkSize: number;
  chunkCount: number;
  received: number[];
  uploaderId: string;
  villageId: string | null;
  createdAt: string;
};

export function ensureUploadDirs() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(INCOMING_DIR)) {
    fs.mkdirSync(INCOMING_DIR, { recursive: true });
  }
}

function metaPath(uploadId: string) {
  return path.join(INCOMING_DIR, `${uploadId}.json`);
}

function chunkPath(uploadId: string, index: number) {
  return path.join(INCOMING_DIR, `${uploadId}.part.${index}`);
}

export function readUploadMeta(uploadId: string): UploadSessionMeta | null {
  const file = metaPath(uploadId);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as UploadSessionMeta;
  } catch {
    return null;
  }
}

export function writeUploadMeta(meta: UploadSessionMeta) {
  ensureUploadDirs();
  fs.writeFileSync(metaPath(meta.id), JSON.stringify(meta));
}

export function cleanupUploadSession(uploadId: string) {
  const meta = readUploadMeta(uploadId);
  if (meta) {
    for (let i = 0; i < meta.chunkCount; i++) {
      const part = chunkPath(uploadId, i);
      if (fs.existsSync(part)) fs.unlinkSync(part);
    }
  } else {
    // Best-effort wipe of any leftover parts.
    if (fs.existsSync(INCOMING_DIR)) {
      for (const name of fs.readdirSync(INCOMING_DIR)) {
        if (name.startsWith(`${uploadId}.`)) {
          fs.unlinkSync(path.join(INCOMING_DIR, name));
        }
      }
    }
  }
  const file = metaPath(uploadId);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

export function createUploadSession(input: {
  channelId: string;
  title: string;
  filename: string;
  mime: string;
  size: number;
  uploaderId: string;
  villageId: string | null;
}): { ok: true; meta: UploadSessionMeta } | { ok: false; error: string } {
  const resolved = resolveTvUpload({
    name: input.filename,
    type: input.mime,
    size: input.size,
  });
  if (!resolved.ok) return { ok: false, error: resolved.error };

  const channel = getChannelById(input.channelId);
  if (!channel) {
    return { ok: false, error: "Create a channel first, then upload videos to it" };
  }

  const chunkSize = TV_CHUNK_SIZE;
  const chunkCount = Math.max(1, Math.ceil(input.size / chunkSize));
  const title =
    input.title.trim().slice(0, 80) ||
    input.filename.replace(/\.[^.]+$/, "").slice(0, 80) ||
    "Untitled clip";

  const meta: UploadSessionMeta = {
    id: randomUUID(),
    channelId: channel.id,
    title,
    filename: input.filename,
    mime: resolved.mime,
    ext: resolved.ext,
    size: input.size,
    chunkSize,
    chunkCount,
    received: [],
    uploaderId: input.uploaderId,
    villageId: channel.villageId,
    createdAt: new Date().toISOString(),
  };

  ensureUploadDirs();
  writeUploadMeta(meta);
  return { ok: true, meta };
}

export function saveChunk(
  uploadId: string,
  index: number,
  data: Buffer
): { ok: true; meta: UploadSessionMeta } | { ok: false; error: string; status?: number } {
  const meta = readUploadMeta(uploadId);
  if (!meta) return { ok: false, error: "Upload session expired — try again", status: 404 };
  if (index < 0 || index >= meta.chunkCount) {
    return { ok: false, error: "Invalid chunk index", status: 400 };
  }
  if (data.length <= 0) {
    return { ok: false, error: "Empty chunk received", status: 400 };
  }
  // Last chunk may be smaller; others should be full size (allow smaller for last).
  if (index < meta.chunkCount - 1 && data.length > meta.chunkSize) {
    return { ok: false, error: "Chunk too large", status: 400 };
  }

  ensureUploadDirs();
  fs.writeFileSync(chunkPath(uploadId, index), data);
  if (!meta.received.includes(index)) {
    meta.received.push(index);
    meta.received.sort((a, b) => a - b);
    writeUploadMeta(meta);
  }
  return { ok: true, meta };
}

export function completeUploadSession(
  uploadId: string,
  uploaderId: string
):
  | { ok: true; video: TvVideo; channel: TvChannel | null }
  | { ok: false; error: string; status?: number } {
  const meta = readUploadMeta(uploadId);
  if (!meta) return { ok: false, error: "Upload session expired — try again", status: 404 };
  if (meta.uploaderId !== uploaderId) {
    return { ok: false, error: "Not your upload session", status: 403 };
  }
  if (meta.received.length !== meta.chunkCount) {
    return {
      ok: false,
      error: `Upload incomplete (${meta.received.length}/${meta.chunkCount} chunks)`,
      status: 400,
    };
  }

  ensureUploadDirs();
  const finalName = `${randomUUID()}.${meta.ext}`;
  const destPath = path.join(UPLOAD_DIR, finalName);

  try {
    for (let i = 0; i < meta.chunkCount; i++) {
      const part = chunkPath(uploadId, i);
      if (!fs.existsSync(part)) {
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        return { ok: false, error: `Missing chunk ${i}`, status: 400 };
      }
    }
    const out = fs.openSync(destPath, "w");
    try {
      for (let i = 0; i < meta.chunkCount; i++) {
        fs.writeSync(out, fs.readFileSync(chunkPath(uploadId, i)));
      }
    } finally {
      fs.closeSync(out);
    }
  } catch (err) {
    if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
    console.error("[tv upload] assemble failed", err);
    return { ok: false, error: "Could not assemble upload — try again", status: 500 };
  }
  const sizeBytes = fs.statSync(destPath).size;
  if (sizeBytes <= 0) {
    fs.unlinkSync(destPath);
    cleanupUploadSession(uploadId);
    return { ok: false, error: "That upload arrived empty", status: 400 };
  }
  if (sizeBytes < meta.size * 0.98) {
    fs.unlinkSync(destPath);
    cleanupUploadSession(uploadId);
    return {
      ok: false,
      error: "Upload was cut off before it finished — try again",
      status: 400,
    };
  }

  const video = createVideo({
    title: meta.title,
    filename: finalName,
    mime: meta.mime,
    sizeBytes,
    uploaderId: meta.uploaderId,
    villageId: meta.villageId,
    channelId: meta.channelId,
  });

  cleanupUploadSession(uploadId);

  return {
    ok: true,
    video,
    channel: getChannelById(meta.channelId),
  };
}
