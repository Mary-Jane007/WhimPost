import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  createVideo,
  getChannelById,
  resolveTvUpload,
  safeUploadFilename,
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
  const target = metaPath(meta.id);
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(meta));
  fs.renameSync(tmp, target);
}

function listReceivedChunks(uploadId: string, chunkCount: number) {
  const received: number[] = [];
  for (let i = 0; i < chunkCount; i++) {
    if (fs.existsSync(chunkPath(uploadId, i))) received.push(i);
  }
  return received;
}

export function cleanupUploadSession(uploadId: string) {
  const meta = readUploadMeta(uploadId);
  if (meta) {
    for (let i = 0; i < meta.chunkCount; i++) {
      const part = chunkPath(uploadId, i);
      if (fs.existsSync(part)) fs.unlinkSync(part);
    }
  } else if (fs.existsSync(INCOMING_DIR)) {
    for (const name of fs.readdirSync(INCOMING_DIR)) {
      if (name.startsWith(`${uploadId}.`)) {
        fs.unlinkSync(path.join(INCOMING_DIR, name));
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
  const filename = safeUploadFilename(input.filename);
  const resolved = resolveTvUpload({
    name: filename,
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
    filename.replace(/\.[^.]+$/, "").slice(0, 80) ||
    "Untitled clip";

  const meta: UploadSessionMeta = {
    id: randomUUID(),
    channelId: channel.id,
    title,
    filename,
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
  if (data.length > meta.chunkSize) {
    return { ok: false, error: "Chunk too large", status: 400 };
  }

  ensureUploadDirs();
  // Overwrite is intentional — client retries rewrite the same piece.
  fs.writeFileSync(chunkPath(uploadId, index), data);
  // Rebuild from disk so parallel/retry writes never lose pieces.
  meta.received = listReceivedChunks(uploadId, meta.chunkCount);
  writeUploadMeta(meta);
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

  const received = listReceivedChunks(uploadId, meta.chunkCount);
  meta.received = received;
  writeUploadMeta(meta);

  if (received.length !== meta.chunkCount) {
    return {
      ok: false,
      error: `Upload incomplete (${received.length}/${meta.chunkCount} chunks) — try again`,
      status: 400,
    };
  }

  ensureUploadDirs();
  for (const i of received) {
    if (!fs.existsSync(chunkPath(uploadId, i))) {
      return { ok: false, error: `Missing chunk ${i} — try again`, status: 400 };
    }
  }

  const finalName = `${randomUUID()}.${meta.ext}`;
  const destPath = path.join(UPLOAD_DIR, finalName);

  try {
    const fd = fs.openSync(destPath, "w");
    try {
      for (let i = 0; i < meta.chunkCount; i++) {
        fs.writeSync(fd, fs.readFileSync(chunkPath(uploadId, i)));
      }
    } finally {
      fs.closeSync(fd);
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
