"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import type { ChronicleProgressView } from "@/lib/chronicle";
import type { VillageId } from "@/lib/villages";
import { ROMAN_PAGES, type ChroniclePageNumber } from "@/lib/chronicleContent";

type Props = {
  villageId: VillageId;
};

export function LostChronicles({ villageId }: Props) {
  const [progress, setProgress] = useState<ChronicleProgressView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState(false);
  const [opening, setOpening] = useState(false);
  /** Which leaf is face-up inside the open book (1–4). */
  const [leaf, setLeaf] = useState<ChroniclePageNumber>(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/chronicle/progress?villageId=${encodeURIComponent(villageId)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not open the Chronicle");
      setProgress(data.progress);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load");
    } finally {
      setLoading(false);
    }
  }, [villageId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function onUnlock() {
      void load();
    }
    window.addEventListener("whimpost:chronicle-unlock", onUnlock);
    return () =>
      window.removeEventListener("whimpost:chronicle-unlock", onUnlock);
  }, [load]);

  function openBook() {
    if (opening || opened) return;
    setOpening(true);
    window.setTimeout(() => {
      setOpened(true);
      setOpening(false);
      setLeaf(1);
    }, 700);
  }

  function closeBook() {
    setOpened(false);
    setOpening(false);
    setLeaf(1);
  }

  if (loading && !progress) {
    return (
      <section className="village-panel lc-book-panel">
        <h2>📜 The Lost Chronicles</h2>
        <p className="section-lead">The manuscript rests on the shelf…</p>
      </section>
    );
  }

  if (error || !progress) {
    return (
      <section className="village-panel lc-book-panel">
        <h2>📜 The Lost Chronicles</h2>
        <p className="section-lead">
          {error || "The Chronicle is silent for now."}
        </p>
      </section>
    );
  }

  const pct = Math.round((progress.recovered / progress.total) * 100);
  const meta = progress.meta;
  const current = progress.pages.find((p) => p.pageNumber === leaf)!;
  const themeStyle = {
    "--lc-cover": meta.cover,
    "--lc-cover-deep": meta.coverDeep,
    "--lc-spine": meta.spine,
    "--lc-foil": meta.foil,
    "--lc-accent": meta.accent,
  } as CSSProperties;

  return (
    <section className="village-panel lc-book-panel" style={themeStyle}>
      <h2>The Lost Chronicles</h2>
      <p className="section-lead">
        {meta.name} — open the bound manuscript to rediscover forgotten pages.
      </p>

      <div className="lc-progress-block">
        <div className="lc-progress-label">
          <span>
            Recovered: {progress.recovered} / {progress.total} Pages
          </span>
          {progress.complete ? (
            <span className="lc-restored-pill">Chronicle Restored</span>
          ) : null}
        </div>
        <div className="lc-progress-track" aria-hidden>
          <div className="lc-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div
        className={[
          "lc-tome",
          `lc-tome-${villageId}`,
          opened ? "is-open" : "",
          opening ? "is-opening" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {!opened ? (
          <div className="lc-closed-stage">
            <button
              type="button"
              className="lc-cover"
              onClick={openBook}
              aria-label={`Open ${meta.name}`}
            >
              <span className="lc-cover-boards" aria-hidden>
                <span className="lc-cover-ridge" />
                <span className="lc-cover-ridge mid" />
                <span className="lc-cover-ridge low" />
              </span>
              <span className="lc-cover-edge" aria-hidden />
              <span className="lc-cover-frame" aria-hidden />
              <span className="lc-cover-corner tl" aria-hidden />
              <span className="lc-cover-corner tr" aria-hidden />
              <span className="lc-cover-corner bl" aria-hidden />
              <span className="lc-cover-corner br" aria-hidden />
              <span className="lc-cover-emblem" aria-hidden>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={meta.mascotImage}
                  alt=""
                  className="lc-cover-mascot"
                  draggable={false}
                />
              </span>
              <span className="lc-cover-title">{meta.name}</span>
              <span className="lc-cover-motif">{meta.motif}</span>
              <span className="lc-cover-hint">
                {opening ? "Opening…" : "Click to open"}
              </span>
              <span className="lc-cover-seal" aria-hidden>
                ✦
              </span>
            </button>
            <span className="lc-page-block" aria-hidden />
            <span className="lc-page-block-bottom" aria-hidden />
          </div>
        ) : (
          <div className="lc-open-book" role="region" aria-label={meta.name}>
            <div className="lc-open-back" aria-hidden />
            <div className="lc-open-spine" aria-hidden />
            <div className="lc-open-left" aria-hidden>
              <div className="lc-stack-edge" />
              <p className="lc-open-side-label">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={meta.mascotImage}
                  alt=""
                  className="lc-spine-mascot"
                  draggable={false}
                />
                <span>{ROMAN_PAGES[leaf]}</span>
              </p>
            </div>
            <article
              key={leaf}
              className={
                current.unlocked
                  ? "lc-leaf unlocked"
                  : "lc-leaf locked"
              }
            >
              <header className="lc-leaf-head">
                <span>Page {current.roman}</span>
                <span>
                  {leaf} / 4
                </span>
              </header>

              {current.unlocked ? (
                <>
                  {current.illustrationUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={current.illustrationUrl}
                      alt=""
                      className="lc-page-illustration"
                    />
                  ) : null}
                  <h3 className="lc-page-title">{current.title}</h3>
                  <p className="lc-page-body">
                    <span className="lc-dropcap">
                      {current.body.trim().charAt(0)}
                    </span>
                    {current.body.trim().slice(1)}
                  </p>
                </>
              ) : (
                <div className="lc-leaf-mystery">
                  <span className="lc-mystery-mark" aria-hidden>
                    ❓
                  </span>
                  <h3 className="lc-page-title">Unknown</h3>
                  <p>
                    This leaf is faded, torn, and waiting. Keep tending your
                    village — the ink will return.
                  </p>
                  <div className="lc-mystery-lines" aria-hidden>
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}

              <footer className="lc-leaf-nav">
                <button
                  type="button"
                  className="lc-leaf-btn"
                  disabled={leaf <= 1}
                  onClick={() =>
                    setLeaf((n) => Math.max(1, n - 1) as ChroniclePageNumber)
                  }
                >
                  ← Prev
                </button>
                <div className="lc-leaf-dots" aria-hidden>
                  {([1, 2, 3, 4] as ChroniclePageNumber[]).map((n) => {
                    const page = progress.pages.find((p) => p.pageNumber === n)!;
                    return (
                      <button
                        key={n}
                        type="button"
                        className={[
                          "lc-dot",
                          leaf === n ? "active" : "",
                          page.unlocked ? "found" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        aria-label={`Go to page ${ROMAN_PAGES[n]}`}
                        onClick={() => setLeaf(n)}
                      />
                    );
                  })}
                </div>
                <button
                  type="button"
                  className="lc-leaf-btn"
                  disabled={leaf >= 4}
                  onClick={() =>
                    setLeaf((n) => Math.min(4, n + 1) as ChroniclePageNumber)
                  }
                >
                  Next →
                </button>
              </footer>
            </article>
          </div>
        )}
      </div>

      {opened ? (
        <p className="lc-close-row">
          <button type="button" className="lc-close-book" onClick={closeBook}>
            Close the book
          </button>
        </p>
      ) : null}

      {progress.complete ? (
        <div className="lc-keeper-banner">
          <span className="lc-seal-mini" aria-hidden>
            ✦
          </span>
          <div>
            <strong>Chronicle Restored</strong>
            <p>You are a {progress.keeperTitle}.</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
