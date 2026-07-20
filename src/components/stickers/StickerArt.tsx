import type { ScrapKind, StickerKind, StampStyle, WaxSeal } from "@/lib/types";
import { SCRAP_OPTIONS } from "@/lib/types";

export function StickerArt({
  kind,
  className = "",
}: {
  kind: StickerKind;
  className?: string;
}) {
  switch (kind) {
    case "fox":
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden>
          <ellipse cx="40" cy="58" rx="22" ry="12" fill="#8B5A2B" />
          <path
            d="M18 42 L28 18 L40 34 L52 18 L62 42 Q40 62 18 42Z"
            fill="#C4682A"
          />
          <path d="M28 18 L34 30 L40 34Z" fill="#F3E6D0" />
          <path d="M52 18 L46 30 L40 34Z" fill="#F3E6D0" />
          <circle cx="33" cy="40" r="2.2" fill="#1a1a1a" />
          <circle cx="47" cy="40" r="2.2" fill="#1a1a1a" />
          <ellipse cx="40" cy="48" rx="5" ry="3.5" fill="#F3E6D0" />
          <circle cx="40" cy="46" r="1.5" fill="#1a1a1a" />
        </svg>
      );
    case "moth":
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden>
          <ellipse cx="40" cy="40" rx="6" ry="18" fill="#2F3B2E" />
          <path
            d="M40 28 C18 10 8 28 16 42 C24 54 36 48 40 40Z"
            fill="#6B8F71"
          />
          <path
            d="M40 28 C62 10 72 28 64 42 C56 54 44 48 40 40Z"
            fill="#5F7F65"
          />
          <circle cx="28" cy="30" r="4" fill="#D4AF37" opacity="0.7" />
          <circle cx="52" cy="30" r="4" fill="#D4AF37" opacity="0.7" />
          <path d="M37 22 Q40 12 43 22" stroke="#2F3B2E" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case "mushroom":
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden>
          <path
            d="M14 38 Q40 8 66 38 Q40 30 14 38Z"
            fill="#8B4513"
          />
          <ellipse cx="40" cy="38" rx="26" ry="8" fill="#A0522D" />
          <rect x="34" y="38" width="12" height="24" rx="4" fill="#E8D5B5" />
          <circle cx="28" cy="32" r="3" fill="#F3E6D0" opacity="0.8" />
          <circle cx="48" cy="28" r="2.5" fill="#F3E6D0" opacity="0.8" />
          <circle cx="40" cy="34" r="2" fill="#F3E6D0" opacity="0.7" />
        </svg>
      );
    case "crow":
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden>
          <path
            d="M18 44 C28 22 58 18 66 36 C58 34 50 38 46 48 L62 56 C48 60 30 58 22 50 Z"
            fill="#1a1a1a"
          />
          <path d="M66 36 L76 34 L66 40Z" fill="#C4682A" />
          <circle cx="58" cy="34" r="2" fill="#F3E6D0" />
          <path d="M30 48 Q24 58 18 62" stroke="#1a1a1a" strokeWidth="3" fill="none" />
        </svg>
      );
    case "moon":
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden>
          <circle cx="40" cy="40" r="22" fill="#D4AF37" />
          <circle cx="50" cy="34" r="18" fill="#1F2A1E" />
          <circle cx="28" cy="22" r="1.5" fill="#D4AF37" />
          <circle cx="58" cy="56" r="1.2" fill="#D4AF37" />
          <circle cx="20" cy="48" r="1" fill="#D4AF37" />
        </svg>
      );
    case "sun":
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden>
          <circle cx="40" cy="40" r="16" fill="#D4AF37" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="40"
              y1="40"
              x2={40 + Math.cos((deg * Math.PI) / 180) * 28}
              y2={40 + Math.sin((deg * Math.PI) / 180) * 28}
              stroke="#D4AF37"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ))}
          <circle cx="34" cy="38" r="1.5" fill="#5C3A1E" />
          <circle cx="46" cy="38" r="1.5" fill="#5C3A1E" />
          <path d="M34 46 Q40 50 46 46" stroke="#5C3A1E" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case "fern":
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden>
          <path
            d="M40 70 Q38 40 42 12"
            stroke="#3D5C45"
            strokeWidth="2.5"
            fill="none"
          />
          {[16, 26, 36, 46, 56].map((y, i) => (
            <g key={y}>
              <path
                d={`M40 ${y} Q${22 - i} ${y - 4} ${16 - i} ${y + 2}`}
                stroke="#5F7F65"
                strokeWidth="2"
                fill="none"
              />
              <path
                d={`M40 ${y} Q${58 + i} ${y - 4} ${64 + i} ${y + 2}`}
                stroke="#6B8F71"
                strokeWidth="2"
                fill="none"
              />
            </g>
          ))}
        </svg>
      );
    case "butterfly":
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden>
          <ellipse cx="40" cy="42" rx="3" ry="14" fill="#2F3B2E" />
          <path d="M40 32 C22 18 10 34 22 46 C30 52 38 46 40 40Z" fill="#C4682A" />
          <path d="M40 32 C58 18 70 34 58 46 C50 52 42 46 40 40Z" fill="#A0522D" />
          <circle cx="26" cy="34" r="3" fill="#1a1a1a" />
          <circle cx="54" cy="34" r="3" fill="#1a1a1a" />
          <path d="M38 28 Q36 18 32 16" stroke="#2F3B2E" fill="none" />
          <path d="M42 28 Q44 18 48 16" stroke="#2F3B2E" fill="none" />
        </svg>
      );
    case "flower":
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden>
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <ellipse
              key={deg}
              cx={40 + Math.cos((deg * Math.PI) / 180) * 12}
              cy={40 + Math.sin((deg * Math.PI) / 180) * 12}
              rx="8"
              ry="12"
              fill="#F3E6D0"
              transform={`rotate(${deg} ${40 + Math.cos((deg * Math.PI) / 180) * 12} ${40 + Math.sin((deg * Math.PI) / 180) * 12})`}
            />
          ))}
          <circle cx="40" cy="40" r="7" fill="#D4AF37" />
        </svg>
      );
    case "spiral":
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden>
          <path
            d="M40 40 m0 -4 a4 4 0 1 1 0 0.1 m0 -6 a10 10 0 1 0 0 0.1 m0 -6 a16 16 0 1 1 0 0.1 m0 -6 a22 22 0 1 0 0 0.1"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {[0, 90, 180, 270].map((deg) => (
            <line
              key={deg}
              x1="40"
              y1="40"
              x2={40 + Math.cos((deg * Math.PI) / 180) * 30}
              y2={40 + Math.sin((deg * Math.PI) / 180) * 30}
              stroke="#1a1a1a"
              strokeWidth="1.5"
            />
          ))}
        </svg>
      );
    case "acorn":
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden>
          <path d="M30 36 Q40 60 50 36Z" fill="#8B5A2B" />
          <ellipse cx="40" cy="34" rx="14" ry="8" fill="#5C3A1E" />
          <rect x="38" y="22" width="4" height="8" rx="1" fill="#3D5C45" />
        </svg>
      );
    case "leaf":
      return (
        <svg viewBox="0 0 80 80" className={className} aria-hidden>
          <path
            d="M40 68 C20 48 18 24 40 12 C62 24 60 48 40 68Z"
            fill="#5F7F65"
          />
          <path d="M40 16 L40 64" stroke="#2F3B2E" strokeWidth="1.5" />
          <path d="M40 30 Q28 34 24 40" stroke="#2F3B2E" strokeWidth="1" fill="none" />
          <path d="M40 42 Q52 46 56 52" stroke="#2F3B2E" strokeWidth="1" fill="none" />
        </svg>
      );
    default:
      return null;
  }
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
  const map: Record<StampStyle, StickerKind> = {
    mushroom: "mushroom",
    fox: "fox",
    moth: "moth",
    crow: "crow",
    fern: "fern",
    moon: "moon",
  };
  return (
    <div className={`postage-stamp ${className}`}>
      <StickerArt kind={map[kind]} className="w-full h-full" />
      <span className="stamp-value">⚘ 1</span>
    </div>
  );
}
