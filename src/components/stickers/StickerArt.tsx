import type { ScrapKind, StickerKind, StampStyle, WaxSeal } from "@/lib/types";
import { SCRAP_OPTIONS, STICKER_OPTIONS } from "@/lib/types";

const STICKER_SRC: Record<StickerKind, string> = Object.fromEntries(
  STICKER_OPTIONS.map((opt) => [opt.id, `/stickers/${opt.id}.png`])
) as Record<StickerKind, string>;

export function StickerArt({
  kind,
  className = "",
}: {
  kind: StickerKind;
  className?: string;
}) {
  const src = STICKER_SRC[kind];
  if (!src) return null;
  const label = STICKER_OPTIONS.find((o) => o.id === kind)?.name || "Sticker";

  return (
    // Decorative sticker asset; alt kept for accessibility when used alone.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={label}
      className={`sticker-img ${className}`}
      draggable={false}
    />
  );
}

export function ScrapArt({
  kind,
  className = "",
}: {
  kind: ScrapKind;
  className?: string;
}) {
  const meta = SCRAP_OPTIONS.find((s) => s.id === kind);
  if (kind === "tea-stain") {
    return (
      <svg viewBox="0 0 120 80" className={className} aria-hidden>
        <ellipse cx="60" cy="40" rx="48" ry="28" fill="#8B5A2B" opacity="0.25" />
        <ellipse cx="50" cy="36" rx="20" ry="14" fill="#5C3A1E" opacity="0.15" />
      </svg>
    );
  }
  if (kind === "ticket") {
    return (
      <div
        className={`ticket-scrap ${className}`}
        style={{
          background: "#F3E6D0",
          border: "1px dashed #5C3A1E",
          padding: "0.4rem 0.55rem",
          fontSize: "0.65rem",
          letterSpacing: "0.08em",
          color: "#3D2914",
          fontFamily: "var(--font-stamp)",
          whiteSpace: "nowrap",
        }}
      >
        {meta?.text}
      </div>
    );
  }
  if (kind === "postmark") {
    return (
      <div
        className={`postmark-scrap ${className}`}
        style={{
          border: "2px solid #5C3A1E",
          borderRadius: "999px",
          padding: "0.35rem 0.6rem",
          fontSize: "0.6rem",
          letterSpacing: "0.12em",
          color: "#5C3A1E",
          fontFamily: "var(--font-stamp)",
          textTransform: "uppercase",
          background: "rgba(243,230,208,0.7)",
          whiteSpace: "nowrap",
        }}
      >
        {meta?.text}
      </div>
    );
  }
  return (
    <div
      className={`quote-scrap ${className}`}
      style={{
        background: "linear-gradient(145deg, #E8DCC8, #D4C4A8)",
        border: "1px solid #8B7355",
        padding: "0.45rem 0.55rem",
        maxWidth: "9rem",
        fontSize: "0.62rem",
        lineHeight: 1.35,
        color: "#2F2418",
        fontFamily: "var(--font-letter)",
        fontStyle: "italic",
        boxShadow: "1px 2px 0 rgba(60,40,20,0.15)",
      }}
    >
      {meta?.text}
    </div>
  );
}

export function WaxSealArt({
  kind,
  className = "",
}: {
  kind: WaxSeal;
  className?: string;
}) {
  const icons: Record<WaxSeal, string> = {
    fern: "🌿",
    moon: "☾",
    sun: "☀",
    mushroom: "🍄",
    heart: "♡",
    spiral: "꩜",
  };
  return (
    <div className={`wax-seal wax-${kind} ${className}`} aria-hidden>
      <span>{icons[kind]}</span>
    </div>
  );
}

export function StampArt({
  kind,
  className = "",
}: {
  kind: StampStyle;
  className?: string;
}) {
  return (
    <div className={`postage-stamp ${className}`}>
      <StickerArt kind={kind} className="w-full h-full" />
      <span className="stamp-value">⚘ 1</span>
    </div>
  );
}
