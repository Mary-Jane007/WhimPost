"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export type VillageNote = {
  id: string;
  body: string;
  anonymous: boolean;
  imageUrl?: string | null;
  createdAt: string;
  author: { displayName: string; username: string } | null;
};

export function NoticeBoard({
  initialNotes,
}: {
  initialNotes: VillageNote[];
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);

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
    const refresh = await fetch("/api/village/notes");
    const refreshed = await refresh.json();
    if (refresh.ok) setNotes(refreshed.notes);
    setBody("");
  }

  return (
    <section className="village-panel">
      <h2>🏘️ Village Square</h2>
      <p className="section-lead">
        Notes and workshop shares from neighbors — crafts, photos, and kind
        words pinned for everyone.
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
        {notes.map((n) => (
          <li key={n.id} className={n.imageUrl ? "notice-with-image" : undefined}>
            {n.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={n.imageUrl}
                alt="Shared workshop craft"
                className="notice-share-image"
              />
            ) : null}
            <div>
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
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
