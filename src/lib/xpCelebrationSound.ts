/**
 * Soft cottagecore chimes for XP celebration toasts.
 * Uses Web Audio so we don't need binary assets; each play varies slightly.
 */

type SoundKind = "xp" | "gift" | "standing" | "mixed";

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  if (!sharedCtx) sharedCtx = new AC();
  return sharedCtx;
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
  filter.frequency.value = 2400;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

/** Whimsical woodland chime — slight randomness so repeats don't feel stiff. */
export function playXpCelebrationSound(kind: SoundKind = "xp") {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    void ctx.resume();

    const now = ctx.currentTime + 0.02;
    const wobble = () => 0.97 + Math.random() * 0.06;

    // Pentatonic-ish soft bells (C major-ish: C E G A C)
    const base = [
      523.25, // C5
      659.25, // E5
      783.99, // G5
      880.0, // A5
      1046.5, // C6
    ];

    if (kind === "gift") {
      // Sparkling keepake: quick ascending twinkle
      [0, 1, 2, 4].forEach((i, step) => {
        tone(
          ctx,
          base[i] * wobble(),
          now + step * 0.09,
          0.55,
          0.045 - step * 0.004,
          "triangle"
        );
      });
      tone(ctx, base[4] * 1.5 * wobble(), now + 0.38, 0.7, 0.03, "sine");
      return;
    }

    if (kind === "standing") {
      // Warm kettle hum + two soft notes
      tone(ctx, 196 * wobble(), now, 0.9, 0.025, "triangle");
      tone(ctx, base[0] * wobble(), now + 0.08, 0.6, 0.04, "sine");
      tone(ctx, base[2] * wobble(), now + 0.22, 0.7, 0.035, "sine");
      return;
    }

    if (kind === "mixed") {
      // Little fanfare: three rising notes + sparkle
      [0, 2, 4].forEach((i, step) => {
        tone(
          ctx,
          base[i] * wobble(),
          now + step * 0.12,
          0.65,
          0.048 - step * 0.005,
          "triangle"
        );
      });
      tone(ctx, base[3] * wobble(), now + 0.42, 0.5, 0.028, "sine");
      return;
    }

    // Default XP: soft two-note woodland chime
    tone(ctx, base[1] * wobble(), now, 0.55, 0.04, "sine");
    tone(ctx, base[3] * wobble(), now + 0.14, 0.7, 0.038, "triangle");
    tone(ctx, base[2] * wobble(), now + 0.28, 0.55, 0.025, "sine");
  } catch {
    /* audio is best-effort — never block the toast */
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
