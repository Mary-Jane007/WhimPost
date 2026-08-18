"use client";

import { useState } from "react";
import Link from "next/link";
import type { BenchItem, BenchItemKind } from "@/lib/meetingBench";
import { VILLAGES, type VillageId } from "@/lib/villages";

export type MeetingBenchBoard = {
  season: string;
  seasonLabel: string;
  notices: BenchItem[];
  gatherings: BenchItem[];
  seasonal: BenchItem[];
  chronicles: BenchItem[];
  communityEvents: BenchItem[];
};

const NOTE_AVATARS = ["🦔", "🐿️", "🦊", "🦉", "🐝", "🦋", "🐸", "🐰"];

function villageNames(villages: VillageId[] | "all") {
  if (villages === "all") return "All villages";
  return villages
    .map((id) => VILLAGES.find((v) => v.id === id)?.name || id)
    .join(" · ");
}

function formatWhen(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

function formatDateBox(iso: string | null) {
  if (!iso) return { month: "Soon", day: "—" };
  try {
    const d = new Date(iso);
    return {
      month: d.toLocaleString(undefined, { month: "short" }).toUpperCase(),
      day: String(d.getDate()),
    };
  } catch {
    return { month: "Soon", day: "—" };
  }
}

function formatTimeAgo(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function excerpt(text: string, n = 110) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= n) return clean;
  return `${clean.slice(0, n).trim()}…`;
}

function EditBtn({
  isOwner,
  itemId,
  onEdit,
}: {
  isOwner?: boolean;
  itemId: string;
  onEdit?: (id: string) => void;
}) {
  if (!isOwner || !onEdit) return null;
  return (
    <button
      type="button"
      className="mb-edit-btn"
      onClick={() => onEdit(itemId)}
    >
      Edit
    </button>
  );
}

function BenchHeroArt() {
  return (
    <figure className="mb-hero-art">
      <picture>
        <source
          srcSet="/images/meeting-bench-hero.webp"
          type="image/webp"
        />
        <img
          src="/images/meeting-bench-hero.jpg"
          alt="A weathered wooden garden bench under blossoming trees, with a watering can, gloves, and soft wildflowers in the mist."
          width={1600}
          height={1067}
          decoding="async"
          fetchPriority="high"
        />
      </picture>
      <div className="mb-hero-mist" aria-hidden />
    </figure>
  );
}

export function MeetingBench({
  initialBoard,
  board: controlledBoard,
  canRsvp = true,
  isOwner = false,
  onEditItem,
  onAddKind,
}: {
  initialBoard: MeetingBenchBoard;
  board?: MeetingBenchBoard;
  canRsvp?: boolean;
  isOwner?: boolean;
  onEditItem?: (id: string) => void;
  onAddKind?: (kind: BenchItemKind) => void;
}) {
  const baseBoard = controlledBoard ?? initialBoard;
  const [rsvpPatches, setRsvpPatches] = useState<
    Record<string, Pick<BenchItem, "rsvpCount" | "userJoined">>
  >({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const board = {
    ...baseBoard,
    gatherings: baseBoard.gatherings.map((g) =>
      rsvpPatches[g.id] ? { ...g, ...rsvpPatches[g.id] } : g
    ),
    communityEvents: baseBoard.communityEvents.map((g) =>
      rsvpPatches[g.id] ? { ...g, ...rsvpPatches[g.id] } : g
    ),
  };

  const notices = board.notices.slice(0, 3);
  const whatsNew = [
    ...board.seasonal.slice(0, 2),
    ...board.communityEvents.slice(0, 2),
  ].slice(0, 4);
  const highlight =
    board.chronicles[0] ||
    board.notices[0] ||
    board.seasonal[0] ||
    null;
  const meetings = board.gatherings.slice(0, 4);
  const recentNotes = board.chronicles.slice(0, 4);

  async function rsvp(itemId: string) {
    if (!canRsvp) return;
    setBusyId(itemId);
    setError("");
    try {
      const res = await fetch("/api/meeting-bench/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not join");
      const updated = data.item as BenchItem;
      setRsvpPatches((prev) => ({
        ...prev,
        [updated.id]: {
          rsvpCount: updated.rsvpCount,
          userJoined: updated.userJoined,
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className={`meeting-bench mb-cottage season-${board.season}`}>
      <section className="mb-cottage-hero" aria-labelledby="mb-hero-title">
        <div className="mb-cottage-hero-copy">
          <p className="mb-cottage-kicker">
            Shared by every village · {board.seasonLabel}
          </p>
          <h2 id="mb-hero-title" className="mb-cottage-title">
            <span className="mb-leaf" aria-hidden>
              ❧
            </span>
            The Meeting Bench
            <span className="mb-leaf" aria-hidden>
              ❧
            </span>
          </h2>
          <p className="mb-cottage-lead">
            Come sit for a moment. Notices flutter on the board, gatherings are
            pencilled on the calendar, and soft stories gather here from every
            WhimPost village.
          </p>
          <a href="#mb-meetings" className="mb-take-seat">
            Take a seat
          </a>
        </div>

        <div className="mb-cottage-hero-visual">
          <BenchHeroArt />
          <nav className="mb-wood-signs" aria-label="Bench paths">
            <a href="#mb-share" className="mb-wood-sign">
              Share
            </a>
            <a href="#mb-listen" className="mb-wood-sign">
              Listen
            </a>
            <a href="#mb-grow" className="mb-wood-sign">
              Grow
            </a>
          </nav>
        </div>
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="mb-cottage-grid">
        <section id="mb-listen" className="mb-panel">
          <header className="mb-panel-head">
            <h3>Village Announcements</h3>
            {isOwner && onAddKind ? (
              <button
                type="button"
                className="mb-panel-add"
                onClick={() => onAddKind("notice")}
              >
                + Add
              </button>
            ) : null}
          </header>
          {notices.length === 0 ? (
            <p className="mb-empty">The board is clear for now.</p>
          ) : (
            <ul className="mb-announce-list">
              {notices.map((item, i) => (
                <li key={item.id}>
                  <span className={`mb-thumb mb-thumb-${(i % 3) + 1}`} aria-hidden />
                  <div>
                    <strong>{item.title}</strong>
                    <p>{excerpt(item.body, 90)}</p>
                    {item.ctaHref ? (
                      <Link href={item.ctaHref} className="mb-inline-link">
                        Read more →
                      </Link>
                    ) : (
                      <span className="mb-inline-meta">
                        {villageNames(item.villages)}
                      </span>
                    )}
                  </div>
                  <EditBtn
                    isOwner={isOwner}
                    itemId={item.id}
                    onEdit={onEditItem}
                  />
                </li>
              ))}
            </ul>
          )}
          <a href="#notices-full" className="mb-panel-cta">
            View all announcements
          </a>
        </section>

        <section id="mb-grow" className="mb-panel">
          <header className="mb-panel-head">
            <h3>What’s New?</h3>
            {isOwner && onAddKind ? (
              <button
                type="button"
                className="mb-panel-add"
                onClick={() => onAddKind("seasonal")}
              >
                + Add
              </button>
            ) : null}
          </header>
          {whatsNew.length === 0 ? (
            <p className="mb-empty">The season is still waking up.</p>
          ) : (
            <ul className="mb-leaf-list">
              {whatsNew.map((item) => (
                <li key={item.id}>
                  <span aria-hidden>🍃</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{excerpt(item.body, 80)}</p>
                  </div>
                  <EditBtn
                    isOwner={isOwner}
                    itemId={item.id}
                    onEdit={onEditItem}
                  />
                </li>
              ))}
            </ul>
          )}
          <div className="mb-panel-foot">
            <Link href="/village" className="mb-panel-cta">
              Explore now
            </Link>
            <span className="mb-basket" aria-hidden>
              🧺
            </span>
          </div>
        </section>

        <section className="mb-panel mb-panel-highlight">
          <header className="mb-panel-head">
            <h3>Village Highlights</h3>
          </header>
          {highlight ? (
            <figure className="mb-polaroid">
              <div className="mb-polaroid-tape" aria-hidden />
              <div className="mb-polaroid-photo" aria-hidden>
                <span>🌿</span>
              </div>
              <figcaption>
                <strong>{highlight.title}</strong>
                <span>♡ {villageNames(highlight.villages)}</span>
              </figcaption>
              <EditBtn
                isOwner={isOwner}
                itemId={highlight.id}
                onEdit={onEditItem}
              />
            </figure>
          ) : (
            <p className="mb-empty">No highlight pinned yet.</p>
          )}
          <a href="#mb-notes" className="mb-panel-cta">
            See more moments
          </a>
        </section>

        <section id="mb-meetings" className="mb-panel">
          <header className="mb-panel-head">
            <h3>Upcoming Meetings</h3>
            {isOwner && onAddKind ? (
              <button
                type="button"
                className="mb-panel-add"
                onClick={() => onAddKind("gathering")}
              >
                + Add
              </button>
            ) : null}
          </header>
          {meetings.length === 0 ? (
            <p className="mb-empty">No gatherings pencilled in yet.</p>
          ) : (
            <ul className="mb-meeting-list">
              {meetings.map((item) => {
                const box = formatDateBox(item.startsAt);
                const when = formatWhen(item.startsAt);
                return (
                  <li key={item.id}>
                    <div className="mb-date-box" aria-hidden>
                      <span>{box.month}</span>
                      <strong>{box.day}</strong>
                    </div>
                    <div className="mb-meeting-copy">
                      <strong>{item.title}</strong>
                      <p>{excerpt(item.body, 70)}</p>
                      {when ? <em>{when}</em> : null}
                      <button
                        type="button"
                        className={
                          item.userJoined ? "mb-mini-primary" : "mb-mini-ghost"
                        }
                        disabled={busyId === item.id || item.status === "finished"}
                        onClick={() => rsvp(item.id)}
                      >
                        {item.userJoined
                          ? "You're going"
                          : item.ctaLabel || "I'll be there"}
                      </button>
                    </div>
                    <EditBtn
                      isOwner={isOwner}
                      itemId={item.id}
                      onEdit={onEditItem}
                    />
                  </li>
                );
              })}
            </ul>
          )}
          <a href="#gatherings-full" className="mb-panel-cta">
            View full schedule
          </a>
        </section>

        <section id="mb-share" className="mb-panel mb-panel-share">
          <header className="mb-panel-head">
            <h3>Share Your Thoughts</h3>
          </header>
          <div className="mb-journal" aria-hidden>
            <span className="mb-journal-book">📔</span>
            <span className="mb-journal-pen">✒️</span>
          </div>
          <p className="mb-share-lead">
            Leave a soft note for the villages — a wish, a thank-you, or a tiny
            story from your path.
          </p>
          <Link href="/compose" className="mb-take-seat mb-take-seat-sm">
            Leave a note
          </Link>
          <blockquote className="mb-quote-chip">
            Every voice makes our village stronger.
          </blockquote>
        </section>

        <section id="mb-notes" className="mb-panel">
          <header className="mb-panel-head">
            <h3>Recent Notes</h3>
            {isOwner && onAddKind ? (
              <button
                type="button"
                className="mb-panel-add"
                onClick={() => onAddKind("chronicle")}
              >
                + Add
              </button>
            ) : null}
          </header>
          {recentNotes.length === 0 ? (
            <p className="mb-empty">The Chronicle is quiet today.</p>
          ) : (
            <ul className="mb-notes-list">
              {recentNotes.map((item, i) => (
                <li key={item.id}>
                  <span className="mb-note-avatar" aria-hidden>
                    {NOTE_AVATARS[i % NOTE_AVATARS.length]}
                  </span>
                  <div>
                    <div className="mb-note-meta">
                      <strong>{item.title}</strong>
                      <time dateTime={item.updatedAt}>
                        {formatTimeAgo(item.updatedAt)}
                      </time>
                    </div>
                    <p>{excerpt(item.body, 95)}</p>
                  </div>
                  <EditBtn
                    isOwner={isOwner}
                    itemId={item.id}
                    onEdit={onEditItem}
                  />
                </li>
              ))}
            </ul>
          )}
          <a href="#chronicle-full" className="mb-panel-cta">
            Read more notes
          </a>
        </section>
      </div>

      <section className="mb-together" aria-label="We're better together">
        <div className="mb-together-deco mb-together-left" aria-hidden>
          <span>🪴</span>
          <span>🏮</span>
        </div>
        <h3>We’re better together.</h3>
        <div className="mb-together-deco mb-together-right" aria-hidden>
          <span>🧺</span>
          <span>🕯️</span>
        </div>
      </section>

      <p className="mb-footer-line">
        Every meeting, every note, every idea… helps our story grow.{" "}
        <span aria-hidden>♡</span>
      </p>

      {/* Full lists kept for deep links / owner browsing */}
      <details id="notices-full" className="mb-full-details">
        <summary>All village notices</summary>
        <div className="mb-full-stack">
          {board.notices.map((item) => (
            <article key={item.id} className="mb-full-card">
              <EditBtn isOwner={isOwner} itemId={item.id} onEdit={onEditItem} />
              <h4>{item.title}</h4>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </details>

      <details id="gatherings-full" className="mb-full-details">
        <summary>Full gathering schedule</summary>
        <div className="mb-full-stack">
          {board.gatherings.map((item) => (
            <article key={item.id} className="mb-full-card">
              <EditBtn isOwner={isOwner} itemId={item.id} onEdit={onEditItem} />
              <h4>{item.title}</h4>
              <p>{item.body}</p>
              <button
                type="button"
                className="mb-mini-primary"
                disabled={busyId === item.id}
                onClick={() => rsvp(item.id)}
              >
                {item.userJoined ? "You're going" : "I'll be there"}
              </button>
            </article>
          ))}
        </div>
      </details>

      <details id="chronicle-full" className="mb-full-details">
        <summary>Full Chronicle</summary>
        <div className="mb-full-stack">
          {board.chronicles.map((item) => (
            <article key={item.id} className="mb-full-card">
              <EditBtn isOwner={isOwner} itemId={item.id} onEdit={onEditItem} />
              <h4>{item.title}</h4>
              <p>
                <em>{item.body}</em>
              </p>
            </article>
          ))}
        </div>
      </details>
    </div>
  );
}
