import {
  COLLECTIBLE_META,
  type CollectibleKind,
} from "@/lib/villages";

type CollectibleIconProps = {
  kind: CollectibleKind;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const SIZE_CLASS = {
  sm: "collectible-icon collectible-icon-sm",
  md: "collectible-icon",
  lg: "collectible-icon collectible-icon-lg",
} as const;

/** Renders a village collectible's custom icon, with emoji fallback. */
export function CollectibleIcon({
  kind,
  className = "",
  size = "md",
}: CollectibleIconProps) {
  const meta = COLLECTIBLE_META[kind];
  const classes = `${SIZE_CLASS[size]} ${className}`.trim();

  if (meta.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={meta.image}
        alt=""
        className={classes}
        draggable={false}
        aria-hidden
      />
    );
  }

  return (
    <span className={`collectible-emoji ${className}`.trim()} aria-hidden>
      {meta.emoji}
    </span>
  );
}
