import type { XpCelebrationDetail } from "@/lib/xpCelebrate";

/** Fire a cottagecore on-screen celebration (picked up by XpCelebrationHost). */
export function emitXpCelebration(detail: XpCelebrationDetail | null) {
  if (typeof window === "undefined" || !detail) return;
  window.dispatchEvent(
    new CustomEvent("whimpost:xp-celebrate", { detail })
  );
}
