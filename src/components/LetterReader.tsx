"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { EnvelopeFace } from "@/components/EnvelopeFace";
import { LetterPaper } from "@/components/LetterPaper";
import type { LetterView } from "@/lib/types";

export function LetterReader({
  letter,
  perspective,
  startClosed = false,
}: {
  letter: LetterView;
  perspective: "inbox" | "sent";
  startClosed?: boolean;
}) {
  const initiallyOpen = perspective === "sent" ? true : !startClosed;
  const [opened, setOpened] = useState(initiallyOpen);

  const counterpart =
    perspective === "inbox" ? letter.sender : letter.recipient;

  return (
    <div className="letter-reader">
      <div className="reader-meta">
        <Link href={perspective === "inbox" ? "/inbox" : "/sent"} className="back-link">
          ← Back to {perspective === "inbox" ? "inbox" : "sent"}
        </Link>
        <p>
          {perspective === "inbox" ? "From" : "To"}{" "}
          <Link href={`/profile/${counterpart.username}`} className="user-link">
            <strong>{counterpart.displayName}</strong>
          </Link>
          <span className="muted"> @{counterpart.username}</span>
        </p>
        {letter.sentAt && (
          <time dateTime={letter.sentAt}>
            {new Date(letter.sentAt + "Z").toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </time>
        )}
      </div>

      {/* Native <details> so Tap to open works even if React never hydrates. */}
      <details
        className="letter-open-details"
        open={opened}
        onToggle={(e) => {
          setOpened((e.target as HTMLDetailsElement).open);
        }}
      >
        <summary className="open-envelope-btn">
          <EnvelopeFace
            style={letter.envelopeStyle}
            toName={letter.recipient.displayName}
            fromName={letter.sender.displayName}
            stampStyle={letter.stampStyle}
            waxSeal={letter.waxSeal}
          />
          <span className="open-cue">
            {opened ? "Letter open" : "Tap to open"}
          </span>
        </summary>
        <AnimatePresence mode="wait">
          {opened ? (
            <motion.div
              key="letter"
              initial={{ opacity: 0, y: 24, rotate: 1 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <LetterPaper
                className={letter.mascot ? "welcome-typewriter" : ""}
                paperStyle={letter.paperStyle}
                fontStyle={letter.fontStyle}
                body={letter.body}
                subject={letter.subject}
                stickers={letter.stickers}
                scraps={letter.scraps}
                image={letter.image}
                mascot={letter.mascot}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </details>
    </div>
  );
}
