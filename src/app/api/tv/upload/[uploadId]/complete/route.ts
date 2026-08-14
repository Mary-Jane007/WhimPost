import { jsonError } from "@/lib/auth";

export async function POST() {
  return jsonError("Chunked TV uploads are disabled", 410);
}
