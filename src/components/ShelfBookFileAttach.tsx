"use client";

import { useRef, useState } from "react";

/** Compact owner control to attach/replace EPUB|PDF on an existing shelf title. */
export function ShelfBookFileAttach({
  bookId,
  bookTitle,
  hasFile,
  returnTo = "/library",
  onAttached,
}: {
  bookId: string;
  bookTitle: string;
  hasFile?: boolean;
  /** Where to send the browser after a no-JS form upload. */
  returnTo?: string;
  onAttached?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setError("");
    setStatus("");
    const form = new FormData();
    form.set("attachTo", bookId);
    form.set("file", file);
    const res = await fetch("/api/library/books", {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    if (!res.ok) {
      setError(data.error || "Could not attach file");
      return;
    }
    setStatus(hasFile ? "File replaced." : "EPUB attached.");
    onAttached?.();
  }

  return (
    <form
      className="mh-attach"
      action="/api/library/books"
      method="post"
      encType="multipart/form-data"
      onSubmit={(e) => {
        const file = inputRef.current?.files?.[0];
        if (!file) return;
        e.preventDefault();
        void upload(file);
      }}
    >
      <input type="hidden" name="attachTo" value={bookId} />
      <input type="hidden" name="next" value={returnTo} />
      <label
        className={`btn-secondary mh-attach-btn${busy ? " is-busy" : ""}`}
        title={
          hasFile
            ? `Replace file for ${bookTitle}`
            : `Attach EPUB/PDF to ${bookTitle}`
        }
      >
        {busy
          ? "Uploading…"
          : hasFile
            ? "Replace EPUB"
            : "Attach EPUB"}
        <input
          ref={inputRef}
          className="mh-visually-hidden"
          type="file"
          name="file"
          accept=".pdf,.epub,application/pdf,application/epub+zip"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            e.currentTarget.form?.requestSubmit();
          }}
        />
      </label>
      <button type="submit" className="mh-attach-upload">
        Upload
      </button>
      {error ? <p className="form-error">{error}</p> : null}
      {status ? <p className="form-success">{status}</p> : null}
    </form>
  );
}
