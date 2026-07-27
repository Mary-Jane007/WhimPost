"use client";

import { useState } from "react";

/** Owner control to remove a shelf book (including built-in catalog titles). */
export function ShelfBookRemove({
  bookId,
  bookTitle,
  returnTo = "/library",
  onRemoved,
}: {
  bookId: string;
  bookTitle: string;
  /** Where to send the browser after a no-JS form remove. */
  returnTo?: string;
  onRemoved?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function removeBook() {
    setBusy(true);
    setError("");
    const form = new FormData();
    form.set("intent", "remove");
    form.set("bookId", bookId);
    const res = await fetch("/api/library/books", {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not remove book");
      return;
    }
    onRemoved?.();
  }

  return (
    <form
      className="mh-attach"
      action="/api/library/books"
      method="post"
      onSubmit={(e) => {
        // When React hydrates: confirm + fetch. When it doesn't, the browser
        // posts the form and the API redirects back to the library.
        e.preventDefault();
        if (
          !window.confirm(
            `Remove “${bookTitle}” from the Grand Library? Built-in titles stay gone until you add them again.`
          )
        ) {
          return;
        }
        void removeBook();
      }}
    >
      <input type="hidden" name="intent" value="remove" />
      <input type="hidden" name="bookId" value={bookId} />
      <input type="hidden" name="next" value={returnTo} />
      <button
        type="submit"
        className={`btn-secondary mh-attach-btn mh-remove-btn${busy ? " is-busy" : ""}`}
        disabled={busy}
        title={`Remove ${bookTitle} from the library`}
      >
        {busy ? "Removing…" : "Remove"}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </form>
  );
}
