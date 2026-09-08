"use client";

import { COLLECTIBLE_META, type CollectibleKind } from "@/lib/villages";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE: Record<Size, string> = {
  sm: "cottage-glyph cottage-glyph-sm",
  md: "cottage-glyph cottage-glyph-md",
  lg: "cottage-glyph cottage-glyph-lg",
  xl: "cottage-glyph cottage-glyph-xl",
};

/**
 * Whimsical, sticker-like glyph — prefers illustrated art, otherwise
 * renders emoji inside a soft parchment medallion so it feels hand-drawn
 * rather than flat system emoji.
 */
export function CottageGlyph({
  emoji,
  image,
  label,
  size = "md",
  locked = false,
  favorite = false,
  className = "",
}: {
  emoji: string;
  image?: string;
  label?: string;
  size?: Size;
  locked?: boolean;
  favorite?: boolean;
  className?: string;
}) {
  const classes = [
    SIZE[size],
    locked ? "is-locked" : "is-alive",
    favorite ? "is-favorite" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (image && !locked) {
    return (
      <span className={classes} title={label}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" draggable={false} className="cottage-glyph-art" />
        <span className="cottage-glyph-shine" aria-hidden />
      </span>
    );
  }

  return (
    <span className={classes} title={label}>
      <span className="cottage-glyph-medallion" aria-hidden>
        <span className="cottage-glyph-emoji">{locked ? "·" : emoji}</span>
      </span>
      {!locked && emoji !== "·" ? (
        <span className="cottage-glyph-ghost-art" aria-hidden>
          {emoji}
        </span>
      ) : null}
      <span className="cottage-glyph-shine" aria-hidden />
    </span>
  );
}

export function CollectibleCottageGlyph({
  kind,
  size = "md",
  locked = false,
}: {
  kind: CollectibleKind;
  size?: Size;
  locked?: boolean;
}) {
  const meta = COLLECTIBLE_META[kind];
  return (
    <CottageGlyph
      emoji={meta.emoji}
      image={meta.image}
      label={meta.name}
      size={size}
      locked={locked}
    />
  );
}
