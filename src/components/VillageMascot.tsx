import type { VillageInfo } from "@/lib/villages";

export function VillageMascot({
  village,
  size = "md",
  className = "",
}: {
  village: Pick<VillageInfo, "mascot" | "mascotName" | "mascotImage">;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass =
    size === "lg"
      ? "village-mascot-lg"
      : size === "sm"
        ? "village-mascot-sm"
        : "village-mascot";

  if (village.mascotImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={village.mascotImage}
        alt={village.mascotName}
        className={`${sizeClass} village-mascot-img ${className}`}
        draggable={false}
      />
    );
  }

  return (
    <span className={`${sizeClass} ${className}`} aria-hidden>
      {village.mascot}
    </span>
  );
}
