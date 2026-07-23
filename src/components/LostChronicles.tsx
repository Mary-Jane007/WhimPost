"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChronicleProgressView } from "@/lib/chronicle";
import type { VillageId } from "@/lib/villages";
import { ROMAN_PAGES } from "@/lib/chronicleContent";

type Props = {
  villageId: VillageId;
};

export function LostChronicles({ villageId }: Props) {
  const [progress, setProgress] = useState<ChronicleProgressView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openPage, setOpenPage] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading && !progress) {
    return (
      <section className="village-panel lc-book-panel">
        <h2>📜 The Lost Chronicles</h2>
        <p className="section-lead">Opening the leather-bound book…</p>
      </section>
    );
  }

  if (error || !progress) {
    return (
      <section className="village-panel lc-book-panel">
        <h2>📜 The Lost Chronicles</h2>
        <p className="section-lead">{error || "The Chronicle is silent for now."}</p>
      </section>
    );
  }

  const pct = Math.round((progress.recovered / progress.total) * 100);
  const viewing = progress.pages.find((p) => p.pageNumber === openPage);

  return (
    <section className="village-panel lc-book-panel">
      <h2>
        {progress.meta.emoji} The Lost Chronicles
      </h2>
      <p className="section-lead">
        {progress.meta.name} — forgotten pages return through gentle deeds.
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

      <div className="lc-book">
        <div className="lc-book-spine" aria-hidden />
        <div className="lc-book-pages">
          {progress.pages.map((page) => (
            <button
              key={page.pageNumber}
              type="button"
              className={
                page.unlocked ? "lc-slot unlocked" : "lc-slot locked"
              }
              onClick={() => {
                if (page.unlocked) setOpenPage(page.pageNumber);
              }}
              disabled={!page.unlocked}
            >
              <span className="lc-slot-roman">Page {page.roman}</span>
              <span className="lc-slot-title">
                {page.unlocked ? page.title : `❓ ${page.lockedLabel}`}
              </span>
              {!page.unlocked ? (
                <span className="lc-slot-hint">Faded · torn · waiting</span>
              ) : (
                <span className="lc-slot-hint">Open parchment</span>
              )}
            </button>
          ))}
        </div>
      </div>

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

      {viewing ? (
        <div className="lc-reader-overlay" role="dialog" aria-modal="true">
          <div className="lc-reader">
            <button
              type="button"
              className="lc-reader-close"
              onClick={() => setOpenPage(null)}
            >
              Close
            </button>
            <article className="lc-parchment">
              <p className="lc-discover-eyebrow">
                Page {ROMAN_PAGES[viewing.pageNumber]}
              </p>
              {viewing.illustrationUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={viewing.illustrationUrl}
                  alt=""
                  className="lc-page-illustration"
                />
              ) : null}
              <h3 className="lc-page-title">{viewing.title}</h3>
              <p className="lc-page-body">
                <span className="lc-dropcap">
                  {viewing.body.trim().charAt(0)}
                </span>
                {viewing.body.trim().slice(1)}
              </p>
            </article>
          </div>
        </div>
      ) : null}
    </section>
  );
}
