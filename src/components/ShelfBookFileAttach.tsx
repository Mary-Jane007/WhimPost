"use client";

import { useRef, useState } from "react";

/** Compact owner control to attach/replace EPUB|PDF on an existing shelf title. */
export function ShelfBookFileAttach({
  bookId,
  bookTitle,
  hasFile,
  onAttached,
}: {
  bookId: string;
  bookTitle: string;
  hasFile?: boolean;
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
    <div className="mh-attach">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.epub,application/pdf,application/epub+zip"
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
      </button>
      {error ? <p className="form-error">{error}</p> : null}
      {status ? <p className="form-success">{status}</p> : null}
    </div>
  );
}
