"use client";

import { useRef, useState } from "react";
import { uploadFormData } from "@/lib/clientUpload";
import type { VillageMediaMap } from "@/lib/villageMediaShared";

/** Owner-only control to attach/replace a catalog image on village workshop cards. */
export function OwnerImageAttach({
  mediaKey,
  label = "Add file",
  hasImage,
  onChanged,
}: {
  mediaKey: string;
  label?: string;
  hasImage?: boolean;
  onChanged?: (images: VillageMediaMap) => void;
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
    try {
      const form = new FormData();
      form.set("image", file);
      const { ok, data } = await uploadFormData("/api/uploads", form, {
        onProgress: setPercent,
      });
      if (!ok) {
        throw new Error(
          (typeof data.error === "string" && data.error) || "Upload failed"
        );
      }
      const url = typeof data.url === "string" ? data.url : "";
      if (!url) throw new Error("Upload failed");

      const res = await fetch("/api/village-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: mediaKey, url }),
      });
      const saved = await res.json();
      if (!res.ok) {
        throw new Error(
          (typeof saved.error === "string" && saved.error) ||
            "Could not attach image"
        );
      }
      setStatus(hasImage ? "Image replaced." : "File added.");
      if (saved.images && typeof saved.images === "object") {
        onChanged?.(saved.images as VillageMediaMap);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Upload failed — check your connection and try again"
      );
    } finally {
      setBusy(false);
      setPercent(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mh-attach owner-image-attach">
      <label
        className={`btn-secondary mh-attach-btn${busy ? " is-busy" : ""}`}
        title={hasImage ? `Replace image (${mediaKey})` : `Add file (${mediaKey})`}
      >
        {busy
          ? percent != null
            ? `Uploading ${percent}%…`
            : "Uploading…"
          : hasImage
            ? "Replace file"
            : label}
        <input
          ref={inputRef}
          className="mh-visually-hidden"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
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
    </div>
  );
}
