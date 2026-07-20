import Link from "next/link";
import { EnvelopeFace } from "@/components/EnvelopeFace";
import { letterBodyPreview } from "@/components/LetterBodyText";
import type { LetterView } from "@/lib/types";

export function MailList({
  letters,
  perspective,
}: {
  letters: LetterView[];
  perspective: "inbox" | "sent";
}) {
  if (letters.length === 0) {
    return (
      <div className="empty-state compact">
        <h2>{perspective === "inbox" ? "No letters yet" : "Nothing sent yet"}</h2>
        <p>
          {perspective === "inbox"
            ? "When a friend writes to you, their envelope will land here."
            : "Compose a letter and seal it — your outbox will keep the trail."}
        </p>
        <Link href="/compose" className="btn-primary">
          Write a letter
        </Link>
      </div>
    );
  }

  return (
    <ul className="mail-list">
      {letters.map((letter) => {
        const person =
          perspective === "inbox" ? letter.sender : letter.recipient;
        return (
          <li key={letter.id}>
            <Link href={`/letter/${letter.id}`} className="mail-item">
              <EnvelopeFace
                style={letter.envelopeStyle}
                toName={letter.recipient.displayName}
                fromName={letter.sender.displayName}
                stampStyle={letter.stampStyle}
                waxSeal={letter.waxSeal}
                compact
              />
              <div className="mail-item-copy">
                <p className="mail-person">
                  {perspective === "inbox" ? "From" : "To"} {person.displayName}
                  {!letter.isRead && perspective === "inbox" && (
                    <span className="unread-dot" aria-label="Unread" />
                  )}
                </p>
                <h3>{letter.subject}</h3>
                <p className="mail-snippet">
                  {letterBodyPreview(letter.body)}
                </p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
