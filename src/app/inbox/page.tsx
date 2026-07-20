import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { toLetterView } from "@/lib/letters";
import { MailList } from "@/components/MailList";
import { PageCrest } from "@/components/PageCrest";
import type { LetterRecord, LetterView } from "@/lib/types";

export default async function InboxPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM letters
       WHERE recipient_id = ? AND status = 'sent'
       ORDER BY sent_at DESC`
    )
    .all(user.id) as LetterRecord[];

  const letters = rows
    .map(toLetterView)
    .filter((l): l is LetterView => Boolean(l));

  const unread = letters.filter((l) => !l.isRead).length;

  return (
    <main className="app-main forest-panel">
      <PageCrest kinds={["fox-seated", "mushroom-amanita", "moon-full"]} />
      <header className="page-header">
        <h1>Inbox</h1>
        <p>
          {unread > 0
            ? `${unread} unopened envelope${unread === 1 ? "" : "s"} waiting for you.`
            : "Your porch is quiet. Letters from friends will appear here."}
        </p>
      </header>
      <MailList letters={letters} perspective="inbox" />
    </main>
  );
}
