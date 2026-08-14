import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isSiteOwner } from "@/lib/owner";
import { getMeetingBenchBoard } from "@/lib/meetingBench";
import { MeetingBenchWorkspace } from "@/components/MeetingBenchWorkspace";
import { PageCrest } from "@/components/PageCrest";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MeetingBenchPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const isOwner = Boolean(user.isOwner || isSiteOwner(db, user.id));
  const board = getMeetingBenchBoard(user.id);

  return (
    <main
      className={`app-main forest-panel meeting-bench-page season-${board.season}`}
    >
      <PageCrest kinds={["mushroom-amanita", "fox-seated", "jam-jar"]} />
      <header className="page-header meeting-bench-header">
        <p className="meeting-bench-kicker">A quiet place in the villages</p>
        <h1>🪑 The Meeting Bench</h1>
        <p>
          Come sit for a moment. Notices flutter on the board, gatherings are
          pencilled on the calendar, and the Chronicle keeps little stories of
          what the woods have been up to — even while you were away.
        </p>
        <p className="muted">
          Looking for neighbor posts and crafts? That&apos;s the{" "}
          <Link href="/village">Village Square</Link>.
        </p>
        {isOwner ? (
          <p className="mb-owner-banner">
            You&apos;re the board keeper — use{" "}
            <a href="#mb-owner-desk">Edit Meeting Bench</a> to add notices,
            gatherings, seasonal activities, Chronicle stories, and community
            events, or tap <strong>Edit</strong> on any paper below.
          </p>
        ) : null}
      </header>

      <MeetingBenchWorkspace initialBoard={board} isOwner={isOwner} />
    </main>
  );
}
