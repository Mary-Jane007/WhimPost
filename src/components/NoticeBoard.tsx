"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type {
  VillageNoteCommentView,
  VillageNoteView,
} from "@/lib/villageNotes";

export type VillageNote = VillageNoteView;

export function NoticeBoard({
  initialNotes,
  currentUserId,
}: {
  initialNotes: VillageNote[];
  currentUserId: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
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

  async function refreshNotes() {
    const refresh = await fetch("/api/village/notes");
    const refreshed = await refresh.json();
    if (refresh.ok) setNotes(refreshed.notes);
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
    if (Array.isArray(data.notes)) setNotes(data.notes);
    else await refreshNotes();
    setBody("");
  }

  async function deleteNote(noteId: string) {
    if (!window.confirm("Take this note down from the square?")) return;
    setBusyNoteId(noteId);
    setError("");
    const res = await fetch("/api/village/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId }),
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

  return (
    <section className="village-panel">
      <h2>🏘️ Village Square</h2>
      <p className="section-lead">
        Notes and keepsakes from neighbors — crafts, photos, and kind words left
        on the village board. Writers can take their own notes down; everyone can
        like and leave a short reply.
      </p>
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
      <ul className="notice-list">
        {notes.length === 0 && (
          <li className="muted">The square is quiet. Be the first note.</li>
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
    </section>
  );
}
