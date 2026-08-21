"use client";

import { useState } from "react";
import { DiscoverBelonging } from "@/components/DiscoverBelonging";
import type { BelongingResult } from "@/lib/belongingQuiz";
import type { VillageId } from "@/lib/villages";

export function BelongingRetakePanel({
  homeVillageName,
}: {
  homeVillageName: string;
}) {
  const [open, setOpen] = useState(false);
  const [quizKey, setQuizKey] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onComplete(villageId: VillageId, _result: BelongingResult) {
    setSaving(true);
    setError("");
    const res = await fetch("/api/village/home", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ villageId }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not update your home village");
      return;
    }
    window.location.assign("/village");
  }

  return (
    <section className="village-panel belonging-retake-panel">
      <h2>Discover your belonging again</h2>
      <p className="section-lead">
        Your home is {homeVillageName}. Retake the quiz anytime — the result
        becomes your new home village.
      </p>
      {!open ? (
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setOpen(true);
            setQuizKey((k) => k + 1);
          }}
        >
          Retake the belonging quiz
        </button>
      ) : (
        <div className="belonging-retake-wrap">
          {saving ? <p className="muted">Settling into your new home…</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          <DiscoverBelonging
            key={quizKey}
            displayName="wanderer"
            onComplete={onComplete}
          />
          <button
            type="button"
            className="nav-ghost"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      )}
    </section>
  );
}
