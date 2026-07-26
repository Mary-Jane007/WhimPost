"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EnvelopeFace } from "@/components/EnvelopeFace";
import { LetterPaper } from "@/components/LetterPaper";
import type { LetterView } from "@/lib/types";

export function WelcomeLetterModal({ letter }: { letter: LetterView }) {
  const [opened, setOpened] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [saving, setSaving] = useState(false);

  if (dismissed) return null;

  async function openEnvelope(e?: React.MouseEvent) {
    // Without hydration, the Link navigates to /letter/[id].
    // With hydration, open in-place and mark read.
    if (e) e.preventDefault();
    if (opened || saving) return;
    setOpened(true);
    setSaving(true);
    try {
      await fetch(`/api/letters/${letter.id}`, { method: "PATCH" });
    } catch {
      /* still show the letter */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="welcome-modal-backdrop" role="dialog" aria-modal="true">
      <motion.div
        className="welcome-modal"
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="welcome-modal-kicker">A letter has arrived</p>
        <h2 className="welcome-modal-title">
          {opened
            ? letter.subject
            : `Your welcome from ${letter.sender.displayName}`}
        </h2>
        <p className="welcome-modal-lead">
          {opened
            ? `From ${letter.sender.forestName || letter.sender.displayName} — take your time with every page.`
            : "It waits sealed for you. Open the envelope when you are ready."}
        </p>

        <AnimatePresence mode="wait">
          {!opened ? (
            <motion.div
              key="envelope"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, rotate: -2 }}
              transition={{ duration: 0.4 }}
            >
              <Link
                href={`/letter/${letter.id}`}
                className="open-envelope-btn welcome-open-btn"
                onClick={openEnvelope}
              >
                <EnvelopeFace
                  style={letter.envelopeStyle}
                  toName={letter.recipient.displayName}
                  fromName={letter.sender.displayName}
                  stampStyle={letter.stampStyle}
                  waxSeal={letter.waxSeal}
                />
                <span className="open-cue">Tap to open</span>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="letter"
              className="welcome-letter-stage"
              initial={{ opacity: 0, y: 20, rotate: 1 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <LetterPaper
                className="welcome-typewriter"
                paperStyle={letter.paperStyle}
                fontStyle={letter.fontStyle || "typewriter"}
                body={letter.body}
                subject={letter.subject}
                stickers={letter.stickers}
                scraps={letter.scraps}
                image={letter.image}
                mascot={letter.mascot}
              />
              <form
                action={`/api/letters/${letter.id}`}
                method="post"
                className="welcome-dismiss-form"
                onSubmit={(e) => {
                  // Soft dismiss when JS is alive; form POST still works without it.
                  e.preventDefault();
                  setDismissed(true);
                }}
              >
                <input type="hidden" name="next" value="/village" />
                <button type="submit" className="btn-primary welcome-dismiss">
                  Tuck into my inbox
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
