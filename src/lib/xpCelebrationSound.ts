/**
 * Soft cottagecore chimes for XP celebration toasts.
 * Unlocks AudioContext on first gesture, awaits resume, and plays audibly.
 */

type SoundKind = "xp" | "gift" | "standing" | "mixed";

let sharedCtx: AudioContext | null = null;
let unlockBound = false;

function getAudioContextCtor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext ||
    null
  );
}

function getCtx(): AudioContext | null {
  const AC = getAudioContextCtor();
  if (!AC) return null;
  if (!sharedCtx) sharedCtx = new AC();
  return sharedCtx;
}

/** Call once from the host so the first click unlocks browser audio. */
export function bindXpCelebrationAudioUnlock() {
  if (typeof window === "undefined" || unlockBound) return;
  unlockBound = true;
  const unlock = () => {
    const ctx = getCtx();
    if (ctx && ctx.state === "suspended") {
      void ctx.resume();
    }
  };
  window.addEventListener("pointerdown", unlock, { capture: true });
  window.addEventListener("keydown", unlock, { capture: true });
  window.addEventListener("touchstart", unlock, { capture: true });
}

function tone(
  ctx: AudioContext,
  freq: number,
  start: number,
  dur: number,
  gainPeak: number,
  type: OscillatorType = "sine"
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 3200;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  // Linear ramps are more reliable at audible levels than tiny exponential starts.
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(gainPeak, start + 0.03);
  gain.gain.linearRampToValueAtTime(gainPeak * 0.55, start + dur * 0.45);
  gain.gain.linearRampToValueAtTime(0, start + dur);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

async function ensureRunning(): Promise<AudioContext | null> {
  const ctx = getCtx();
  if (!ctx) return null;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return null;
    }
  }
  return ctx.state === "running" ? ctx : null;
}

/** Fallback HTMLAudio beep if Web Audio is blocked. */
function playFallbackChime() {
  try {
    const audio = new Audio("/sounds/xp-chime.wav");
    audio.volume = 0.85;
    void audio.play().catch(() => {
      /* ignore */
    });
  } catch {
    /* ignore */
  }
}

/** Whimsical woodland chime — awaits unlock so the first note is actually heard. */
export async function playXpCelebrationSound(kind: SoundKind = "xp") {
  try {
    const ctx = await ensureRunning();
    if (!ctx) {
      playFallbackChime();
      return;
    }

    const now = ctx.currentTime + 0.01;
    const wobble = () => 0.98 + Math.random() * 0.04;

    // Louder, clearer bells (still gentle, but hearable)
    const base = [523.25, 659.25, 783.99, 880.0, 1046.5];

    if (kind === "gift") {
      [0, 1, 2, 4].forEach((i, step) => {
        tone(
          ctx,
          base[i] * wobble(),
          now + step * 0.1,
          0.5,
          0.28 - step * 0.03,
          "triangle"
        );
      });
      tone(ctx, base[4] * 1.5 * wobble(), now + 0.42, 0.65, 0.18, "sine");
      return;
    }

    if (kind === "standing") {
      tone(ctx, 220 * wobble(), now, 0.85, 0.16, "triangle");
      tone(ctx, base[0] * wobble(), now + 0.1, 0.55, 0.26, "sine");
      tone(ctx, base[2] * wobble(), now + 0.26, 0.7, 0.22, "sine");
      return;
    }

    if (kind === "mixed") {
      [0, 2, 4].forEach((i, step) => {
        tone(
          ctx,
          base[i] * wobble(),
          now + step * 0.13,
          0.6,
          0.3 - step * 0.04,
          "triangle"
        );
      });
      tone(ctx, base[3] * wobble(), now + 0.45, 0.55, 0.2, "sine");
      return;
    }

    // Default XP
    tone(ctx, base[1] * wobble(), now, 0.5, 0.28, "sine");
    tone(ctx, base[3] * wobble(), now + 0.15, 0.65, 0.26, "triangle");
    tone(ctx, base[2] * wobble(), now + 0.32, 0.55, 0.2, "sine");
  } catch {
    playFallbackChime();
  }
}

export function celebrationSoundKind(detail: {
  xp?: number;
  reputation?: number;
  collectibles?: unknown[];
}): SoundKind {
  const hasXp = (detail.xp || 0) > 0;
  const hasRep = (detail.reputation || 0) > 0;
  const hasGift = (detail.collectibles || []).length > 0;
  if (hasGift && (hasXp || hasRep)) return "mixed";
  if (hasGift) return "gift";
  if (hasRep && !hasXp) return "standing";
  return "xp";
}
