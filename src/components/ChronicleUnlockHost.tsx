"use client";

import { useEffect, useState } from "react";
import type { ChronicleUnlockPayload } from "@/lib/chronicle";
import type { ChroniclePageContent } from "@/lib/chronicleContent";
import { ROMAN_PAGES } from "@/lib/chronicleContent";

export function ChronicleUnlockHost() {
  const [payload, setPayload] = useState<ChronicleUnlockPayload | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [phase, setPhase] = useState<"intro" | "page" | "complete">("intro");

  useEffect(() => {
    function onUnlock(e: Event) {
      const detail = (e as CustomEvent<ChronicleUnlockPayload>).detail;
      if (!detail) return;
      setPayload(detail);
      setPageIndex(0);
      setPhase(detail.newlyUnlocked?.length ? "intro" : "complete");
    }
    window.addEventListener("whimpost:chronicle-unlock", onUnlock);
    return () =>
      window.removeEventListener("whimpost:chronicle-unlock", onUnlock);
  }, []);

  if (!payload) return null;

  const page: ChroniclePageContent | undefined = payload.pages[pageIndex];

  function close() {
    setPayload(null);
  }

  function advance() {
    if (!payload) return;
    if (phase === "intro") {
      setPhase("page");
      return;
    }
    if (phase === "page" && pageIndex < payload.pages.length - 1) {
      setPageIndex((i) => i + 1);
      return;
    }
    if (payload.justCompleted || payload.complete) {
      setPhase("complete");
      return;
    }
    close();
  }

  return (
    <div className="lc-discover-overlay" role="dialog" aria-modal="true">
      <div className="lc-discover-particles" aria-hidden>
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="lc-discover-card">
        {phase === "intro" ? (
          <>
            <p className="lc-discover-eyebrow">The Lost Chronicles</p>
            <h2>A forgotten page has been recovered…</h2>
            <p className="lc-discover-lead">
              Ink gathers on ancient parchment. A piece of your village&apos;s
              story returns.
            </p>
            <button type="button" className="lc-btn" onClick={advance}>
              Unfold the page
            </button>
          </>
        ) : null}

        {phase === "page" && page ? (
          <>
            <p className="lc-discover-eyebrow">
              Page {ROMAN_PAGES[page.pageNumber]}
            </p>
            <article className="lc-parchment lc-parchment-reveal">
              {page.illustrationUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={page.illustrationUrl}
                  alt=""
                  className="lc-page-illustration"
                />
              ) : null}
              <h3 className="lc-page-title">{page.title}</h3>
              <p className="lc-page-body">
                <span className="lc-dropcap">{page.body.trim().charAt(0)}</span>
                {page.body.trim().slice(1)}
              </p>
            </article>
            <button type="button" className="lc-btn" onClick={advance}>
              {pageIndex < payload.pages.length - 1
                ? "Next recovered page"
                : payload.justCompleted
                  ? "Continue"
                  : "Add to Chronicle"}
            </button>
          </>
        ) : null}

        {phase === "complete" ? (
          <>
            <div className="lc-seal" aria-hidden>
              ✦
            </div>
            <h2>Chronicle Restored</h2>
            <p className="lc-discover-lead">
              All four pages have returned. You are now a{" "}
              <strong>{payload.keeperTitle}</strong>.
            </p>
            <p className="lc-meta">
              Recovered {payload.recovered} / {payload.total} pages
            </p>
            <button type="button" className="lc-btn" onClick={close}>
              Close the book
            </button>
          </>
        ) : null}

        {phase !== "complete" ? (
          <button type="button" className="lc-dismiss" onClick={close}>
            Later
          </button>
        ) : null}
      </div>
    </div>
  );
}
