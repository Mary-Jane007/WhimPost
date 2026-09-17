"use client";

import { useEffect, useRef, useState } from "react";
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

const DRAFT_STORAGE_KEY = "whimpost-chronicle-drafts-v1";
const AUTOSAVE_MS = 1200;

type StoredDrafts = Partial<
  Record<
    VillageId,
    Partial<Record<ChroniclePageNumber, PageDraft & { dirtyAt: string }>>
  >
>;

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

function draftsEqual(a: PageDraft, b: PageDraft) {
  return (
    a.title === b.title &&
    a.body === b.body &&
    a.illustrationUrl === b.illustrationUrl &&
    a.unlockKey === b.unlockKey &&
    a.unlockCount === b.unlockCount &&
    a.published === b.published
  );
}

function readStoredDrafts(): StoredDrafts {
  try {
    if (typeof window === "undefined") return {};
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredDrafts;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStoredDraft(
  villageId: VillageId,
  pageNumber: ChroniclePageNumber,
  draft: PageDraft | null
) {
  try {
    if (typeof window === "undefined") return;
    const all = readStoredDrafts();
    const village = { ...(all[villageId] || {}) };
    if (!draft) {
      delete village[pageNumber];
    } else {
      village[pageNumber] = { ...draft, dirtyAt: new Date().toISOString() };
    }
    if (Object.keys(village).length === 0) {
      delete all[villageId];
    } else {
      all[villageId] = village;
    }
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // localStorage may be unavailable — server save is still the source of truth
  }
}

function clearStoredDraft(villageId: VillageId, pageNumber: ChroniclePageNumber) {
  writeStoredDraft(villageId, pageNumber, null);
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
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const latestRef = useRef({
    villageId,
    pageNumber,
    title,
    body,
    illustrationUrl,
    unlockKey,
    unlockCount,
    published,
  });

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);
  useEffect(() => {
    savingRef.current = saving;
  }, [saving]);
  useEffect(() => {
    latestRef.current = {
      villageId,
      pageNumber,
      title,
      body,
      illustrationUrl,
      unlockKey,
      unlockCount,
      published,
    };
  }, [
    villageId,
    pageNumber,
    title,
    body,
    illustrationUrl,
    unlockKey,
    unlockCount,
    published,
  ]);

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

  function markDirty(next: PageDraft) {
    setDirty(true);
    writeStoredDraft(villageId, pageNumber, next);
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      void persistDraft({ reason: "autosave" });
    }, AUTOSAVE_MS);
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
    const stored = readStoredDrafts()[nextVillage] || {};
    const nextDrafts: Partial<Record<ChroniclePageNumber, PageDraft>> = {};
    for (const page of list) {
      const serverDraft = draftFromPage(page);
      const local = stored[page.pageNumber];
      if (local && !draftsEqual(local, serverDraft)) {
        // Recover unsaved browser draft if it differs from the server copy.
        nextDrafts[page.pageNumber] = {
          title: local.title,
          body: local.body,
          illustrationUrl: local.illustrationUrl || "",
          unlockKey: local.unlockKey,
          unlockCount: local.unlockCount,
          published: local.published,
        };
      } else {
        nextDrafts[page.pageNumber] = serverDraft;
        clearStoredDraft(nextVillage, page.pageNumber);
      }
    }
    setDrafts(nextDrafts);
    const current =
      list.find((p) => p.pageNumber === nextPage) || list[0] || null;
    if (current) {
      setPageNumber(current.pageNumber);
      const draft = nextDrafts[current.pageNumber];
      applyDraft(draft);
      const isDirtyLocal = Boolean(
        draft &&
          stored[current.pageNumber] &&
          !draftsEqual(draft, draftFromPage(current))
      );
      setDirty(isDirtyLocal);
      if (isDirtyLocal) {
        setStatus("Recovered unsaved draft — autosaving so it stays written…");
        window.setTimeout(() => {
          void persistDraft({
            reason: "recover",
            villageId: nextVillage,
            pageNumber: current.pageNumber,
            draft: nextDrafts[current.pageNumber],
          });
        }, 0);
      }
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

  async function persistDraft(opts?: {
    reason?: "manual" | "autosave" | "close" | "navigate" | "recover" | "unload";
    villageId?: VillageId;
    pageNumber?: ChroniclePageNumber;
    draft?: PageDraft;
    keepalive?: boolean;
  }): Promise<boolean> {
    const snap = latestRef.current;
    const targetVillage = opts?.villageId || snap.villageId;
    const targetPage = opts?.pageNumber || snap.pageNumber;
    const draft = opts?.draft || {
      title: snap.title,
      body: snap.body,
      illustrationUrl: snap.illustrationUrl,
      unlockKey: snap.unlockKey,
      unlockCount: snap.unlockCount,
      published: snap.published,
    };

    if (draft.title.trim().length < 2 || draft.body.trim().length < 8) {
      if (opts?.reason === "manual") {
        setError("Title or story text is too short to save");
      }
      return false;
    }

    // Avoid overlapping saves for the same editor session.
    if (savingRef.current && opts?.reason === "autosave") return false;

    if (opts?.reason !== "unload") {
      setSaving(true);
      savingRef.current = true;
      setError("");
      if (opts?.reason === "autosave") {
        setStatus("Autosaving…");
      } else if (opts?.reason !== "recover") {
        setStatus("");
      }
    }

    writeStoredDraft(targetVillage, targetPage, draft);

    try {
      const res = await fetch("/api/chronicle/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          villageId: targetVillage,
          pageNumber: targetPage,
          title: draft.title,
          body: draft.body,
          illustrationUrl: draft.illustrationUrl,
          unlockKey: draft.unlockKey,
          unlockCount: draft.unlockCount,
          published: draft.published,
        }),
        keepalive: Boolean(opts?.keepalive),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (opts?.reason !== "unload") {
          setError(
            (typeof data.error === "string" && data.error) || "Could not save"
          );
          setStatus("");
        }
        return false;
      }

      const list = (data.pages || []) as ChroniclePageContent[];
      if (opts?.reason !== "unload") {
        setPages(list);
        setDrafts((prev) => {
          const next = { ...prev };
          for (const page of list) {
            next[page.pageNumber] =
              page.pageNumber === targetPage ? draft : draftFromPage(page);
          }
          next[targetPage] = draft;
          return next;
        });
        clearStoredDraft(targetVillage, targetPage);
        setDirty(false);
        dirtyRef.current = false;
        const durableOk = data?.durable?.ok !== false && data?.exported !== false;
        setStatus(
          durableOk
            ? "Saved permanently — safe to leave this page."
            : "Saved on this server — durable copy may still be syncing."
        );
      } else {
        clearStoredDraft(targetVillage, targetPage);
      }
      return true;
    } catch (err) {
      if (opts?.reason !== "unload") {
        setError(err instanceof Error ? err.message : "Could not save");
        setStatus("");
      }
      return false;
    } finally {
      if (opts?.reason !== "unload") {
        setSaving(false);
        savingRef.current = false;
      }
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
      autosaveTimer.current = null;
    }
    await persistDraft({ reason: "manual" });
  }

  async function closeEditor() {
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
      autosaveTimer.current = null;
    }
    if (dirtyRef.current) {
      setStatus("Saving before close…");
      await persistDraft({ reason: "close" });
    }
    setOpen(false);
  }

  async function changeVillage(next: VillageId) {
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
      autosaveTimer.current = null;
    }
    if (dirtyRef.current) {
      setStatus("Saving before switching village…");
      await persistDraft({ reason: "navigate" });
    }
    await load(next, 1);
  }

  async function changePage(n: ChroniclePageNumber) {
    if (n === pageNumber) return;
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
      autosaveTimer.current = null;
    }
    const leaving = currentDraft();
    const nextDrafts = { ...drafts, [pageNumber]: leaving };
    setDrafts(nextDrafts);
    if (dirtyRef.current) {
      await persistDraft({ reason: "navigate", draft: leaving });
    }
    setPageNumber(n);
    applyDraft(
      nextDrafts[n] ||
        (pages.find((p) => p.pageNumber === n)
          ? draftFromPage(pages.find((p) => p.pageNumber === n)!)
          : undefined)
    );
    const server = pages.find((p) => p.pageNumber === n);
    const draft = nextDrafts[n];
    setDirty(Boolean(server && draft && !draftsEqual(draft, draftFromPage(server))));
    setShowPreview(false);
  }

  // Save if the tab/page is closing with unsaved work.
  useEffect(() => {
    if (!open) return;

    const flushOnLeave = () => {
      if (!dirtyRef.current || savingRef.current) return;
      const snap = latestRef.current;
      const draft: PageDraft = {
        title: snap.title,
        body: snap.body,
        illustrationUrl: snap.illustrationUrl,
        unlockKey: snap.unlockKey,
        unlockCount: snap.unlockCount,
        published: snap.published,
      };
      writeStoredDraft(snap.villageId, snap.pageNumber, draft);
      void persistDraft({
        reason: "unload",
        draft,
        keepalive: true,
      });
    };

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      flushOnLeave();
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("pagehide", flushOnLeave);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("pagehide", flushOnLeave);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

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
      markDirty({ ...currentDraft(), illustrationUrl: url });
      setStatus("Illustration attached — autosaving…");
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
        <button type="button" className="nav-ghost" onClick={() => void closeEditor()}>
          Close
        </button>
      </div>
      <p className="muted">
        Edits autosave and are written permanently — safe to close or leave
        this page after you see the saved message.
      </p>

      {loading ? <p className="muted">Loading parchment…</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {status ? <p className="muted">{status}</p> : null}
      {dirty && !saving ? (
        <p className="muted">Unsaved changes — autosaving shortly…</p>
      ) : null}

      <form className="lc-admin-form" onSubmit={save}>
        <label>
          Village
          <select
            value={villageId}
            onChange={(e) => {
              const next = e.target.value as VillageId;
              void changeVillage(next);
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
              onClick={() => void changePage(n)}
            >
              Page {ROMAN_PAGES[n]}
            </button>
          ))}
        </div>

        <label>
          Title
          <input
            value={title}
            onChange={(e) => {
              const next = e.target.value;
              setTitle(next);
              markDirty({ ...currentDraft(), title: next });
            }}
            maxLength={120}
            required
          />
        </label>

        <label>
          Story text
          <textarea
            value={body}
            onChange={(e) => {
              const next = e.target.value;
              setBody(next);
              markDirty({ ...currentDraft(), body: next });
            }}
            rows={8}
            maxLength={8000}
            required
          />
        </label>

        <label>
          Illustration URL (optional)
          <input
            value={illustrationUrl}
            onChange={(e) => {
              const next = e.target.value;
              setIllustrationUrl(next);
              markDirty({ ...currentDraft(), illustrationUrl: next });
            }}
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
            onChange={(e) => {
              const next = e.target.value as ChronicleActivityKey;
              setUnlockKey(next);
              markDirty({ ...currentDraft(), unlockKey: next });
            }}
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
            onChange={(e) => {
              const next = Number(e.target.value) || 1;
              setUnlockCount(next);
              markDirty({ ...currentDraft(), unlockCount: next });
            }}
          />
        </label>

        <label className="lc-admin-check">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => {
              const next = e.target.checked;
              setPublished(next);
              markDirty({ ...currentDraft(), published: next });
            }}
          />
          Published (visible to villagers when unlocked)
        </label>

        <div className="lc-admin-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : dirty ? "Save now" : "Saved"}
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
