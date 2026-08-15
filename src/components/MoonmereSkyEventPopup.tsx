"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { SpaceEvent } from "@/lib/moonContent";

const STORAGE_KEY = "moonmere-sky-alert-dismissed";

function readDismissed(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function writeDismissed(ids: string[]) {
  try {
    const prev = readDismissed();
    const next = Array.from(new Set([...prev, ...ids]));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}

export function MoonmereSkyEventPopup({ events }: { events: SpaceEvent[] }) {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const eventIds = useMemo(() => events.map((e) => e.id).sort(), [events]);
  const signature = eventIds.join("|");

  useEffect(() => {
    if (!events.length) {
      setReady(true);
      setDismissed(true);
      return;
    }
    const seen = readDismissed();
    const allSeen = eventIds.every((id) => seen.includes(id));
    setDismissed(allSeen);
    setReady(true);
  }, [events.length, eventIds, signature]);

  if (!ready || dismissed || !events.length) return null;

  const primary = events[0]!;

  function dismiss() {
    writeDismissed(eventIds);
    setDismissed(true);
  }

  return (
    <div
      className="mm-sky-alert-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mm-sky-alert-title"
    >
      <motion.div
        className="mm-sky-alert"
        initial={{ opacity: 0, y: 22, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="mm-sky-alert-kicker">Sky Calendar · happening now</p>
        <h2 id="mm-sky-alert-title" className="mm-sky-alert-title">
          {primary.emoji} {primary.title}
        </h2>
        {primary.peakNote ? (
          <p className="mm-sky-alert-peak">{primary.peakNote}</p>
        ) : null}
        <p className="mm-sky-alert-body">{primary.body}</p>
        {events.length > 1 ? (
          <ul className="mm-sky-alert-more">
            {events.slice(1).map((ev) => (
              <li key={ev.id}>
                {ev.emoji} {ev.title}
                {ev.peakNote ? ` · ${ev.peakNote}` : ""}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mm-sky-alert-actions">
          <Link
            href="/observatory"
            className="btn-primary"
            onClick={dismiss}
          >
            Open Sky Calendar
          </Link>
          <button type="button" className="btn-secondary" onClick={dismiss}>
            Got it
          </button>
        </div>
      </motion.div>
    </div>
  );
}
