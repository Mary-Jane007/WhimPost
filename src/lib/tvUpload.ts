import fs from "fs";
import path from "path";

/**
 * Chunked channel uploads belonged to the later TV redesign.
 * Fresh-start TV Corner uses the simple /api/tv/videos multipart upload.
 * These helpers remain so old upload routes can soft-fail cleanly.
 */

export const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
export const INCOMING_DIR = path.join(UPLOAD_DIR, ".incoming");
export const TV_CHUNK_SIZE = 2 * 1024 * 1024;
export const TV_CHUNK_MAX = 80 * 1024 * 1024;

export type UploadSessionMeta = {
  id: string;
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

export function writeUploadMeta(_meta: UploadSessionMeta) {
  // no-op — chunked sessions disabled
}

export function readUploadMeta(_uploadId: string): UploadSessionMeta | null {
  return null;
}

export function deleteUploadSession(_uploadId: string) {
  // no-op
}
