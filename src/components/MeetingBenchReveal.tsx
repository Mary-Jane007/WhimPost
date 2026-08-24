"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { BenchItem } from "@/lib/meetingBench";
import {
  formatWhen,
  OBJECT_META,
  villageNames,
  type BenchObjectId,
  type MeetingBenchEntryType,
} from "@/lib/meetingBenchScene";

type Props = {
  item: BenchItem;
  objectId: BenchObjectId;
  entryType: MeetingBenchEntryType;
  onClose: () => void;
  onRsvp?: (id: string) => void;
  rsvpBusy?: boolean;
  isOwner?: boolean;
  onEdit?: (id: string) => void;
};

export function MeetingBenchReveal({
  item,
  objectId,
  entryType,
  onClose,
  onRsvp,
  rsvpBusy,
  isOwner,
  onEdit,
}: Props) {
  const meta = OBJECT_META[objectId];
  const when = formatWhen(item.startsAt);
  const canRsvp =
    (item.kind === "gathering" || item.kind === "community_event") && onRsvp;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="mb-reveal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className={`mb-reveal-panel mb-reveal-${entryType} mb-reveal-obj-${objectId}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mb-reveal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="mb-reveal-close nav-ghost"
          onClick={onClose}
          aria-label="Close"
        >
          Close
        </button>

        <div className="mb-reveal-object" aria-hidden>
          <span className="mb-reveal-emoji">{meta.emoji}</span>
        </div>

        <p className="mb-reveal-kicker">
          {meta.openVerb} · {meta.label}
        </p>
        <h2 id="mb-reveal-title">{item.title}</h2>

        {when ? <p className="mb-reveal-when">{when}</p> : null}
        {item.status === "active" || item.status === "upcoming" ? (
          <p className="mb-reveal-status">
            {item.status === "active" ? "Happening now" : "Coming up"}
          </p>
        ) : null}

        <div className="mb-reveal-body">
          {item.body.split("\n").map((line, i) => (
            <p key={i}>{line || "\u00a0"}</p>
          ))}
        </div>

        <p className="mb-reveal-meta">{villageNames(item.villages)}</p>

        {item.kind === "community_event" &&
        item.meta.villageTasks &&
        typeof item.meta.villageTasks === "object" ? (
          <ul className="mb-reveal-tasks">
            {Object.entries(
              item.meta.villageTasks as Record<string, string>
            ).map(([vid, task]) =>
              task ? (
                <li key={vid}>
                  <strong>{vid}</strong> — {task}
                </li>
              ) : null
            )}
          </ul>
        ) : null}

        <div className="mb-reveal-actions">
          {canRsvp ? (
            <button
              type="button"
              className="btn-primary"
              disabled={rsvpBusy}
              onClick={() => onRsvp?.(item.id)}
            >
              {item.userJoined
                ? "Leave gathering"
                : item.ctaLabel || "I'll be there"}
              {typeof item.rsvpCount === "number"
                ? ` · ${item.rsvpCount}`
                : ""}
            </button>
          ) : null}
          {item.ctaHref && !canRsvp ? (
            <Link href={item.ctaHref} className="btn-primary">
              {item.ctaLabel || "Take a look"}
            </Link>
          ) : null}
          {item.ctaHref && canRsvp ? (
            <Link href={item.ctaHref} className="btn-secondary">
              {item.ctaLabel || "Details"}
            </Link>
          ) : null}
          {isOwner && onEdit ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onEdit(item.id)}
            >
              Edit
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function entryTypeLabel(type: MeetingBenchEntryType) {
  switch (type) {
    case "announcement":
      return "Announcement";
    case "activity":
      return "Activity";
    case "event":
      return "Event";
    case "question":
      return "Question";
    case "poll":
      return "Poll";
    case "feature":
      return "New feature";
    case "community":
      return "Community";
    case "journal":
      return "Chronicle";
    case "discovery":
      return "Discovery";
    default:
      return "Note";
  }
}
