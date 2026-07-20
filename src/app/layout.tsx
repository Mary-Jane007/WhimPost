import type { Metadata } from "next";
import "./globals.css";
import { SiteNav } from "@/components/SiteNav";
import { ForestStickers } from "@/components/ForestDecor";
import { getCurrentUser } from "@/lib/auth";

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

  return (
    <html lang="en">
      <body>
        <div className="forest-backdrop" aria-hidden />
        <div className="page-shell">
          <ForestStickers density="site" />
          <SiteNav user={user} />
          {children}
        </div>
      </body>
    </html>
  );
}
