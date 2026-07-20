"use client";

import { usePathname } from "next/navigation";
import { ForestStickers } from "@/components/ForestDecor";
import type { VillageId } from "@/lib/villages";

/** Sitewide sticker scatter — skipped on the homepage, which has its own lighter set. */
export function SiteForestStickers({
  villageId = null,
}: {
  villageId?: VillageId | null;
}) {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <ForestStickers density="site" villageId={villageId} />;
}
