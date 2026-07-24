"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  title: string;
  author?: string;
  fileUrl: string;
  fileName?: string | null;
  onClose: () => void;
};

type BookKind = "pdf" | "epub" | "unknown";

function kindFromUrl(url: string, fileName?: string | null): BookKind {
  const s = `${fileName || ""} ${url}`.toLowerCase();
  if (/\.pdf(\?|#|$)/.test(s) || s.includes("application/pdf")) return "pdf";
  if (/\.epub(\?|#|$)/.test(s) || s.includes("epub")) return "epub";
  return "unknown";
}

export function LibraryBookReader({
  title,
  author,
  fileUrl,
  fileName,
  onClose,
}: Props) {
  const kind = kindFromUrl(fileUrl, fileName);
  const viewerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<{ next: () => void; prev: () => void } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(kind === "epub");
  const [locationLabel, setLocationLabel] = useState("");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (kind !== "epub") return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        navRef.current?.next();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        navRef.current?.prev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [kind, onClose]);

  useEffect(() => {
    if (kind !== "epub") return;
    const mount = viewerRef.current;
    if (!mount) return;
    const host: HTMLDivElement = mount;

    let cancelled = false;
    // epubjs Book instance
    let book: { destroy: () => void } | null = null;

    async function openEpub() {
      setLoading(true);
      setError("");
      try {
        const mod = await import("epubjs");
        const ePub = (
          "default" in mod && typeof mod.default === "function"
            ? mod.default
            : (mod as unknown as (data: ArrayBuffer) => unknown)
        ) as (data: ArrayBuffer) => {
          destroy: () => void;
          renderTo: (
            el: HTMLElement,
            opts: Record<string, unknown>
          ) => {
            display: () => Promise<unknown>;
            next: () => void;
            prev: () => void;
            themes: { default: (rules: Record<string, unknown>) => void };
            on: (event: string, cb: (loc: unknown) => void) => void;
          };
        };
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
        const rendition = book.renderTo(host, {
          width: "100%",
          height: "100%",
          flow: "paginated",
          spread: "none",
          allowScriptedContent: true,
        });

        rendition.themes.default({
          body: {
            color: "#2c2418 !important",
            background: "#f6edd9 !important",
            "font-family": "Georgia, 'Times New Roman', serif !important",
            "line-height": "1.65 !important",
            padding: "0.5rem !important",
          },
          a: { color: "#5c3a1e !important" },
          img: { "max-width": "100% !important" },
        });

        await rendition.display();
        if (cancelled) {
          book.destroy();
          return;
        }

        navRef.current = {
          next: () => void rendition.next(),
          prev: () => void rendition.prev(),
        };

        rendition.on("relocated", (location: unknown) => {
          const loc = location as {
            start?: { displayed?: { page?: number; total?: number } };
          };
          const page = loc?.start?.displayed?.page;
          const total = loc?.start?.displayed?.total;
          if (page && total) {
            setLocationLabel(`Page ${page} of ${total}`);
          }
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
      try {
        book?.destroy();
      } catch {
        // ignore
      }
      host.innerHTML = "";
    };
  }, [fileUrl, kind]);

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
          </div>
          <div className="mh-reader-header-actions">
            {locationLabel ? (
              <span className="mh-reader-loc">{locationLabel}</span>
            ) : null}
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
            <span className="muted">Arrow keys turn pages</span>
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

        <div className="mh-reader-stage">
          {loading ? (
            <p className="mh-reader-status">Opening the book…</p>
          ) : null}
          {error ? <p className="form-error mh-reader-status">{error}</p> : null}

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
        </div>
      </div>
    </div>
  );
}
