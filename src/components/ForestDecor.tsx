import { StickerArt } from "@/components/stickers/StickerArt";
import type { StickerKind } from "@/lib/types";

type DecorItem = {
  kind: StickerKind;
  className: string;
  label?: string;
};

const SITEWIDE: DecorItem[] = [
  { kind: "fern", className: "decor-fern-tl" },
  { kind: "mushroom", className: "decor-mushroom-tr" },
  { kind: "moon", className: "decor-moon-tr" },
  { kind: "fox", className: "decor-fox-bl" },
  { kind: "moth", className: "decor-moth-br" },
  { kind: "leaf", className: "decor-leaf-ml" },
  { kind: "butterfly", className: "decor-butterfly-mr" },
  { kind: "acorn", className: "decor-acorn-bm" },
  { kind: "crow", className: "decor-crow-tm" },
  { kind: "sun", className: "decor-sun-tr2" },
  { kind: "spiral", className: "decor-spiral-bl2" },
  { kind: "flower", className: "decor-flower-br2" },
];

const LANDING_EXTRA: DecorItem[] = [
  { kind: "mushroom", className: "decor-landing-mush-1" },
  { kind: "fox", className: "decor-landing-fox" },
  { kind: "moth", className: "decor-landing-moth" },
  { kind: "crow", className: "decor-landing-crow" },
  { kind: "butterfly", className: "decor-landing-bfly" },
  { kind: "sun", className: "decor-landing-sun" },
  { kind: "moon", className: "decor-landing-moon" },
  { kind: "spiral", className: "decor-landing-spiral" },
  { kind: "fern", className: "decor-landing-fern" },
  { kind: "flower", className: "decor-landing-flower" },
  { kind: "leaf", className: "decor-landing-leaf" },
  { kind: "acorn", className: "decor-landing-acorn" },
];

export function ForestStickers({
  density = "site",
}: {
  density?: "site" | "landing" | "auth";
}) {
  const items =
    density === "landing"
      ? [...SITEWIDE, ...LANDING_EXTRA]
      : density === "auth"
        ? SITEWIDE.filter((_, i) => i % 2 === 0)
        : SITEWIDE;

  return (
    <div className={`forest-stickers forest-stickers-${density}`} aria-hidden>
      {items.map((item, index) => (
        <span
          key={`${item.kind}-${item.className}-${index}`}
          className={`forest-sticker ${item.className}`}
        >
          <StickerArt kind={item.kind} />
        </span>
      ))}
      <span className="sparkle s1" />
      <span className="sparkle s2" />
      <span className="sparkle s3" />
      <span className="sparkle s4" />
      <span className="sparkle s5" />
    </div>
  );
}

export function CollageScraps({ className = "" }: { className?: string }) {
  return (
    <div className={`collage-scraps ${className}`} aria-hidden>
      <p className="scrap scrap-stone">Nature is God</p>
      <p className="scrap scrap-trees">The trees can hear you if you talk to them</p>
      <p className="scrap scrap-wild">Find me where the wild things are</p>
      <p className="scrap scrap-earth">Touch the earth and remember who you are</p>
    </div>
  );
}

export function ForestFloor({ className = "" }: { className?: string }) {
  return (
    <div className={`forest-floor ${className}`} aria-hidden>
      <svg viewBox="0 0 1200 180" preserveAspectRatio="none" className="floor-svg">
        <path
          d="M0 120 Q120 70 240 110 T480 100 T720 120 T960 90 T1200 115 V180 H0Z"
          fill="#243328"
        />
        <path
          d="M0 140 Q150 100 300 135 T600 125 T900 145 T1200 130 V180 H0Z"
          fill="#2f3b2e"
        />
        <g fill="#1a2219" opacity="0.9">
          <path d="M60 180 V70 L95 180Z" />
          <path d="M180 180 V40 L230 180Z" />
          <path d="M340 180 V55 L390 180Z" />
          <path d="M520 180 V30 L585 180Z" />
          <path d="M710 180 V50 L770 180Z" />
          <path d="M900 180 V35 L970 180Z" />
          <path d="M1080 180 V60 L1140 180Z" />
        </g>
      </svg>
    </div>
  );
}
