"use client";

import { useRef, useState } from "react";
import { uploadFormData } from "@/lib/clientUpload";

/** Compact owner control to attach/replace a cover image on a shelf title. */
export function ShelfBookCoverAttach({
  bookId,
  bookTitle,
  hasCover,
  returnTo = "/library",
  onAttached,
}: {
  bookId: string;
  bookTitle: string;
  hasCover?: boolean;
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
    setBusy(true);
    setError("");
    setStatus("");
    setPercent(0);
    const form = new FormData();
    form.set("attachTo", bookId);
    form.set("cover", file);
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
            "Could not attach cover"
        );
        return;
      }
      setStatus(hasCover ? "Cover replaced." : "Cover added.");
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
          hasCover
            ? `Replace cover for ${bookTitle}`
            : `Add cover image for ${bookTitle}`
        }
      >
        {busy
          ? percent != null
            ? `Uploading ${percent}%…`
            : "Uploading…"
          : hasCover
            ? "Replace cover"
            : "Add cover"}
        <input
          ref={inputRef}
          className="mh-visually-hidden"
          type="file"
          name="cover"
          accept="image/jpeg,image/png,image/webp,image/gif"
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
