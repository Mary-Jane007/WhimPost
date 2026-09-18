"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { getVillage } from "@/lib/villages";
import type { VisitorWelcomeGreeting } from "@/lib/visitorWelcome";

export function VisitorWelcomeModal({
  greeting,
}: {
  greeting: VisitorWelcomeGreeting;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [saving, setSaving] = useState(false);
  const village = getVillage(greeting.villageId);

  if (dismissed) return null;

  async function dismiss() {
    if (saving) return;
    setSaving(true);
    try {
      await fetch("/api/village/visitor-welcome", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ villageId: greeting.villageId }),
      });
    } catch {
      /* still close locally */
    } finally {
      setSaving(false);
      setDismissed(true);
    }
  }

  return (
    <div
      className="welcome-modal-backdrop visitor-welcome-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="visitor-welcome-title"
    >
      <motion.div
        className={`welcome-modal visitor-welcome-modal visitor-welcome-${greeting.villageId}`}
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {village?.mascotImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="visitor-welcome-mascot"
            src={village.mascotImage}
            alt={village.mascotName}
            draggable={false}
          />
        ) : village ? (
          <span className="visitor-welcome-mascot-emoji" aria-hidden>
            {village.mascot}
          </span>
        ) : null}

        <p className="welcome-modal-kicker">{greeting.kicker}</p>
        <h2 id="visitor-welcome-title" className="welcome-modal-title">
          {greeting.title}
        </h2>
        <p className="visitor-welcome-village">
          Visiting {village?.name || greeting.villageId}
        </p>
        <div className="visitor-welcome-body">
          {greeting.body.split(/\n\n+/).map((para) => (
            <p key={para.slice(0, 24)}>{para}</p>
          ))}
        </div>
        <p className="visitor-welcome-closing">{greeting.closing}</p>
        <button
          type="button"
          className="btn-primary visitor-welcome-cta"
          onClick={dismiss}
          disabled={saving}
        >
          {saving ? "Tucking away…" : greeting.cta}
        </button>
      </motion.div>
    </div>
  );
}
