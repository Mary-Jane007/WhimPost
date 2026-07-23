"use client";

import { useEffect, useState } from "react";
import type { ChroniclePageContent } from "@/lib/chronicleContent";
import {
  CHRONICLE_ACTIVITY_LABELS,
  ROMAN_PAGES,
  type ChronicleActivityKey,
  type ChroniclePageNumber,
} from "@/lib/chronicleContent";
import type { VillageId } from "@/lib/villages";

type VillageOption = { id: VillageId; name: string };

export function ChronicleAdminEditor({
  initialVillageId,
}: {
  initialVillageId: VillageId;
}) {
  const [open, setOpen] = useState(false);
  const [villages, setVillages] = useState<VillageOption[]>([]);
  const [villageId, setVillageId] = useState<VillageId>(initialVillageId);
  const [pages, setPages] = useState<ChroniclePageContent[]>([]);
  const [pageNumber, setPageNumber] = useState<ChroniclePageNumber>(1);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [illustrationUrl, setIllustrationUrl] = useState("");
  const [unlockKey, setUnlockKey] =
    useState<ChronicleActivityKey>("garden.completeDaily");
  const [unlockCount, setUnlockCount] = useState(1);
  const [published, setPublished] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  function applyPage(page: ChroniclePageContent | undefined) {
    if (!page) return;
    setTitle(page.title);
    setBody(page.body);
    setIllustrationUrl(page.illustrationUrl || "");
    setUnlockKey(page.unlockKey);
    setUnlockCount(page.unlockCount);
    setPublished(page.published);
  }

  async function load(
    nextVillage: VillageId = villageId,
    nextPage: ChroniclePageNumber = pageNumber
  ) {
    setLoading(true);
    setError("");
    setStatus("");
    const res = await fetch(
      `/api/chronicle/pages?villageId=${encodeURIComponent(nextVillage)}`
    );
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not load Chronicle pages");
      return;
    }
    const list = (data.pages || []) as ChroniclePageContent[];
    setVillages(data.villages || []);
    setVillageId(nextVillage);
    setPages(list);
    const current =
      list.find((p) => p.pageNumber === nextPage) || list[0] || null;
    if (current) {
      setPageNumber(current.pageNumber);
      applyPage(current);
    }
  }

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      void load(initialVillageId, 1);
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialVillageId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setStatus("");
    const res = await fetch("/api/chronicle/pages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        villageId,
        pageNumber,
        title,
        body,
        illustrationUrl,
        unlockKey,
        unlockCount,
        published,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save");
      return;
    }
    setPages(data.pages || []);
    setStatus("Chronicle page saved — villagers will see it immediately.");
  }

  async function uploadIllustration(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.set("image", file);
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setIllustrationUrl(data.url);
      setStatus("Illustration attached — save the page to publish it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setOpen(true)}
      >
        Edit Lost Chronicles
      </button>
    );
  }

  return (
    <section className="lc-admin">
      <div className="lc-admin-head">
        <h3>Lost Chronicles — Admin</h3>
        <button type="button" className="nav-ghost" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
      <p className="muted">
        Edit each village&apos;s four manuscript pages, unlock rules, and
        illustrations. No coding required.
      </p>

      {loading ? <p className="muted">Loading parchment…</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {status ? <p className="muted">{status}</p> : null}

      <form className="lc-admin-form" onSubmit={save}>
        <label>
          Village
          <select
            value={villageId}
            onChange={(e) => {
              const next = e.target.value as VillageId;
              void load(next, 1);
            }}
          >
            {villages.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>

        <div className="lc-admin-page-tabs">
          {([1, 2, 3, 4] as ChroniclePageNumber[]).map((n) => (
            <button
              key={n}
              type="button"
              className={pageNumber === n ? "active" : ""}
              onClick={() => {
                setPageNumber(n);
                applyPage(pages.find((p) => p.pageNumber === n));
                setShowPreview(false);
              }}
            >
              Page {ROMAN_PAGES[n]}
            </button>
          ))}
        </div>

        <label>
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
          />
        </label>

        <label>
          Story text
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            maxLength={8000}
            required
          />
        </label>

        <label>
          Illustration URL (optional)
          <input
            value={illustrationUrl}
            onChange={(e) => setIllustrationUrl(e.target.value)}
            placeholder="/api/uploads/… or /moon/…"
          />
        </label>
        <label className="lc-admin-upload">
          <span>{uploading ? "Uploading…" : "Upload illustration"}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading || saving}
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              e.target.value = "";
              void uploadIllustration(file);
            }}
          />
        </label>

        <label>
          Unlock requirement
          <select
            value={unlockKey}
            onChange={(e) =>
              setUnlockKey(e.target.value as ChronicleActivityKey)
            }
          >
            {(
              Object.entries(CHRONICLE_ACTIVITY_LABELS) as Array<
                [ChronicleActivityKey, string]
              >
            ).map(([key, label]) => (
              <option key={key} value={key}>
                {label} ({key})
              </option>
            ))}
          </select>
        </label>

        <label>
          Times required
          <input
            type="number"
            min={1}
            max={99}
            value={unlockCount}
            onChange={(e) => setUnlockCount(Number(e.target.value) || 1)}
          />
        </label>

        <label className="lc-admin-check">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          Published (visible to villagers when unlocked)
        </label>

        <div className="lc-admin-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save page"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? "Hide preview" : "Preview"}
          </button>
        </div>
      </form>

      {showPreview ? (
        <article className="lc-parchment lc-admin-preview">
          {illustrationUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={illustrationUrl} alt="" className="lc-page-illustration" />
          ) : null}
          <h3 className="lc-page-title">{title || "Untitled"}</h3>
          <p className="lc-page-body">
            <span className="lc-dropcap">{(body || "?").trim().charAt(0)}</span>
            {(body || "").trim().slice(1)}
          </p>
          <p className="lc-meta">
            Unlocks after {unlockCount}× {CHRONICLE_ACTIVITY_LABELS[unlockKey]}
            {published ? "" : " · draft"}
          </p>
        </article>
      ) : null}
    </section>
  );
}
