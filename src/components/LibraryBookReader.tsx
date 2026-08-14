"use client";

import Link from "next/link";
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
  /** Real href so Close works even if React never hydrates. */
  closeHref?: string;
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
  /** True when percent came from whole-book locations (safe to persist). */
  reliable: boolean;
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

function loadVendorScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${src}"]`
    ) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "1") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error(`Could not load ${src}`)),
        { once: true }
      );
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "1";
      resolve();
    };
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Use the same classic vendor build as library-reader-boot.js.
 * Webpack's epubjs/jszip chunk often paints an empty .epub-container
 * (no iframe) in this app — the vendor scripts render reliably.
 */
async function loadVendorEpub(): Promise<
  (data: ArrayBuffer, options?: Record<string, unknown>) => EpubBookApi
> {
  await loadVendorScript("/vendor/jszip.min.js");
  await loadVendorScript("/vendor/epub.min.js");
  const ePub = (
    window as unknown as {
      ePub?: (
        data: ArrayBuffer,
        options?: Record<string, unknown>
      ) => EpubBookApi;
    }
  ).ePub;
  if (typeof ePub !== "function") {
    throw new Error("Could not load the EPUB reader");
  }
  return ePub;
}

/** Skip old chapter-local bookmarks that break resume on re-open. */
function usableResumeCfi(
  pos?: ReadingPosition | null
): string | undefined {
  if (!pos?.cfi) return undefined;
  const label = (pos.label || "").trim();
  if (
    typeof pos.total === "number" &&
    pos.total > 0 &&
    pos.total <= 12 &&
    /^page\s+\d+\s+of\s+\d+$/i.test(label)
  ) {
    return undefined;
  }
  return pos.cfi;
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
  let reliable = false;

  // Whole-book progress from generated locations (accurate).
  // Do NOT use chapter `displayed.page/total` for percent — that is local to
  // the current spine item and was inflating progress (e.g. mid-chapter-1 → 50%+).
  if (cfi && book) {
    try {
      const locLen = book.locations.length();
      if (locLen > 0) {
        const idxRaw = book.locations.locationFromCfi(cfi);
        if (typeof idxRaw === "number" && idxRaw >= 0) {
          const idx = Math.min(idxRaw, Math.max(0, locLen - 1));
          page = idx + 1;
          total = locLen;
          // Map first location → 0%, last → 100% (epubjs uses loc/total and
          // also treats loc=0 as falsy, which under-reports the start).
          percent =
            locLen <= 1
              ? idx > 0
                ? 100
                : 0
              : Math.round((idx / (locLen - 1)) * 100);
          percent = Math.max(0, Math.min(100, percent));
          reliable = true;
        } else {
          const pct = book.locations.percentageFromCfi(cfi);
          if (typeof pct === "number" && Number.isFinite(pct)) {
            percent = Math.round(Math.max(0, Math.min(1, pct)) * 100);
            reliable = true;
          }
        }
      }
    } catch {
      // fall through — keep prior percent at 0 until locations exist
    }
  }

  // Soft chapter label only (never drives whole-book %).
  if (!page || !total) {
    const dPage = loc?.start?.displayed?.page ?? null;
    const dTotal = loc?.start?.displayed?.total ?? null;
    if (dPage && dTotal && dTotal > 1 && !reliable) {
      page = dPage;
      total = dTotal;
    }
  }

  const label =
    reliable && total && page
      ? `${percent}% · place ${page} of ${total}`
      : reliable && percent > 0
        ? `${percent}% through`
        : !reliable && page && total
          ? `Chapter place ${page} of ${total}`
          : "Beginning";

  return { cfi, percent, page, total, label, reliable };
}

export function LibraryBookReader({
  bookId,
  title,
  author,
  fileUrl,
  fileName,
  initialPosition,
  onClose,
  closeHref = "/library",
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
  const resumeCfi = usableResumeCfi(initialPosition);
  const placeRef = useRef<LivePlace>({
    cfi: resumeCfi || null,
    percent: resumeCfi ? initialPosition?.percent || 0 : 0,
    page: resumeCfi ? initialPosition?.page ?? null : null,
    total: resumeCfi ? initialPosition?.total ?? null : null,
    label: resumeCfi ? initialPosition?.label || "" : "",
    reliable: Boolean(resumeCfi && (initialPosition?.percent || 0) > 0),
  });
  const saveTimer = useRef<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(kind === "epub");
  const [locationLabel, setLocationLabel] = useState(
    resumeCfi ? initialPosition?.label || "" : ""
  );
  const [saveHint, setSaveHint] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [annotations, setAnnotations] = useState<LibraryAnnotation[]>([]);
  const [noteBody, setNoteBody] = useState("");
  const [noteInk, setNoteInk] = useState<AnnotationInk>("moss");
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteError, setNoteError] = useState("");

  async function persistPlace(place: LivePlace, immediate = false) {
    // Keep the CFI even before whole-book % is ready so Continue works.
    if (!place.cfi && !(place.reliable && place.percent > 0)) return;

    const run = async () => {
      const res = await fetch("/api/library/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "saveReadingPosition",
          bookId,
          percent: place.reliable ? place.percent : undefined,
          cfi: place.cfi,
          page: place.page,
          total: place.total,
          label: place.label,
          reliable: place.reliable,
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
      if (place.reliable || place.cfi) {
        onProgressSaved?.({
          bookId,
          percent: place.percent,
          position,
        });
      }
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
    }, 700);
  }

  function flushPlaceBeacon() {
    const place = placeRef.current;
    if (!place.cfi && !(place.reliable && place.percent > 0)) return;
    const payload = JSON.stringify({
      type: "saveReadingPosition",
      bookId,
      percent: place.reliable ? place.percent : undefined,
      cfi: place.cfi,
      page: place.page,
      total: place.total,
      label: place.label,
      reliable: place.reliable,
    });
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/library/progress", blob);
        return;
      }
    } catch {
      // fall through to fetch
    }
    void fetch("/api/library/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    });
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

    // Mark the book as opened / in progress as soon as the reader mounts.
    void fetch("/api/library/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "saveReadingPosition",
        bookId,
        label: initialPosition?.label || "Reading",
        percent:
          initialPosition && Number.isFinite(initialPosition.percent)
            ? initialPosition.percent
            : undefined,
        cfi: initialPosition?.cfi || undefined,
        page: initialPosition?.page ?? undefined,
        total: initialPosition?.total ?? undefined,
      }),
    }).catch(() => {});

    function onLeave() {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      flushPlaceBeacon();
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") onLeave();
    }

    window.addEventListener("pagehide", onLeave);
    window.addEventListener("beforeunload", onLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("pagehide", onLeave);
      window.removeEventListener("beforeunload", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      onLeave();
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
      // Page keys scroll within the chapter; arrows move between chapters.
      if (e.key === "ArrowRight") {
        e.preventDefault();
        navRef.current?.next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        navRef.current?.prev();
      } else if (e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        const stage = viewerRef.current?.closest(".mh-reader-stage") as
          | HTMLElement
          | null;
        const scroller =
          (viewerRef.current?.querySelector(".epub-container") as HTMLElement) ||
          stage;
        if (scroller) {
          scroller.scrollBy({
            top: Math.max(240, scroller.clientHeight * 0.88),
            behavior: "smooth",
          });
        }
      } else if (e.key === "PageUp") {
        e.preventDefault();
        const stage = viewerRef.current?.closest(".mh-reader-stage") as
          | HTMLElement
          | null;
        const scroller =
          (viewerRef.current?.querySelector(".epub-container") as HTMLElement) ||
          stage;
        if (scroller) {
          scroller.scrollBy({
            top: -Math.max(240, scroller.clientHeight * 0.88),
            behavior: "smooth",
          });
        }
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
    let tearDownTimer: number | null = null;
    const token = `react-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Claim immediately so the classic boot script does not race us.
    host.dataset.reactToken = token;
    host.dataset.owned = "react";

    const stillMine = () =>
      !cancelled && host.dataset.reactToken === token;

    const measure = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(
        280,
        Math.floor(rect.width || host.clientWidth || window.innerWidth * 0.7)
      );
      const height = Math.max(
        320,
        Math.floor(
          rect.height || host.clientHeight || window.innerHeight * 0.65
        )
      );
      return { width, height };
    };

    function abandonBook() {
      try {
        book?.destroy();
      } catch {
        // ignore
      }
      book = null;
      bookApiRef.current = null;
    }

    async function paintBook(
      ePub: (
        data: ArrayBuffer,
        options?: Record<string, unknown>
      ) => EpubBookApi,
      buffer: ArrayBuffer
    ) {
      host.innerHTML = "";
      // Copy bytes — some browsers detach the fetch ArrayBuffer under load.
      const bytes = buffer.slice(0);
      book = ePub(bytes, { replacements: "blobUrl" });
      bookApiRef.current = book;
      await book.ready;
      if (!stillMine()) {
        abandonBook();
        return null;
      }

      await new Promise<void>((resolve) =>
        window.requestAnimationFrame(() => resolve())
      );
      if (!stillMine()) {
        abandonBook();
        return null;
      }

      let { width, height } = measure();
      if (
        host.getBoundingClientRect().height < 40 ||
        host.getBoundingClientRect().width < 40
      ) {
        await new Promise<void>((resolve) => {
          window.setTimeout(() => resolve(), 80);
        });
        if (!stillMine()) {
          abandonBook();
          return null;
        }
        ({ width, height } = measure());
      }

      const rendition = book.renderTo(host, {
        width,
        height,
        // Full chapter documents — scroll within the chapter instead of
        // clipping text at the bottom of a fixed paginated frame.
        flow: "scrolled-doc",
        manager: "default",
        spread: "none",
        minSpreadWidth: 100000,
        allowScriptedContent: true,
      });

      rendition.themes.default({
        html: {
          width: "100% !important",
          height: "auto !important",
          "min-height": "100% !important",
          overflow: "visible !important",
          margin: "0 !important",
          padding: "0 !important",
        },
        body: {
          color: "#2c2418 !important",
          background: "#f6edd9 !important",
          "font-family": "Georgia, 'Times New Roman', serif !important",
          "line-height": "1.7 !important",
          "font-size": "1.05em !important",
          padding: "1.1rem 1.25rem 2.5rem !important",
          margin: "0 !important",
          width: "100% !important",
          height: "auto !important",
          "min-height": "100% !important",
          "max-height": "none !important",
          "box-sizing": "border-box !important",
          overflow: "visible !important",
        },
        p: {
          "margin-top": "0.65em !important",
          "margin-bottom": "0.65em !important",
        },
        a: { color: "#5c3a1e !important" },
        img: {
          "max-width": "100% !important",
          "max-height": "none !important",
          width: "auto !important",
          height: "auto !important",
          "object-fit": "contain !important",
        },
        svg: {
          "max-width": "100% !important",
          "max-height": "none !important",
        },
        table: {
          "max-width": "100% !important",
          "overflow-x": "auto !important",
        },
      });

      // Paint the start first so a stale resume CFI after re-upload cannot
      // hang the reader on “Opening…” forever.
      await rendition.display();
      if (!stillMine()) {
        abandonBook();
        host.innerHTML = "";
        return null;
      }

      // Empty container = failed paint (seen with webpack epubjs / races).
      if (!host.querySelector("iframe")) {
        abandonBook();
        host.innerHTML = "";
        return null;
      }

      return rendition;
    }

    async function openEpub() {
      setLoading(true);
      setError("");
      try {
        const ePub = await loadVendorEpub();
        if (!stillMine()) return;

        const res = await fetch(fileUrl, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          let message =
            res.status === 401
              ? "Sign in to read this book"
              : "Could not load the book file";
          try {
            const parsed = JSON.parse(detail) as { error?: string };
            if (parsed?.error) message = parsed.error;
          } catch {
            // ignore
          }
          throw new Error(message);
        }
        const buffer = await res.arrayBuffer();
        if (!stillMine()) return;

        const head = new Uint8Array(buffer.slice(0, 64));
        const headText = String.fromCharCode(...Array.from(head));
        const isZip = head[0] === 0x50 && head[1] === 0x4b;
        if (
          !isZip ||
          buffer.byteLength < 1024 ||
          headText.includes("git-lfs")
        ) {
          throw new Error(
            "This EPUB’s file is missing on the shelf — re-upload it from the library admin."
          );
        }

        let rendition = await paintBook(ePub, buffer);
        // One retry covers Strict Mode teardown racing the first paint.
        if (!rendition && stillMine()) {
          rendition = await paintBook(ePub, buffer);
        }
        if (!stillMine()) return;
        if (!rendition || !book) {
          throw new Error("Could not open this EPUB");
        }

        const doResize = () => {
          const size = measure();
          if (size.width > 0 && size.height > 0) {
            rendition!.resize(size.width, size.height);
          }
        };

        navRef.current = {
          next: () => void rendition!.next(),
          prev: () => void rendition!.prev(),
          display: (cfi: string) => void rendition!.display(cfi),
          resize: doResize,
        };

        setLoading(false);
        doResize();

        const resumeCfi = usableResumeCfi(initialPosition);
        if (resumeCfi) {
          try {
            await Promise.race([
              rendition.display(resumeCfi),
              new Promise<void>((resolve) => {
                window.setTimeout(resolve, 2000);
              }),
            ]);
          } catch {
            // Keep the start page — resume is best-effort.
          }
        }

        if (!stillMine()) return;

        window.setTimeout(doResize, 50);
        window.setTimeout(doResize, 200);
        window.setTimeout(doResize, 600);

        observer = new ResizeObserver(() => doResize());
        observer.observe(host);

        rendition.on("relocated", (location: unknown) => {
          if (host.dataset.reactToken !== token) return;
          const place = placeFromLocation(location, bookApiRef.current);
          if (!place.reliable) {
            place.percent = placeRef.current.percent;
            if (!place.label || place.label === "Beginning") {
              place.label = placeRef.current.label || place.label;
            }
          }
          placeRef.current = place;
          setLocationLabel(place.label);
          void persistPlace(place);
        });

        const bookForLocations = book;
        void (async () => {
          try {
            await bookForLocations.locations.generate(1000);
            if (!stillMine()) return;
            const cfi = placeRef.current.cfi;
            if (!cfi) return;
            const place = placeFromLocation(
              { start: { cfi } },
              bookApiRef.current
            );
            if (!place.reliable) return;
            placeRef.current = place;
            setLocationLabel(place.label);
            void persistPlace(place, true);
          } catch {
            // Some EPUBs still work without locations.
          }
        })();
      } catch (err) {
        if (!stillMine()) return;
        setLoading(false);
        setError(
          err instanceof Error ? err.message : "Could not open this EPUB"
        );
      }
    }

    void openEpub();

    return () => {
      cancelled = true;
      // Defer teardown so React Strict Mode's sync remount can reclaim the
      // mount before we wipe a healthy iframe (immediate destroy blanked it).
      tearDownTimer = window.setTimeout(() => {
        if (host.dataset.reactToken !== token) {
          return;
        }
        navRef.current = null;
        const liveBook = bookApiRef.current;
        bookApiRef.current = null;
        try {
          observer?.disconnect();
        } catch {
          // ignore
        }
        try {
          liveBook?.destroy();
        } catch {
          // ignore
        }
        try {
          book?.destroy();
        } catch {
          // ignore
        }
        host.innerHTML = "";
        if (host.dataset.owned === "react") delete host.dataset.owned;
        delete host.dataset.reactToken;
      }, 0);
      void tearDownTimer;
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
            <span className="mh-reader-loc" aria-live="polite">
              {locationLabel || " "}
            </span>
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
            <Link
              href={closeHref}
              className="btn-primary"
              onClick={(e) => {
                e.preventDefault();
                onClose();
              }}
            >
              Close
            </Link>
          </div>
        </header>

        {kind === "epub" ? (
          <div className="mh-reader-toolbar">
            <button
              type="button"
              className="btn-secondary"
              data-reader-nav="prev"
              onClick={() => navRef.current?.prev()}
              disabled={loading || Boolean(error)}
            >
              ← Previous chapter
            </button>
            <span className="muted">
              Scroll to read the full chapter · arrows change chapter
            </span>
            <button
              type="button"
              className="btn-secondary"
              data-reader-nav="next"
              onClick={() => navRef.current?.next()}
              disabled={loading || Boolean(error)}
            >
              Next chapter →
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
              <iframe
                className="mh-reader-frame"
                title={title}
                // Ask the browser PDF viewer to fit one full page on screen.
                src={`${fileUrl}#toolbar=1&navpanes=0&view=Fit`}
              />
            ) : null}

            {kind === "epub" ? (
              <div
                ref={viewerRef}
                className="mh-reader-epub"
                data-file-url={fileUrl}
                data-book-id={bookId}
                data-resume-cfi={usableResumeCfi(initialPosition) || ""}
              />
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
