"use client";

import { StampArt, WaxSealArt } from "@/components/stickers/StickerArt";
import type { EnvelopeStyle, StampStyle, WaxSeal } from "@/lib/types";

const envelopeClass: Record<EnvelopeStyle, string> = {
  kraft: "env-kraft",
  sage: "env-sage",
  blush: "env-blush",
  ink: "env-ink",
  lavender: "env-lavender",
  bark: "env-bark",
};

export function EnvelopeFace({
  style,
  toName,
  fromName,
  stampStyle,
  waxSeal,
  className = "",
  compact = false,
}: {
  style: EnvelopeStyle;
  toName: string;
  fromName: string;
  stampStyle: StampStyle;
  waxSeal: WaxSeal;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`envelope-face ${envelopeClass[style]} ${compact ? "compact" : ""} ${className}`}
    >
      <div className="envelope-flap" />
      <div className="envelope-content">
        <p className="envelope-from">From {fromName}</p>
        <p className="envelope-to">
          <span>To</span>
          {toName}
        </p>
      </div>
      <StampArt kind={stampStyle} className="envelope-stamp" />
      <WaxSealArt kind={waxSeal} className="envelope-wax" />
    </div>
  );
}
