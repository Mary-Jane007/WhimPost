import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isSiteOwner } from "@/lib/owner";
import { getMeetingBenchBoard } from "@/lib/meetingBench";
import { MeetingBenchWorkspace } from "@/components/MeetingBenchWorkspace";
import { PageCrest } from "@/components/PageCrest";
import { getBenchTheme } from "@/lib/meetingBenchScene";
import { isVillageId, VILLAGE_MAP, type VillageId } from "@/lib/villages";
import type { CSSProperties } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MeetingBenchPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const isOwner = Boolean(user.isOwner || isSiteOwner(db, user.id));
  // Theme Meeting Bench by the village you are standing in (current visit),
  // so Moonmere Observatory chrome never appears while visiting Mosshollow.
  const villageId =
    (user.villageId && isVillageId(user.villageId) ? user.villageId : null) ||
    (user.homeVillageId && isVillageId(user.homeVillageId)
      ? user.homeVillageId
      : null) ||
    ("bramblewood" as VillageId);
  const board = getMeetingBenchBoard(user.id, villageId);
  const theme = getBenchTheme(villageId);
  const village = VILLAGE_MAP[villageId];
  const pageStyle = {
    "--village-color": village.color,
    "--village-soft": village.colorSoft,
  } as CSSProperties;

  return (
    <main
      className={`app-main forest-panel meeting-bench-page mb-living-page mb-board-page village-${villageId} season-${board.season}`}
      style={pageStyle}
    >
      <PageCrest
        kinds={
          villageId === "clovermeadow"
            ? ["clover-blossom", "clover-butterfly-small", "clover-bunny"]
            : villageId === "moonmere"
              ? ["moon-crescent", "moon-full", "dragonfly"]
              : villageId === "hearthwick"
                ? ["fox-seated", "leafy-branch", "candle-jar"]
                : villageId === "mosshollow"
                  ? ["moss-books-stack", "moss-ink-bottle", "leafy-branch"]
                  : ["mushroom-amanita", "fox-seated", "jam-jar"]
        }
        villageStickers={
          villageId === "moonmere"
            ? [
                { village: "moonmere", id: "luna-moth" },
                { village: "moonmere", id: "moon-crescent" },
                { village: "moonmere", id: "lantern-star" },
              ]
            : villageId === "hearthwick"
              ? [
                  { village: "hearthwick", id: "hedgehog" },
                  { village: "hearthwick", id: "lavender-bouquet" },
                  { village: "hearthwick", id: "herbal-jar" },
                ]
              : villageId === "bramblewood"
                ? [
                    { village: "bramblewood", id: "fox-face" },
                    { village: "bramblewood", id: "maple-branch" },
                    { village: "bramblewood", id: "candle-jar" },
                  ]
                : villageId === "clovermeadow"
                  ? [
                      { village: "clovermeadow", id: "butterfly-pink" },
                      { village: "clovermeadow", id: "lily-pink" },
                      { village: "clovermeadow", id: "flowers-sage" },
                    ]
                  : undefined
        }
      />

      <header className="page-header meeting-bench-header mb-living-header mb-board-header">
        <p className="meeting-bench-kicker">{theme.kicker}</p>
        <h1>{theme.headline}</h1>
        <p className="mb-living-sub">{theme.subtitle}</p>
        <p className="mb-board-lead">
          A shared gathering board for every WhimPost home — notes, events, and
          quiet finds left by the keeper.
        </p>
        {isOwner ? (
          <p className="mb-owner-banner">
            You&apos;re the board keeper — use{" "}
            <a href="#mb-owner-desk">Edit Meeting Bench</a> to pin notes,
            events, activities, Chronicle stories, and community gatherings.
            For the full WhimPost picture, open{" "}
            <Link href="/admin/analytics">Owner Analytics</Link>.
          </p>
        ) : null}
      </header>

      <MeetingBenchWorkspace
        initialBoard={board}
        isOwner={isOwner}
        villageId={villageId}
      />
    </main>
  );
}
