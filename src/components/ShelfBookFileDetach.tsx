"use client";

import { useState } from "react";

/** Owner control to detach EPUB/PDF while keeping the shelf title. */
export function ShelfBookFileDetach({
  bookId,
  bookTitle,
  returnTo = "/library",
  onDetached,
}: {
  bookId: string;
  bookTitle: string;
  returnTo?: string;
  onDetached?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function clearFile() {
    setBusy(true);
    setError("");
    setStatus("");
    const form = new FormData();
    form.set("intent", "clear-file");
    form.set("bookId", bookId);
    const res = await fetch("/api/library/books", {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not remove the EPUB");
      return;
    }
    setStatus("EPUB removed.");
    onDetached?.();
  }

  return (
    <form
      className="mh-attach"
      action="/api/library/books"
      method="post"
      onSubmit={(e) => {
        e.preventDefault();
        if (
          !window.confirm(
            `Remove the EPUB/PDF from “${bookTitle}”? The shelf title stays — only the file is cleared.`
          )
        ) {
          return;
        }
        void clearFile();
      }}
    >
      <input type="hidden" name="intent" value="clear-file" />
      <input type="hidden" name="bookId" value={bookId} />
      <input type="hidden" name="next" value={returnTo} />
      <button
        type="submit"
        className={`btn-secondary mh-attach-btn${busy ? " is-busy" : ""}`}
        disabled={busy}
        title={`Remove EPUB/PDF from ${bookTitle}`}
      >
        {busy ? "Removing file…" : "Remove EPUB"}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
      {status ? <p className="form-success">{status}</p> : null}
    </form>
  );
}
