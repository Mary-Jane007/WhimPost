"use client";

import { useEffect, useRef, useState } from "react";
import {
  ANNOTATION_INKS,
  type AnnotationInk,
  type LibraryAnnotation,
  type ReadingPosition,
} from "@/lib/libraryReadingTypes";

type Props = {
  bookId: string;
  title: string;
  author?: string;
  fileUrl: string;
  fileName?: string | null;
  initialPosition?: ReadingPosition | null;
  onClose: () => void;
  onProgressSaved?: (payload: {
    bookId: string;
    percent: number;
    position: ReadingPosition;
  }) => void;
};

type BookKind = "pdf" | "epub" | "unknown";

type LivePlace = {
  cfi: string | null;
  percent: number;
  page: number | null;
  total: number | null;
  label: string;
};

type EpubBookApi = {
  destroy: () => void;
  ready: Promise<unknown>;
  locations: {
    generate: (chars: number) => Promise<unknown>;
    percentageFromCfi: (cfi: string) => number;
    locationFromCfi: (cfi: string) => number;
    length: () => number;
  };
  renderTo: (
    el: HTMLElement,
    opts: Record<string, unknown>
  ) => {
    display: (target?: string) => Promise<unknown>;
    next: () => void;
    prev: () => void;
    resize: (width: number, height: number) => void;
    themes: { default: (rules: Record<string, unknown>) => void };
    on: (event: string, cb: (loc: unknown) => void) => void;
  };
};

function kindFromUrl(url: string, fileName?: string | null): BookKind {
  const s = `${fileName || ""} ${url}`.toLowerCase();
  if (/\.pdf(\?|#|$)/.test(s) || s.includes("application/pdf")) return "pdf";
  if (/\.epub(\?|#|$)/.test(s) || s.includes("epub")) return "epub";
  return "unknown";
}

function placeFromLocation(
  location: unknown,
  book: EpubBookApi | null
): LivePlace {
  const loc = location as {
    start?: {
      cfi?: string;
      percentage?: number;
      displayed?: { page?: number; total?: number };
    };
  };
  const cfi = loc?.start?.cfi || null;
  let percent = 0;
  let page: number | null = null;
  let total: number | null = null;

  // Whole-book progress from generated locations (accurate).
  if (cfi && book) {
    try {
      const locLen = book.locations.length();
      if (locLen > 0) {
        const pct = book.locations.percentageFromCfi(cfi);
        if (Number.isFinite(pct)) {
          percent = Math.round(Math.max(0, Math.min(1, pct)) * 100);
        }
        const idx = book.locations.locationFromCfi(cfi);
        if (typeof idx === "number" && idx >= 0) {
          page = idx + 1;
          total = locLen;
        }
      }
    } catch {
      // fall through
    }
  }

  // Fallback: section percentage / displayed pages (less accurate).
  if (!percent) {
    const percentage = Number(loc?.start?.percentage);
    if (Number.isFinite(percentage)) {
      percent = Math.round(Math.max(0, Math.min(1, percentage)) * 100);
    }
  }
  if (!page || !total) {
    const dPage = loc?.start?.displayed?.page ?? null;
    const dTotal = loc?.start?.displayed?.total ?? null;
    if (dPage && dTotal && dTotal > 1) {
      page = dPage;
      total = dTotal;
      if (!percent) percent = Math.round((dPage / dTotal) * 100);
    }
  }

  const label =
    total && page
      ? `${percent}% · place ${page} of ${total}`
      : percent
        ? `${percent}% through`
        : "Beginning";

  return { cfi, percent, page, total, label };
}

export function LibraryBookReader({
  bookId,
  title,
  author,
  fileUrl,
  fileName,
  initialPosition,
  onClose,
  onProgressSaved,
}: Props) {
  const kind = kindFromUrl(fileUrl, fileName);
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookApiRef = useRef<EpubBookApi | null>(null);
  const navRef = useRef<{
    next: () => void;
    prev: () => void;
    display: (cfi: string) => void;
    resize: () => void;
  } | null>(null);
  const placeRef = useRef<LivePlace>({
    cfi: initialPosition?.cfi || null,
    percent: initialPosition?.percent || 0,
    page: initialPosition?.page ?? null,
    total: initialPosition?.total ?? null,
    label: initialPosition?.label || "",
  });
  const saveTimer = useRef<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(kind === "epub");
  const [locationLabel, setLocationLabel] = useState(
    initialPosition?.label || ""
  );
  const [saveHint, setSaveHint] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [annotations, setAnnotations] = useState<LibraryAnnotation[]>([]);
  const [noteBody, setNoteBody] = useState("");
  const [noteInk, setNoteInk] = useState<AnnotationInk>("moss");
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteError, setNoteError] = useState("");

  async function persistPlace(place: LivePlace, immediate = false) {
    const run = async () => {
      const res = await fetch("/api/library/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "saveReadingPosition",
          bookId,
          percent: place.percent,
          cfi: place.cfi,
          page: place.page,
          total: place.total,
          label: place.label,
        }),
      });
      if (!res.ok) return;
      const position: ReadingPosition = {
        cfi: place.cfi,
        percent: place.percent,
        page: place.page,
        total: place.total,
        label: place.label,
        updatedAt: new Date().toISOString(),
      };
      onProgressSaved?.({
        bookId,
        percent: place.percent,
        position,
      });
      setSaveHint("Place saved");
      window.setTimeout(() => setSaveHint(""), 1200);
    };

    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    if (immediate) {
      await run();
      return;
    }
    saveTimer.current = window.setTimeout(() => {
      void run();
    }, 900);
  }

  async function loadAnnotations() {
    const res = await fetch(
      `/api/library/annotations?bookId=${encodeURIComponent(bookId)}`
    );
    if (!res.ok) return;
    const data = await res.json();
    setAnnotations(data.annotations || []);
  }

  function openNotes() {
    setNotesOpen(true);
    void loadAnnotations();
  }

  function closeNotes() {
    setNotesOpen(false);
    // Keep the page area full — resize after overlay closes.
    window.requestAnimationFrame(() => navRef.current?.resize());
  }

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      const place = placeRef.current;
      if (place.cfi || place.percent > 0 || place.page) {
        void persistPlace(place, true);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- flush last place on leave
  }, [bookId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (notesOpen) {
          closeNotes();
          return;
        }
        onClose();
        return;
      }
      if (notesOpen) return;
      if (kind !== "epub") return;
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        navRef.current?.next();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        navRef.current?.prev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [kind, onClose, notesOpen]);

  useEffect(() => {
    if (kind !== "epub") return;
    const mount = viewerRef.current;
    if (!mount) return;
    const host: HTMLDivElement = mount;

    let cancelled = false;
    let book: EpubBookApi | null = null;
    let observer: ResizeObserver | null = null;

    async function openEpub() {
      setLoading(true);
      setError("");
      try {
        const mod = await import("epubjs");
        const ePub = (
          "default" in mod && typeof mod.default === "function"
            ? mod.default
            : (mod as unknown as (data: ArrayBuffer) => unknown)
        ) as (data: ArrayBuffer) => EpubBookApi;

        const res = await fetch(fileUrl, { credentials: "include" });
        if (!res.ok) {
          throw new Error(
            res.status === 401
              ? "Sign in to read this book"
              : "Could not load the book file"
          );
        }
        const buffer = await res.arrayBuffer();
        if (cancelled) return;

        book = ePub(buffer);
        bookApiRef.current = book;
        await book.ready;
        if (cancelled) return;

        // Build whole-book location index for accurate % progress.
        try {
          await book.locations.generate(1200);
        } catch {
          // Some EPUBs still work without locations; fall back later.
        }
        if (cancelled) return;

        const measure = () => {
          const rect = host.getBoundingClientRect();
          return {
            width: Math.max(280, Math.floor(rect.width)),
            height: Math.max(320, Math.floor(rect.height)),
          };
        };

        // Wait a frame so the flex layout has real pixel size.
        await new Promise<void>((resolve) =>
          window.requestAnimationFrame(() => resolve())
        );
        if (cancelled) return;

        let { width, height } = measure();
        const rendition = book.renderTo(host, {
          width,
          height,
          flow: "paginated",
          spread: "none",
          allowScriptedContent: true,
        });

        rendition.themes.default({
          body: {
            color: "#2c2418 !important",
            background: "#f6edd9 !important",
            "font-family": "Georgia, 'Times New Roman', serif !important",
            "line-height": "1.7 !important",
            "font-size": "1.05em !important",
            padding: "1.1rem 1.25rem !important",
            margin: "0 !important",
          },
          p: {
            "margin-top": "0.65em !important",
            "margin-bottom": "0.65em !important",
          },
          a: { color: "#5c3a1e !important" },
          img: { "max-width": "100% !important", height: "auto !important" },
        });

        const doResize = () => {
          const size = measure();
          if (size.width > 0 && size.height > 0) {
            rendition.resize(size.width, size.height);
          }
        };

        navRef.current = {
          next: () => void rendition.next(),
          prev: () => void rendition.prev(),
          display: (cfi: string) => void rendition.display(cfi),
          resize: doResize,
        };

        const resumeCfi = initialPosition?.cfi || undefined;
        await rendition.display(resumeCfi);
        if (cancelled) {
          book.destroy();
          return;
        }

        // Ensure full page after first paint.
        doResize();
        window.setTimeout(doResize, 80);
        window.setTimeout(doResize, 280);

        observer = new ResizeObserver(() => doResize());
        observer.observe(host);

        rendition.on("relocated", (location: unknown) => {
          const place = placeFromLocation(location, bookApiRef.current);
          placeRef.current = place;
          setLocationLabel(place.label);
          void persistPlace(place);
        });

        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setLoading(false);
        setError(
          err instanceof Error ? err.message : "Could not open this EPUB"
        );
      }
    }

    void openEpub();

    return () => {
      cancelled = true;
      navRef.current = null;
      bookApiRef.current = null;
      try {
        observer?.disconnect();
      } catch {
        // ignore
      }
      try {
        book?.destroy();
      } catch {
        // ignore
      }
      host.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open once per file
  }, [fileUrl, kind, bookId]);

  async function onSaveNote(e: React.FormEvent) {
    e.preventDefault();
    setNoteBusy(true);
    setNoteError("");
    const place = placeRef.current;
    const res = await fetch("/api/library/annotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookId,
        body: noteBody,
        ink: noteInk,
        cfi: place.cfi,
        pageLabel: place.label,
        percent: place.percent,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setNoteBusy(false);
    if (!res.ok) {
      setNoteError(data.error || "Could not tuck that note away");
      return;
    }
    setAnnotations(data.annotations || []);
    setNoteBody("");
  }

  async function onDeleteNote(id: string) {
    const res = await fetch("/api/library/annotations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, bookId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNoteError(data.error || "Could not remove note");
      return;
    }
    setAnnotations(data.annotations || []);
  }

  return (
    <div
      className="mh-reader-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Reading ${title}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mh-reader">
        <header className="mh-reader-header">
          <div>
            <p className="mh-reader-kicker">Mosshollow reading room</p>
            <h2>{title}</h2>
            {author ? <p className="muted">by {author}</p> : null}
            {saveHint ? (
              <p className="mh-reader-saved" aria-live="polite">
                ✦ {saveHint}
              </p>
            ) : null}
          </div>
          <div className="mh-reader-header-actions">
            {locationLabel ? (
              <span className="mh-reader-loc">{locationLabel}</span>
            ) : null}
            <button
              type="button"
              className="btn-secondary"
              onClick={openNotes}
            >
              Annotations
            </button>
            <a
              className="btn-secondary"
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
            >
              Download
            </a>
            <button type="button" className="btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </header>

        {kind === "epub" ? (
          <div className="mh-reader-toolbar">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navRef.current?.prev()}
              disabled={loading || Boolean(error)}
            >
              ← Previous
            </button>
            <span className="muted">
              Arrow keys or space turn the page
            </span>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navRef.current?.next()}
              disabled={loading || Boolean(error)}
            >
              Next →
            </button>
          </div>
        ) : null}

        <div className="mh-reader-body">
          <div className="mh-reader-stage">
            {loading ? (
              <p className="mh-reader-status">Opening the book…</p>
            ) : null}
            {error ? (
              <p className="form-error mh-reader-status">{error}</p>
            ) : null}

            {kind === "pdf" ? (
              <iframe className="mh-reader-frame" title={title} src={fileUrl} />
            ) : null}

            {kind === "epub" ? (
              <div ref={viewerRef} className="mh-reader-epub" />
            ) : null}

            {kind === "unknown" ? (
              <p className="mh-reader-status">
                This file type can&apos;t be previewed here.{" "}
                <a href={fileUrl} target="_blank" rel="noreferrer">
                  Open the file instead
                </a>
                .
              </p>
            ) : null}

            {/* Annotations open only on demand — overlay, never shrinks the page. */}
            {notesOpen ? (
              <div
                className="mh-margin-overlay"
                role="dialog"
                aria-label="Annotations"
              >
                <button
                  type="button"
                  className="mh-margin-scrim"
                  aria-label="Close annotations"
                  onClick={closeNotes}
                />
                <aside className="mh-margin-notes">
                  <div className="mh-margin-header">
                    <div className="mh-margin-header-row">
                      <div>
                        <p className="mh-reader-kicker">Pressed leaf notes</p>
                        <h3>Whispers in the margin</h3>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary mh-attach-btn"
                        onClick={closeNotes}
                      >
                        Close
                      </button>
                    </div>
                    <p className="muted">
                      Notes stay tucked away until you open Annotations — the
                      page stays full while you read.
                    </p>
                  </div>

                  <form className="mh-margin-compose" onSubmit={onSaveNote}>
                    <label>
                      Your note
                      <textarea
                        value={noteBody}
                        onChange={(e) => setNoteBody(e.target.value)}
                        rows={3}
                        maxLength={1200}
                        placeholder="A soft observation, a favorite line, a question for later…"
                        required
                      />
                    </label>
                    <div
                      className="mh-ink-pots"
                      role="radiogroup"
                      aria-label="Ink"
                    >
                      {ANNOTATION_INKS.map((ink) => (
                        <button
                          key={ink.id}
                          type="button"
                          className={`mh-ink-pot${noteInk === ink.id ? " active" : ""}`}
                          style={{ ["--ink" as string]: ink.swatch }}
                          aria-pressed={noteInk === ink.id}
                          title={ink.label}
                          onClick={() => setNoteInk(ink.id)}
                        >
                          <span className="mh-ink-drop" />
                          <span className="mh-ink-name">{ink.label}</span>
                        </button>
                      ))}
                    </div>
                    {noteError ? (
                      <p className="form-error">{noteError}</p>
                    ) : null}
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={noteBusy || !noteBody.trim()}
                    >
                      {noteBusy ? "Tucking away…" : "Press into the margin"}
                    </button>
                  </form>

                  <ul className="mh-margin-list">
                    {annotations.length === 0 ? (
                      <li className="mh-margin-empty">
                        No notes yet — the margins are blank as fresh parchment.
                      </li>
                    ) : null}
                    {annotations.map((note) => (
                      <li
                        key={note.id}
                        className={`mh-margin-card ink-${note.ink}`}
                      >
                        <div className="mh-margin-card-top">
                          <span className="mh-margin-seal" aria-hidden>
                            ✦
                          </span>
                          <span className="mh-margin-place">
                            {note.pageLabel || `${Math.round(note.percent)}%`}
                          </span>
                        </div>
                        {note.selectedText ? (
                          <p className="mh-margin-quote">
                            “{note.selectedText}”
                          </p>
                        ) : null}
                        <p className="mh-margin-body">{note.body}</p>
                        <div className="mh-margin-card-actions">
                          {note.cfi && kind === "epub" ? (
                            <button
                              type="button"
                              className="btn-secondary mh-attach-btn"
                              onClick={() => {
                                navRef.current?.display(note.cfi!);
                                closeNotes();
                              }}
                            >
                              Flip to page
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="btn-secondary mh-attach-btn"
                            onClick={() => void onDeleteNote(note.id)}
                          >
                            Release note
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </aside>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
