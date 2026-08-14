import { jsonError } from "@/lib/auth";

/** Chat was not part of the first TV Corner design — disabled for the reset. */
export async function POST() {
  return jsonError("Lounge chat is resting — watch together on the set", 410);
}
