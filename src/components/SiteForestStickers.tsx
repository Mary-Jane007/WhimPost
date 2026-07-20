"use client";

import { usePathname } from "next/navigation";
import { ForestStickers } from "@/components/ForestDecor";

/** Sitewide sticker scatter — skipped on the homepage, which has its own lighter set. */
export function SiteForestStickers() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <ForestStickers density="site" />;
}
