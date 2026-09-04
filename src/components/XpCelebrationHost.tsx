"use client";

import { useEffect, useState } from "react";
import { COLLECTIBLE_META } from "@/lib/villages";
import type { XpCelebrationDetail } from "@/lib/xpCelebrate";
import {
  bindXpCelebrationAudioUnlock,
  celebrationSoundKind,
  playXpCelebrationSound,
} from "@/lib/xpCelebrationSound";

type Toast = XpCelebrationDetail & { id: number };

/**
 * Global cottagecore celebration toasts whenever a villager earns XP,
 * forest standing, or collectibles — each with a soft whimsical chime.
 */
export function XpCelebrationHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    bindXpCelebrationAudioUnlock();
    function onCelebrate(e: Event) {
      const detail = (e as CustomEvent<XpCelebrationDetail>).detail;
      if (!detail) return;
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [...prev.slice(-2), { ...detail, id }]);
      void playXpCelebrationSound(celebrationSoundKind(detail));
    }
    window.addEventListener("whimpost:xp-celebrate", onCelebrate);
    return () =>
      window.removeEventListener("whimpost:xp-celebrate", onCelebrate);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const newest = toasts[toasts.length - 1];
    const t = window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== newest.id));
    }, 5600);
    return () => window.clearTimeout(t);
  }, [toasts]);

  if (toasts.length === 0) return null;

  return (
    <div className="xp-celeb-stack" aria-live="polite">
      {toasts.map((toast) => (
        <aside key={toast.id} className="xp-celeb-toast" role="status">
          <div className="xp-celeb-sparkles" aria-hidden>
            <span />
            <span />
            <span />
            <span />
          </div>
          {toast.eyebrow ? (
            <p className="xp-celeb-eyebrow">{toast.eyebrow}</p>
          ) : null}
          <h2 className="xp-celeb-title">{toast.title}</h2>
          <p className="xp-celeb-body">{toast.body}</p>
          <div className="xp-celeb-chips">
            {toast.xp ? (
              <span className="xp-celeb-chip">+{toast.xp} XP</span>
            ) : null}
            {toast.reputation ? (
              <span className="xp-celeb-chip">
                +{toast.reputation} standing
              </span>
            ) : null}
            {(toast.collectibles || []).map((k) => (
              <span key={`${toast.id}-${k}`} className="xp-celeb-chip gift">
                {COLLECTIBLE_META[k].emoji} {COLLECTIBLE_META[k].name}
              </span>
            ))}
          </div>
          <button
            type="button"
            className="xp-celeb-dismiss"
            onClick={() =>
              setToasts((prev) => prev.filter((x) => x.id !== toast.id))
            }
          >
            Softly tuck away
          </button>
        </aside>
      ))}
    </div>
  );
}
