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

type PageDraft = {
  title: string;
  body: string;
  illustrationUrl: string;
  unlockKey: ChronicleActivityKey;
  unlockCount: number;
  published: boolean;
};

function draftFromPage(page: ChroniclePageContent): PageDraft {
  return {
    title: page.title,
    body: page.body,
    illustrationUrl: page.illustrationUrl || "",
    unlockKey: page.unlockKey,
    unlockCount: page.unlockCount,
    published: page.published,
  };
}

export function ChronicleAdminEditor({
  initialVillageId,
}: {
  initialVillageId: VillageId;
}) {
  const [open, setOpen] = useState(false);
  const [villages, setVillages] = useState<VillageOption[]>([]);
  const [villageId, setVillageId] = useState<VillageId>(initialVillageId);
  const [pages, setPages] = useState<ChroniclePageContent[]>([]);
  const [drafts, setDrafts] = useState<
    Partial<Record<ChroniclePageNumber, PageDraft>>
  >({});
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
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);

  function applyDraft(draft: PageDraft | undefined) {
    if (!draft) return;
    setTitle(draft.title);
    setBody(draft.body);
    setIllustrationUrl(draft.illustrationUrl || "");
    setUnlockKey(draft.unlockKey);
    setUnlockCount(draft.unlockCount);
    setPublished(draft.published);
  }

  function currentDraft(): PageDraft {
    return {
      title,
      body,
      illustrationUrl,
      unlockKey,
      unlockCount,
      published,
    };
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
    const nextDrafts: Partial<Record<ChroniclePageNumber, PageDraft>> = {};
    for (const page of list) {
      nextDrafts[page.pageNumber] = draftFromPage(page);
    }
    setDrafts(nextDrafts);
    const current =
      list.find((p) => p.pageNumber === nextPage) || list[0] || null;
    if (current) {
      setPageNumber(current.pageNumber);
      applyDraft(nextDrafts[current.pageNumber]);
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
    const draft = currentDraft();
    const res = await fetch("/api/chronicle/pages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        villageId,
        pageNumber,
        title: draft.title,
        body: draft.body,
        illustrationUrl: draft.illustrationUrl,
        unlockKey: draft.unlockKey,
        unlockCount: draft.unlockCount,
        published: draft.published,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save");
      return;
    }
    const list = (data.pages || []) as ChroniclePageContent[];
    setPages(list);
    setDrafts((prev) => {
      const next = { ...prev };
      for (const page of list) {
        next[page.pageNumber] =
          page.pageNumber === pageNumber ? draft : draftFromPage(page);
      }
      next[pageNumber] = draft;
      return next;
    });
    setStatus("Chronicle page saved — it stays written for every visit.");
  }

  async function uploadIllustration(file: File | null) {
    if (!file) return;
    setUploading(true);
    setUploadPercent(0);
    setError("");
    try {
      const form = new FormData();
      form.set("image", file);
      const { uploadFormData } = await import("@/lib/clientUpload");
      const { ok, data } = await uploadFormData("/api/uploads", form, {
        onProgress: setUploadPercent,
      });
      if (!ok) {
        throw new Error(
          (typeof data.error === "string" && data.error) || "Upload failed"
        );
      }
      const url = typeof data.url === "string" ? data.url : "";
      if (!url) throw new Error("Upload failed");
      setIllustrationUrl(url);
      setStatus("Illustration attached — save the page to publish it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadPercent(null);
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
        illustrations. Saved text is kept across reloads and fresh servers.
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
                const leaving = currentDraft();
                const nextDrafts = { ...drafts, [pageNumber]: leaving };
                setDrafts(nextDrafts);
                setPageNumber(n);
                applyDraft(
                  nextDrafts[n] ||
                    (pages.find((p) => p.pageNumber === n)
                      ? draftFromPage(
                          pages.find((p) => p.pageNumber === n)!
                        )
                      : undefined)
                );
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
          <span>
            {uploading
              ? uploadPercent != null
                ? `Uploading ${uploadPercent}%…`
                : "Uploading…"
              : "Upload illustration"}
          </span>
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
        {uploading && uploadPercent != null ? (
          <div
            className="mh-upload-meter"
            role="progressbar"
            aria-valuenow={uploadPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${uploadPercent}%` }} />
          </div>
        ) : null}

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
