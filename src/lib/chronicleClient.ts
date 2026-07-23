import type { ChronicleUnlockPayload } from "@/lib/chronicle";

export function emitChronicleUnlock(
  payload: ChronicleUnlockPayload | null | undefined
) {
  if (typeof window === "undefined" || !payload) return;
  if (!payload.newlyUnlocked?.length && !payload.justCompleted) return;
  window.dispatchEvent(
    new CustomEvent("whimpost:chronicle-unlock", { detail: payload })
  );
}
