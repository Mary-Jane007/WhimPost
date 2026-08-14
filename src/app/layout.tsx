import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SiteNav } from "@/components/SiteNav";
import { SiteForestStickers } from "@/components/SiteForestStickers";
import { ChronicleUnlockHost } from "@/components/ChronicleUnlockHost";
import { AnalyticsBeacon } from "@/components/AnalyticsBeacon";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getNavBadges } from "@/lib/notifications";
import { getVillageTheme } from "@/lib/villageThemes";
import { isVillageId, type VillageId } from "@/lib/villages";

export const metadata: Metadata = {
  title: "WhimPost — Letters from the woods",
  description:
    "Write whimsical cottagecore letters with stickers, scraps, envelopes, and seals. Stay connected with friends through the forest post.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const villageId =
    user?.villageId && isVillageId(user.villageId)
      ? (user.villageId as VillageId)
      : null;
  const theme = getVillageTheme(villageId);
  const themeClass = theme && villageId ? `theme-${villageId}` : "";
  const badges = user ? getNavBadges(getDb(), user.id) : undefined;

  const themeStyle = theme
    ? ({
        "--village-color": theme.color,
        "--village-soft": theme.colorSoft,
        "--village-accent": theme.accent,
        "--cream": theme.cream,
        "--ink": theme.ink,
        "--gold": theme.gold,
        "--moss": theme.color,
        "--moss-light": theme.colorSoft,
        "--bg-glow": theme.bgGlow,
      } as React.CSSProperties)
    : undefined;

  return (
    <html lang="en">
      <body className={themeClass} style={themeStyle}>
        {/*
          Do NOT wrap Script in a manual <head> or use beforeInteractive here —
          that breaks App Router hydration site-wide (buttons stop working).
          afterInteractive keeps TV unmute working without killing React.
        */}
        <Script src="/tv-sound-boot.js" strategy="afterInteractive" />
        <div className="forest-backdrop" aria-hidden />
        <div className="page-shell">
          <SiteForestStickers villageId={villageId} />
          <SiteNav user={user} badges={badges} />
          {children}
          <ChronicleUnlockHost />
          <AnalyticsBeacon />
        </div>
      </body>
    </html>
  );
}
