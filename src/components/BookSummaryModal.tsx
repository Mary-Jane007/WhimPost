"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type BookSummaryInfo = {
  id: string;
  title: string;
  author: string;
  description?: string | null;
  coverEmoji?: string | null;
  coverUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  minutes?: number | null;
  metaLine?: string | null;
};

/** Cover/banner click → summary popup; owner can edit the blurb. */
export function BookSummaryModal({
  book,
  isOwner = false,
  onClose,
  onSaved,
}: {
  book: BookSummaryInfo;
  isOwner?: boolean;
  onClose: () => void;
  onSaved?: (next: BookSummaryInfo) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(book.description || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(book.description || "");

  useEffect(() => {
    setDraft(book.description || "");
    setSummary(book.description || "");
    setEditing(false);
    setError("");
  }, [book.id, book.description]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (editing) {
          setEditing(false);
          setDraft(summary);
          return;
        }
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, onClose, summary]);

  async function saveSummary(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwner || busy) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("intent", "set-summary");
      form.set("bookId", book.id);
      form.set("description", draft);
      const res = await fetch("/api/library/books", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not save the summary");
      }
      const nextText =
        typeof data.book?.description === "string"
          ? data.book.description
          : draft.trim();
      setSummary(nextText);
      setDraft(nextText);
      setEditing(false);
      onSaved?.({ ...book, description: nextText });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="mh-summary-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Summary of ${book.title}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mh-summary-panel">
        <div className="mh-summary-head">
          <div
            className={`mh-summary-cover${book.coverUrl ? " has-image" : ""}`}
            aria-hidden
          >
            {book.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={book.coverUrl} alt="" />
            ) : (
              <span>{book.coverEmoji || "📖"}</span>
            )}
          </div>
          <div className="mh-summary-titles">
            <p className="mh-reader-kicker">Book summary</p>
            <h3>{book.title}</h3>
            <p className="muted">by {book.author}</p>
            {book.minutes ? (
              <p className="mh-meta">About {book.minutes} minutes</p>
            ) : null}
            {book.metaLine ? <p className="mh-meta">{book.metaLine}</p> : null}
          </div>
          <button
            type="button"
            className="btn-secondary mh-attach-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {editing ? (
          <form className="mh-summary-edit" onSubmit={(e) => void saveSummary(e)}>
            <label>
              Summary
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={7}
                maxLength={2000}
                placeholder="A short invitation to the book…"
                disabled={busy}
                autoFocus
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <div className="mh-summary-actions">
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? "Saving…" : "Save summary"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={busy}
                onClick={() => {
                  setEditing(false);
                  setDraft(summary);
                  setError("");
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="mh-summary-body">
            {summary.trim() ? (
              <p>{summary}</p>
            ) : (
              <p className="muted">
                No summary yet
                {isOwner ? " — add one so villagers know what’s waiting inside." : "."}
              </p>
            )}
            <div className="mh-summary-actions">
              {book.fileUrl ? (
                <Link
                  href={`/library/read/${encodeURIComponent(book.id)}`}
                  className="btn-primary"
                >
                  Read in the library
                  {book.fileName ? ` · ${book.fileName}` : ""}
                </Link>
              ) : null}
              {isOwner ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditing(true)}
                >
                  Edit summary
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
