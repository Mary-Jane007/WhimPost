"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { EnvelopeFace } from "@/components/EnvelopeFace";
import { LetterPaper } from "@/components/LetterPaper";
import { VillagerIdentity } from "@/components/VillagerIdentity";
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
        <div className="reader-party">
          <span className="muted">{perspective === "inbox" ? "From" : "To"}</span>
          <VillagerIdentity
            displayName={counterpart.displayName}
            username={counterpart.username}
            characterJson={counterpart.characterJson}
            villageId={counterpart.homeVillageId || counterpart.villageId}
            href={`/profile/${counterpart.username}`}
            size="sm"
            layout="letter"
          />
        </div>
        <div className="reader-party reader-party-pair">
          <VillagerIdentity
            displayName={letter.sender.displayName}
            characterJson={letter.sender.characterJson}
            villageId={letter.sender.homeVillageId || letter.sender.villageId}
            size="sm"
            layout="letter"
          />
          <span className="reader-party-arrow" aria-hidden>
            →
          </span>
          <VillagerIdentity
            displayName={letter.recipient.displayName}
            characterJson={letter.recipient.characterJson}
            villageId={
              letter.recipient.homeVillageId || letter.recipient.villageId
            }
            size="sm"
            layout="letter"
          />
        </div>
        {letter.sentAt && (
          <time dateTime={letter.sentAt}>
            {new Date(letter.sentAt + "Z").toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </time>
        )}
      </div>

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
