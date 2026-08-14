import { jsonError } from "@/lib/auth";

/** Chunked channel uploads are disabled — use the clip shelf upload on TV Corner. */
export async function POST() {
  return jsonError(
    "Use the clip shelf upload on TV Corner (simple MP4 / WebM / MOV)",
    410
  );
}
