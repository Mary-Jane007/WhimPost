"use client";

import { useRef, useState } from "react";

/** Compact owner control to attach/replace a cover image on a shelf title. */
export function ShelfBookCoverAttach({
  bookId,
  bookTitle,
  hasCover,
  onAttached,
}: {
  bookId: string;
  bookTitle: string;
  hasCover?: boolean;
  onAttached?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function onPick(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError("");
    setStatus("");
    const form = new FormData();
    form.set("attachTo", bookId);
    form.set("cover", file);
    const res = await fetch("/api/library/books", {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    if (!res.ok) {
      setError(data.error || "Could not attach cover");
      return;
    }
    setStatus(hasCover ? "Cover replaced." : "Cover added.");
    onAttached?.();
  }

  return (
    <div className="mh-attach">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        disabled={busy}
        onChange={(e) => void onPick(e.target.files?.[0] || null)}
      />
      <button
        type="button"
        className="btn-secondary mh-attach-btn"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        title={
          hasCover
            ? `Replace cover for ${bookTitle}`
            : `Add cover image for ${bookTitle}`
        }
      >
        {busy ? "Uploading…" : hasCover ? "Replace cover" : "Add cover"}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
      {status ? <p className="form-success">{status}</p> : null}
    </div>
  );
}
