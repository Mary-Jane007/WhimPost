import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isSiteOwner } from "@/lib/owner";
import { getMeetingBenchBoard } from "@/lib/meetingBench";
import { MeetingBenchWorkspace } from "@/components/MeetingBenchWorkspace";

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
      className={`app-main meeting-bench-page mb-cottage-page season-${board.season}`}
    >
      {isOwner ? (
        <p className="mb-owner-banner">
          You&apos;re the board keeper — use{" "}
          <a href="#mb-owner-desk">Edit Meeting Bench</a> below, or open{" "}
          <Link href="/admin/analytics">Owner Analytics</Link>.
        </p>
      ) : null}

      <MeetingBenchWorkspace initialBoard={board} isOwner={isOwner} />
    </main>
  );
}
