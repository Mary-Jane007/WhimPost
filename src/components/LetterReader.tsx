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
  const [opened, setOpened] = useState(
    perspective === "sent" ? true : !startClosed
  );

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

      <AnimatePresence mode="wait">
        {!opened ? (
          <motion.button
            key="envelope"
            type="button"
            className="open-envelope-btn"
            onClick={() => setOpened(true)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, rotate: -2 }}
            transition={{ duration: 0.45 }}
          >
            <EnvelopeFace
              style={letter.envelopeStyle}
              toName={letter.recipient.displayName}
              fromName={letter.sender.displayName}
              stampStyle={letter.stampStyle}
              waxSeal={letter.waxSeal}
            />
            <span className="open-cue">Tap to open</span>
          </motion.button>
        ) : (
          <motion.div
            key="letter"
            initial={{ opacity: 0, y: 24, rotate: 1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <LetterPaper
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
        )}
      </AnimatePresence>
    </div>
  );
}
