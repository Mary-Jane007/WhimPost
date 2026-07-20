import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { toLetterView } from "@/lib/letters";
import { MailList } from "@/components/MailList";
import type { LetterRecord, LetterView } from "@/lib/types";

export default async function SentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM letters
       WHERE sender_id = ? AND status = 'sent'
       ORDER BY sent_at DESC`
    )
    .all(user.id) as LetterRecord[];

  const letters = rows
    .map(toLetterView)
    .filter((l): l is LetterView => Boolean(l));

  return (
    <main className="app-main">
      <header className="page-header">
        <h1>Sent</h1>
        <p>Letters you sealed and sent into the woods.</p>
      </header>
      <MailList letters={letters} perspective="sent" />
    </main>
  );
}
