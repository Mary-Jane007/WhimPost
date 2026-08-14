"use client";

import { useRef, useState } from "react";

const MAX_BOOK_BYTES = 500 * 1024 * 1024;

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
  const [percent, setPercent] = useState<number | null>(null);

  function upload(file: File) {
    if (file.size > MAX_BOOK_BYTES) {
      setError("Book files must be under 500MB");
      return;
    }
    setBusy(true);
    setError("");
    setStatus("");
    setPercent(0);

    const form = new FormData();
    form.set("attachTo", bookId);
    form.set("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/library/books");
    xhr.responseType = "json";
    xhr.upload.onprogress = (ev) => {
      if (!ev.lengthComputable) return;
      setPercent(Math.min(99, Math.round((ev.loaded / ev.total) * 100)));
    };
    xhr.onload = () => {
      setBusy(false);
      setPercent(null);
      if (inputRef.current) inputRef.current.value = "";
      const data =
        (xhr.response as { error?: string } | null) ||
        (() => {
          try {
            return JSON.parse(xhr.responseText) as { error?: string };
          } catch {
            return {};
          }
        })();
      if (xhr.status < 200 || xhr.status >= 300) {
        setError(data.error || "Could not attach file");
        return;
      }
      setStatus(hasFile ? "File replaced." : "EPUB attached.");
      onAttached?.();
    };
    xhr.onerror = () => {
      setBusy(false);
      setPercent(null);
      if (inputRef.current) inputRef.current.value = "";
      setError("Upload failed — check your connection and try again");
    };
    xhr.send(form);
  }

  return (
    <form
      className="mh-attach"
      action="/api/library/books"
      method="post"
      encType="multipart/form-data"
      onSubmit={(e) => {
        const file = inputRef.current?.files?.[0];
        if (!file) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        upload(file);
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
          ? percent != null
            ? `Uploading ${percent}%…`
            : "Uploading…"
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
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      {status ? <p className="form-success">{status}</p> : null}
    </form>
  );
}
