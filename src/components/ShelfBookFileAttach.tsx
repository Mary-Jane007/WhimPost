"use client";

import { useRef, useState } from "react";
import { uploadFormData } from "@/lib/clientUpload";

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

  async function upload(file: File) {
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

    try {
      const { ok, data } = await uploadFormData("/api/library/books", form, {
        onProgress: setPercent,
      });
      setBusy(false);
      setPercent(null);
      if (inputRef.current) inputRef.current.value = "";
      if (!ok) {
        setError(
          (typeof data.error === "string" && data.error) ||
            "Could not attach file"
        );
        return;
      }
      setStatus(hasFile ? "File replaced." : "EPUB attached.");
      onAttached?.();
    } catch (err) {
      setBusy(false);
      setPercent(null);
      if (inputRef.current) inputRef.current.value = "";
      setError(
        err instanceof Error
          ? err.message
          : "Upload failed — check your connection and try again"
      );
    }
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
      {busy && percent != null ? (
        <div
          className="mh-upload-meter"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${percent}%` }} />
        </div>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
      {status ? <p className="form-success">{status}</p> : null}
    </form>
  );
}
