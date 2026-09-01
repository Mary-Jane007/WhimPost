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

type EpubNavItem = {
  id?: string;
  label?: string;
  href?: string;
  subitems?: EpubNavItem[];
};

type TocItem = {
  id: string;
  label: string;
  href: string;
  depth: number;
};

type EpubBookApi = {
  destroy: () => void;
  ready: Promise<unknown>;
  navigation?: { toc?: EpubNavItem[] };
  loaded: {
    navigation: Promise<{ toc?: EpubNavItem[] }>;
  };
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
    on: (event: string, cb: (...args: unknown[]) => void) => void;
    hooks?: {
      content?: {
        register: (fn: (contents: {
          document: Document;
          content?: HTMLElement;
          overflow?: (value: string) => void;
        }) => void) => void;
      };
    };
  };
};

function flattenToc(
  items: EpubNavItem[] | undefined,
  depth = 0,
  out: TocItem[] = []
): TocItem[] {
  for (const item of items || []) {
    const href = (item.href || "").trim();
    const label = (item.label || "").replace(/\s+/g, " ").trim() || "Untitled";
    if (href) {
      out.push({
        id: item.id || `${depth}-${out.length}-${href}`,
        label,
        href,
        depth,
      });
    }
    if (item.subitems?.length) {
      flattenToc(item.subitems, depth + 1, out);
    }
  }
  return out;
}

/** Stretch the iframe to the chapter's real content height so nothing is clipped. */
function expandChapterToFullHeight(host: HTMLElement) {
  const iframe = host.querySelector("iframe") as HTMLIFrameElement | null;
  if (!iframe) return;
  try {
    const doc = iframe.contentDocument;
    if (!doc?.documentElement) return;
    const body = doc.body;
    // Clear leftover height locks from EPUB CSS that clip tall chapters.
    doc.documentElement.style.height = "auto";
    doc.documentElement.style.minHeight = "0";
    doc.documentElement.style.overflow = "visible";
    if (body) {
      body.style.height = "auto";
      body.style.minHeight = "0";
      body.style.maxHeight = "none";
      body.style.overflow = "visible";
    }
    const contentHeight = Math.max(
      doc.documentElement.scrollHeight || 0,
      body?.scrollHeight || 0,
      body?.offsetHeight || 0,
      480
    );
    const next = `${Math.ceil(contentHeight + 48)}px`;
    // Skip no-op updates — repeated height writes were causing open-time flinch.
    if (iframe.style.height === next) return;
    iframe.style.height = next;
    iframe.style.maxHeight = "none";
    iframe.style.overflow = "visible";
    const view = iframe.parentElement as HTMLElement | null;
    if (view) {
      view.style.height = next;
      view.style.maxHeight = "none";
      view.style.overflow = "visible";
    }
  } catch {
    // Cross-origin / not ready yet — ignore.
  }
}

function scheduleExpand(host: HTMLElement, timers: number[]) {
  const run = () => expandChapterToFullHeight(host);
  run();
  // One late pass for images/fonts — avoid the old 4-step height stair-step.
  timers.push(window.setTimeout(run, 320));
}

const CHAPTER_THEME = {
  html: {
    width: "100% !important",
    height: "auto !important",
    "min-height": "0 !important",
    overflow: "visible !important",
    margin: "0 !important",
    padding: "0 !important",
  },
  body: {
    color: "#2c2418 !important",
    background: "#f6edd9 !important",
    "font-family": "Georgia, 'Times New Roman', serif !important",
    "line-height": "1.75 !important",
    "font-size": "1.08em !important",
    padding: "1.15rem 1.35rem 3rem !important",
    margin: "0 auto !important",
    width: "100% !important",
    "max-width": "42rem !important",
    height: "auto !important",
    "min-height": "0 !important",
    "max-height": "none !important",
    "box-sizing": "border-box !important",
    overflow: "visible !important",
  },
  p: {
    "margin-top": "0.7em !important",
    "margin-bottom": "0.7em !important",
  },
  a: { color: "#5c3a1e !important" },
  img: {
    "max-width": "100% !important",
    "max-height": "none !important",
    width: "auto !important",
    height: "auto !important",
    "object-fit": "contain !important",
    display: "block !important",
  },
  svg: {
    "max-width": "100% !important",
    "max-height": "none !important",
  },
  table: {
    "max-width": "100% !important",
  },
  "*": {
    "max-height": "none !important",
  },
} as Record<string, Record<string, string>>;

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
  (data: ArrayBuffer | string, options?: Record<string, unknown>) => EpubBookApi
> {
  await loadVendorScript("/vendor/jszip.min.js");
  await loadVendorScript("/vendor/epub.min.js");
  const ePub = (
    window as unknown as {
      ePub?: (
        data: ArrayBuffer | string,
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
    display: (href?: string) => void;
    resize: () => void;
  } | null>(null);
  const initialResumeCfi = usableResumeCfi(initialPosition);
  const resumeCfiRef = useRef<string | undefined>(initialResumeCfi);
  const [resumeCfi, setResumeCfi] = useState<string | undefined>(
    initialResumeCfi
  );
  const placeRef = useRef<LivePlace>({
    cfi: initialResumeCfi || null,
    percent: initialResumeCfi ? initialPosition?.percent || 0 : 0,
    page: initialResumeCfi ? initialPosition?.page ?? null : null,
    total: initialResumeCfi ? initialPosition?.total ?? null : null,
    label: initialResumeCfi ? initialPosition?.label || "" : "",
    reliable: Boolean(
      initialResumeCfi && (initialPosition?.percent || 0) > 0
    ),
  });
  const saveTimer = useRef<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(kind === "epub");
  const [locationLabel, setLocationLabel] = useState(
    initialResumeCfi ? initialPosition?.label || "" : ""
  );
  const [saveHint, setSaveHint] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [restartBusy, setRestartBusy] = useState(false);
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
      // Avoid mounting/unmounting header text on every save — that resized the
      // stage and fed a ResizeObserver ↔ rendition.resize twitch loop.
      setSaveHint((prev) => (prev === "Place saved" ? prev : "Place saved"));
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

  function openToc() {
    setTocOpen(true);
  }

  function closeToc() {
    setTocOpen(false);
    window.requestAnimationFrame(() => navRef.current?.resize());
  }

  function jumpToTocHref(href: string) {
    navRef.current?.display(href);
    closeToc();
  }

  async function restartReading() {
    if (kind !== "epub" || restartBusy) return;
    const ok = window.confirm(
      "Start this book over from the beginning? Your saved place will be cleared."
    );
    if (!ok) return;
    setRestartBusy(true);
    try {
      if (saveTimer.current) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      await fetch("/api/library/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "resetReadingProgress",
          bookId,
        }),
      });
      setResumeCfi(undefined);
      resumeCfiRef.current = undefined;
      placeRef.current = {
        cfi: null,
        percent: 0,
        page: null,
        total: null,
        label: "Beginning",
        reliable: true,
      };
      setLocationLabel("Beginning");
      setSaveHint("Place cleared");
      window.setTimeout(() => setSaveHint(""), 1200);
      onProgressSaved?.({
        bookId,
        percent: 0,
        position: {
          cfi: null,
          percent: 0,
          page: null,
          total: null,
          label: "Beginning",
          updatedAt: new Date().toISOString(),
        },
      });
      navRef.current?.display();
      setTocOpen(false);
    } finally {
      setRestartBusy(false);
    }
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
        if (tocOpen) {
          closeToc();
          return;
        }
        if (notesOpen) {
          closeNotes();
          return;
        }
        onClose();
        return;
      }
      if (notesOpen || tocOpen) return;
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
  }, [kind, onClose, notesOpen, tocOpen]);

  useEffect(() => {
    if (kind !== "epub") return;

    let cancelled = false;
    let book: EpubBookApi | null = null;
    let observer: ResizeObserver | null = null;
    let tearDownTimer: number | null = null;
    let host: HTMLDivElement | null = null;
    let token = "";
    let startTimer: number | null = null;

    const stillMine = () =>
      Boolean(host) && !cancelled && host!.dataset.reactToken === token;

    const measure = () => {
      const el = host!;
      const rect = el.getBoundingClientRect();
      const width = Math.max(
        280,
        Math.floor(rect.width || el.clientWidth || window.innerWidth * 0.7)
      );
      const height = Math.max(
        320,
        Math.floor(
          rect.height || el.clientHeight || window.innerHeight * 0.65
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
        data: ArrayBuffer | string,
        options?: Record<string, unknown>
      ) => EpubBookApi,
      source: ArrayBuffer | string
    ) {
      const mount = host!;
      mount.innerHTML = "";
      // Blob object URLs have no .epub extension, so epubjs treats them as a
      // directory of files and hangs on /META-INF/container.xml. Always open
      // binary bytes (or pass openAs when forced to use a URL).
      book =
        typeof source === "string"
          ? ePub(source, { openAs: "epub" })
          : ePub(source);
      bookApiRef.current = book;
      await book.ready;
      if (!stillMine()) {
        abandonBook();
        return null;
      }

      try {
        const nav =
          book.navigation?.toc != null
            ? book.navigation
            : await book.loaded.navigation;
        if (stillMine()) {
          setTocItems(flattenToc(nav?.toc));
        }
      } catch {
        if (stillMine()) setTocItems([]);
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
        mount.getBoundingClientRect().height < 40 ||
        mount.getBoundingClientRect().width < 40
      ) {
        await new Promise<void>((resolve) => {
          window.setTimeout(() => resolve(), 120);
        });
        if (!stillMine()) {
          abandonBook();
          return null;
        }
        ({ width, height } = measure());
      }

      const rendition = book.renderTo(mount, {
        width,
        height,
        flow: "scrolled-doc",
        manager: "default",
        overflow: "scroll",
        spread: "none",
        minSpreadWidth: 100000,
        allowScriptedContent: true,
      });

      rendition.themes.default(CHAPTER_THEME);

      const expandTimers: number[] = [];
      rendition.on("rendered", () => {
        if (!stillMine()) return;
        scheduleExpand(mount, expandTimers);
      });

      try {
        rendition.hooks?.content?.register((contents) => {
          try {
            contents.overflow?.("visible");
          } catch {
            // ignore
          }
          const doc = contents.document;
          const imgs = Array.from(doc.images || []);
          for (const img of imgs) {
            if (img.complete) continue;
            img.addEventListener(
              "load",
              () => expandChapterToFullHeight(mount),
              { once: true }
            );
          }
        });
      } catch {
        // older vendor builds may omit hooks
      }

      // Do not display yet — caller shows the resume/start target once so the
      // page does not flash the beginning and then jump.
      return { rendition, expandTimers };
    }

    async function openEpub() {
      setLoading(true);
      setError("");
      setTocItems([]);
      try {
        const ePub = await loadVendorEpub();
        if (!stillMine()) return;

        let lastError: Error | null = null;
        let painted: {
          rendition: ReturnType<EpubBookApi["renderTo"]>;
          expandTimers: number[];
        } | null = null;

        for (let attempt = 0; attempt < 2 && !painted; attempt += 1) {
          try {
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
            if (buffer.byteLength < 1024) {
              throw new Error(
                "This EPUB’s file is missing on the shelf — re-upload it from the library admin."
              );
            }
            const head = new Uint8Array(buffer.slice(0, 64));
            const headText = String.fromCharCode(...Array.from(head));
            const isZip = head[0] === 0x50 && head[1] === 0x4b;
            if (!isZip || headText.includes("git-lfs")) {
              throw new Error(
                "This EPUB’s file is missing on the shelf — re-upload it from the library admin."
              );
            }

            painted = await paintBook(ePub, buffer);
            if (!painted) {
              throw new Error("Could not open this EPUB");
            }
          } catch (err) {
            lastError =
              err instanceof Error ? err : new Error("Could not open this EPUB");
            abandonBook();
            await new Promise<void>((resolve) => {
              window.setTimeout(() => resolve(), 120);
            });
          }
        }

        if (!stillMine()) return;
        if (!painted || !book || !host) {
          throw lastError || new Error("Could not open this EPUB");
        }

        const { rendition, expandTimers } = painted;
        const mount = host;

        // Single first paint: resume CFI if present, otherwise beginning.
        // Never display start then jump — that was the open-time flinch.
        const cfiToResume = resumeCfiRef.current;
        let openedAtTarget = false;
        if (cfiToResume) {
          try {
            await Promise.race([
              rendition.display(cfiToResume).then(() => {
                openedAtTarget = true;
              }),
              new Promise<void>((_, reject) => {
                window.setTimeout(
                  () => reject(new Error("resume timeout")),
                  4500
                );
              }),
            ]);
          } catch {
            openedAtTarget = false;
          }
        }
        if (!openedAtTarget) {
          await rendition.display();
        }
        if (!stillMine()) {
          abandonBook();
          mount.innerHTML = "";
          return;
        }

        if (!mount.querySelector("iframe")) {
          abandonBook();
          mount.innerHTML = "";
          throw lastError || new Error("Could not open this EPUB");
        }

        expandChapterToFullHeight(mount);

        // Ignore sub-chrome jitter (save hint, scrollbar gutter, overlays).
        const SIZE_EPS = 24;
        let lastSize = measure();
        let resizeTimer: number | null = null;
        const doResize = () => {
          const size = measure();
          if (
            Math.abs(size.width - lastSize.width) < SIZE_EPS &&
            Math.abs(size.height - lastSize.height) < SIZE_EPS
          ) {
            return;
          }
          lastSize = size;
          if (size.width > 0 && size.height > 0) {
            try {
              rendition.resize(size.width, size.height);
            } catch {
              // ignore
            }
          }
          expandChapterToFullHeight(mount);
        };
        const scheduleResize = () => {
          if (resizeTimer) window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(() => {
            resizeTimer = null;
            doResize();
          }, 160);
        };

        navRef.current = {
          next: () => {
            void rendition.next();
            window.setTimeout(() => expandChapterToFullHeight(mount), 80);
          },
          prev: () => {
            void rendition.prev();
            window.setTimeout(() => expandChapterToFullHeight(mount), 80);
          },
          display: (href?: string) => {
            void (href ? rendition.display(href) : rendition.display());
            window.setTimeout(() => expandChapterToFullHeight(mount), 80);
          },
          resize: doResize,
        };

        // Reveal only after the first real page is in place.
        await new Promise<void>((resolve) =>
          window.requestAnimationFrame(() => resolve())
        );
        if (!stillMine()) return;
        setLoading(false);

        // One settle pass after fonts/layout — not a multi-second resize storm.
        window.setTimeout(() => {
          if (!stillMine()) return;
          doResize();
        }, 280);

        observer = new ResizeObserver(() => scheduleResize());
        observer.observe(mount);

        let lastEmittedLabel = placeRef.current.label || "";
        rendition.on("relocated", (location: unknown) => {
          if (!host || host.dataset.reactToken !== token) return;
          // scrolled-doc fires relocated while scrolling. Rewriting iframe
          // height here was the continuous twitch — expand only on chapter
          // render / explicit nav (see rendered + navRef above).
          const place = placeFromLocation(location, bookApiRef.current);
          if (!place.reliable) {
            place.percent = placeRef.current.percent;
            if (!place.label || place.label === "Beginning") {
              place.label = placeRef.current.label || place.label;
            }
          }
          placeRef.current = place;
          if (place.label && place.label !== lastEmittedLabel) {
            lastEmittedLabel = place.label;
            setLocationLabel(place.label);
          }
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

        // Keep expandTimers alive for cleanup via observer teardown path.
        void expandTimers;
      } catch (err) {
        if (!stillMine()) return;
        setLoading(false);
        setError(
          err instanceof Error ? err.message : "Could not open this EPUB"
        );
      }
    }

    function claimAndOpen(attempt = 0) {
      const mount = viewerRef.current;
      if (!mount) {
        // Ref can lag one frame behind hydration — retry briefly.
        if (attempt < 40) {
          startTimer = window.setTimeout(() => claimAndOpen(attempt + 1), 50);
        } else {
          setLoading(false);
          setError("Could not open the reading pane — try refreshing.");
        }
        return;
      }
      host = mount;
      token = `react-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      host.dataset.reactToken = token;
      host.dataset.owned = "react";
      void openEpub();
    }

    claimAndOpen();

    return () => {
      cancelled = true;
      if (startTimer) window.clearTimeout(startTimer);
      tearDownTimer = window.setTimeout(() => {
        if (!host || host.dataset.reactToken !== token) {
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
            <p
              className="mh-reader-saved"
              aria-live="polite"
              data-empty={saveHint ? undefined : "1"}
            >
              {saveHint ? `✦ ${saveHint}` : "\u00a0"}
            </p>
          </div>
          <div className="mh-reader-header-actions">
            <span className="mh-reader-loc" aria-live="polite">
              {locationLabel || " "}
            </span>
            {kind === "epub" ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => (tocOpen ? closeToc() : openToc())}
                disabled={loading || Boolean(error)}
                aria-pressed={tocOpen}
              >
                Table of contents
              </button>
            ) : null}
            {kind === "epub" ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => void restartReading()}
                disabled={loading || Boolean(error) || restartBusy}
              >
                {restartBusy ? "Restarting…" : "Restart"}
              </button>
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
              ← Previous
            </button>
            <button
              type="button"
              className="btn-secondary"
              data-reader-nav="toc"
              onClick={() => (tocOpen ? closeToc() : openToc())}
              disabled={loading || Boolean(error)}
              aria-pressed={tocOpen}
            >
              Contents
            </button>
            <button
              type="button"
              className="btn-secondary"
              data-reader-nav="next"
              onClick={() => navRef.current?.next()}
              disabled={loading || Boolean(error)}
            >
              Next →
            </button>
            <span className="muted">
              Scroll to read · Contents jumps chapters · arrows change chapter
            </span>
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
                className={`mh-reader-epub${loading ? " is-opening" : ""}`}
                data-file-url={fileUrl}
                data-book-id={bookId}
                data-resume-cfi={resumeCfi || ""}
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

            {/* TOC overlay — open/close alone does not change reading place. */}
            {tocOpen ? (
              <div
                className="mh-toc-overlay"
                role="dialog"
                aria-label="Table of contents"
              >
                <aside className="mh-toc-panel">
                  <div className="mh-margin-header">
                    <div className="mh-margin-header-row">
                      <div>
                        <p className="mh-reader-kicker">Chapters</p>
                        <h3>Contents</h3>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary mh-attach-btn"
                        onClick={closeToc}
                      >
                        Close
                      </button>
                    </div>
                    <p className="muted">
                      Jump to a chapter — closing without a pick keeps your
                      place.
                    </p>
                  </div>
                  <ul className="mh-toc-list">
                    {tocItems.length === 0 ? (
                      <li className="mh-margin-empty">
                        This book has no table of contents.
                      </li>
                    ) : null}
                    {tocItems.map((item) => (
                      <li key={item.id} className="mh-toc-item">
                        <button
                          type="button"
                          className="mh-toc-link"
                          style={{
                            paddingLeft: `${0.65 + item.depth * 0.85}rem`,
                          }}
                          onClick={() => jumpToTocHref(item.href)}
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </aside>
                <button
                  type="button"
                  className="mh-margin-scrim"
                  aria-label="Close contents"
                  onClick={closeToc}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
