"use client";

import Link from "next/link";
import { useState } from "react";

export function NoticeBoard({
  initialNotes,
}: {
  initialNotes: Array<{
    id: string;
    body: string;
    anonymous: boolean;
    createdAt: string;
    author: { displayName: string; username: string } | null;
  }>;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);

  async function postNote(e: React.FormEvent) {
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
    const refresh = await fetch("/api/village/notes");
    const refreshed = await refresh.json();
    if (refresh.ok) setNotes(refreshed.notes);
    setBody("");
  }

  return (
    <section className="village-panel">
      <h2>🌳 Notice Board</h2>
      <p className="section-lead">
        Leave a note for your neighbors — encouragement, dreams, or a quiet hello.
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
          {posting ? "Pinning…" : "Pin to the board"}
        </button>
      </form>
      <ul className="notice-list">
        {notes.length === 0 && (
          <li className="muted">The board is quiet. Be the first note.</li>
        )}
        {notes.map((n) => (
          <li key={n.id}>
            <p>{n.body}</p>
            <span>
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
          </li>
        ))}
      </ul>
    </section>
  );
}
