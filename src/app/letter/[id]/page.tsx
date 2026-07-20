import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { toLetterView } from "@/lib/letters";
import { LetterReader } from "@/components/LetterReader";
import type { LetterRecord } from "@/lib/types";
import { syncWelcomeLetterDecorations } from "@/lib/welcomeLetters";

export default async function LetterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const db = getDb();
  syncWelcomeLetterDecorations(db);
  const row = db.prepare(`SELECT * FROM letters WHERE id = ?`).get(id) as
    | LetterRecord
    | undefined;

  if (!row) notFound();
  if (row.sender_id !== user.id && row.recipient_id !== user.id) {
    notFound();
  }

  const wasUnread = row.recipient_id === user.id && !row.is_read;
  if (wasUnread) {
    db.prepare(`UPDATE letters SET is_read = 1 WHERE id = ?`).run(id);
    row.is_read = 1;
  }

  const letter = toLetterView(row);
  if (!letter) notFound();

  const perspective = row.recipient_id === user.id ? "inbox" : "sent";

  return (
    <main className="app-main forest-panel">
      <LetterReader
        letter={letter}
        perspective={perspective}
        startClosed={wasUnread}
      />
    </main>
  );
}
