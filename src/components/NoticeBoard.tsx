"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type {
  VillageNoteCommentView,
  VillageNoteNotificationView,
  VillageNoteView,
} from "@/lib/villageNotes";
import { todayNoteDay } from "@/lib/villageNoteDays";

export type VillageNote = VillageNoteView;

function formatDayLabel(day: string) {
  const today = todayNoteDay();
  if (day === today) return "Today";
  const parsed = new Date(`${day}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return day;
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function NoticeBoard({
  initialNotes,
  initialDay,
  initialNotifications = [],
  currentUserId,
}: {
  initialNotes: VillageNote[];
  initialDay: string;
  initialNotifications?: VillageNoteNotificationView[];
  currentUserId: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [day, setDay] = useState(initialDay);
  const [dayDraft, setDayDraft] = useState(initialDay);
  const [loadingDay, setLoadingDay] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);
  const [busyNoteId, setBusyNoteId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {}
  );
  const [openComments, setOpenComments] = useState<Record<string, boolean>>(
    {}
  );

  async function markNotificationsRead(ids?: string[]) {
    const res = await fetch("/api/village/notes/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ids ? { ids } : {}),
    });
    const data = await res.json();
    if (res.ok && Array.isArray(data.notifications)) {
      setNotifications(data.notifications);
    } else if (ids) {
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n))
      );
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  }

  async function openNotification(note: VillageNoteNotificationView) {
    if (!note.isRead) {
      void markNotificationsRead([note.id]);
    }
    if (note.noteDay) {
      await loadDay(note.noteDay);
    }
  }

  async function loadDay(nextDay: string) {
    setLoadingDay(true);
    setError("");
    const res = await fetch(
      `/api/village/notes?day=${encodeURIComponent(nextDay)}`
    );
    const data = await res.json();
    setLoadingDay(false);
    if (!res.ok) {
      setError(data.error || "Could not load notes for that day");
      return;
    }
    const resolved = typeof data.day === "string" ? data.day : nextDay;
    setDay(resolved);
    setDayDraft(resolved);
    setNotes(Array.isArray(data.notes) ? data.notes : []);
    setOpenComments({});
  }

  async function postNote(e: FormEvent) {
    e.preventDefault();
    setPosting(true);
    setError("");
    const res = await fetch("/api/village/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, anonymous }),
    });
    const data = await res.json();
    setPosting(false);
    if (!res.ok) {
      setError(data.error || "Could not post");
      return;
    }
    const resolved =
      typeof data.day === "string" ? data.day : todayNoteDay();
    setDay(resolved);
    setDayDraft(resolved);
    if (Array.isArray(data.notes)) setNotes(data.notes);
    else await loadDay(resolved);
    setBody("");
  }

  async function deleteNote(noteId: string) {
    if (!window.confirm("Take this note down from the square?")) return;
    setBusyNoteId(noteId);
    setError("");
    const res = await fetch("/api/village/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId, day }),
    });
    const data = await res.json();
    setBusyNoteId(null);
    if (!res.ok) {
      setError(data.error || "Could not delete note");
      return;
    }
    if (Array.isArray(data.notes)) setNotes(data.notes);
    else setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  async function toggleLike(note: VillageNote) {
    setBusyNoteId(note.id);
    setError("");
    const res = await fetch("/api/village/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like", noteId: note.id }),
    });
    const data = await res.json();
    setBusyNoteId(null);
    if (!res.ok) {
      setError(data.error || "Could not like note");
      return;
    }
    setNotes((prev) =>
      prev.map((n) =>
        n.id === note.id
          ? {
              ...n,
              likedByMe: Boolean(data.liked),
              likeCount: Number(data.likeCount) || 0,
            }
          : n
      )
    );
  }

  async function postComment(noteId: string) {
    const text = (commentDrafts[noteId] || "").trim();
    if (!text) return;
    setBusyNoteId(noteId);
    setError("");
    const res = await fetch("/api/village/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "comment", noteId, body: text }),
    });
    const data = await res.json();
    setBusyNoteId(null);
    if (!res.ok) {
      setError(data.error || "Could not comment");
      return;
    }
    const comment = data.comment as VillageNoteCommentView;
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? {
              ...n,
              comments: [...n.comments, comment],
              commentCount: n.commentCount + 1,
            }
          : n
      )
    );
    setCommentDrafts((prev) => ({ ...prev, [noteId]: "" }));
    setOpenComments((prev) => ({ ...prev, [noteId]: true }));
  }

  async function deleteComment(noteId: string, commentId: string) {
    setBusyNoteId(noteId);
    setError("");
    const res = await fetch("/api/village/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteComment", commentId }),
    });
    const data = await res.json();
    setBusyNoteId(null);
    if (!res.ok) {
      setError(data.error || "Could not remove comment");
      return;
    }
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? {
              ...n,
              comments: n.comments.filter((c) => c.id !== commentId),
              commentCount: Math.max(0, n.commentCount - 1),
            }
          : n
      )
    );
  }

  const viewingToday = day === todayNoteDay();

  return (
    <section className="village-panel">
      <h2>🏘️ Village Square</h2>
      <p className="section-lead">
        Today&apos;s notes stay on the board. Scroll when the square fills up,
        or search another day to read older keepsakes. Writers can take their
        own notes down; everyone can like and leave a short reply. You&apos;ll
        be notified when neighbors like or comment on yours.
      </p>

      {notifications.length > 0 ? (
        <div className="notice-alerts">
          <div className="notice-alerts-head">
            <h3>Updates on your notes</h3>
            {notifications.some((n) => !n.isRead) ? (
              <button
                type="button"
                className="nav-ghost"
                onClick={() => void markNotificationsRead()}
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <ul className="notice-alert-list">
            {notifications.slice(0, 8).map((n) => (
              <li key={n.id} className={n.isRead ? undefined : "unread"}>
                <button
                  type="button"
                  className="notice-alert-item"
                  onClick={() => void openNotification(n)}
                >
                  <span className="notice-alert-kind">
                    {n.kind === "like" ? "♥" : "💬"}
                  </span>
                  <span>
                    <strong>
                      {n.actor.displayName || n.actor.username}
                    </strong>{" "}
                    {n.kind === "like" ? "liked" : "commented on"} your note
                    {n.kind === "comment" && n.body.includes(":")
                      ? ` — “${n.body.split(":").slice(1).join(":").trim().slice(0, 60)}”`
                      : ""}
                    <em>{n.notePreview ? ` · “${n.notePreview}”` : ""}</em>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form className="notice-form" onSubmit={postNote}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="A kind word for the village…"
          maxLength={280}
          rows={3}
        />
        <label className="anon-toggle">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
          />
          Leave anonymously
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={posting}>
          {posting ? "Pinning…" : "Pin to the square"}
        </button>
      </form>

      <form
        className="notice-day-search"
        onSubmit={(e) => {
          e.preventDefault();
          void loadDay(dayDraft);
        }}
      >
        <label>
          <span>Look up a day</span>
          <input
            type="date"
            value={dayDraft}
            max={todayNoteDay()}
            onChange={(e) => setDayDraft(e.target.value)}
          />
        </label>
        <button type="submit" className="btn-secondary" disabled={loadingDay}>
          {loadingDay ? "Opening…" : "Show notes"}
        </button>
        {!viewingToday ? (
          <button
            type="button"
            className="nav-ghost"
            disabled={loadingDay}
            onClick={() => void loadDay(todayNoteDay())}
          >
            Back to today
          </button>
        ) : null}
      </form>

      <div className="notice-day-label">
        Showing <strong>{formatDayLabel(day)}</strong>
        {notes.length > 0 ? ` · ${notes.length} note${notes.length === 1 ? "" : "s"}` : ""}
      </div>

      <div className="notice-list-scroll">
        <ul className="notice-list">
          {notes.length === 0 && (
            <li className="muted">
              {viewingToday
                ? "The square is quiet today. Be the first note."
                : "No notes were pinned on this day."}
            </li>
          )}
          {notes.map((n) => {
            const commentsOpen = openComments[n.id] ?? n.commentCount > 0;
            const busy = busyNoteId === n.id;
            return (
              <li
                key={n.id}
                className={n.imageUrl ? "notice-with-image" : undefined}
              >
                {n.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={n.imageUrl}
                    alt="Shared village keepsake"
                    className="notice-share-image"
                  />
                ) : null}
                <div className="notice-body">
                  <p>{n.body}</p>
                  <span className="notice-meta">
                    {n.anonymous ? (
                      "A kind stranger"
                    ) : n.author ? (
                      <>
                        <Link href={`/profile/${n.author.username}`}>
                          {n.author.displayName}
                        </Link>{" "}
                        (@{n.author.username})
                      </>
                    ) : (
                      "A villager"
                    )}
                  </span>

                  <div className="notice-actions">
                    <button
                      type="button"
                      className={
                        n.likedByMe ? "notice-action liked" : "notice-action"
                      }
                      disabled={busy}
                      onClick={() => void toggleLike(n)}
                      aria-pressed={n.likedByMe}
                    >
                      {n.likedByMe ? "♥ Liked" : "♡ Like"}
                      {n.likeCount > 0 ? ` · ${n.likeCount}` : ""}
                    </button>
                    <button
                      type="button"
                      className="notice-action"
                      onClick={() =>
                        setOpenComments((prev) => ({
                          ...prev,
                          [n.id]: !commentsOpen,
                        }))
                      }
                    >
                      💬 Comment
                      {n.commentCount > 0 ? ` · ${n.commentCount}` : ""}
                    </button>
                    {n.isMine || n.authorId === currentUserId ? (
                      <button
                        type="button"
                        className="notice-action notice-delete"
                        disabled={busy}
                        onClick={() => void deleteNote(n.id)}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>

                  {commentsOpen ? (
                    <div className="notice-comments">
                      {n.comments.length === 0 ? (
                        <p className="muted notice-comments-empty">
                          No replies yet — leave a kind word.
                        </p>
                      ) : (
                        <ul className="notice-comment-list">
                          {n.comments.map((c) => (
                            <li key={c.id}>
                              <p>{c.body}</p>
                              <span>
                                <Link href={`/profile/${c.author.username}`}>
                                  {c.author.displayName}
                                </Link>
                                {c.isMine ? (
                                  <>
                                    {" · "}
                                    <button
                                      type="button"
                                      className="notice-comment-delete"
                                      disabled={busy}
                                      onClick={() =>
                                        void deleteComment(n.id, c.id)
                                      }
                                    >
                                      Remove
                                    </button>
                                  </>
                                ) : null}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <form
                        className="notice-comment-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void postComment(n.id);
                        }}
                      >
                        <input
                          value={commentDrafts[n.id] || ""}
                          onChange={(e) =>
                            setCommentDrafts((prev) => ({
                              ...prev,
                              [n.id]: e.target.value,
                            }))
                          }
                          placeholder="A short reply…"
                          maxLength={280}
                          disabled={busy}
                        />
                        <button
                          type="submit"
                          className="btn-secondary"
                          disabled={busy || !(commentDrafts[n.id] || "").trim()}
                        >
                          Reply
                        </button>
                      </form>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
