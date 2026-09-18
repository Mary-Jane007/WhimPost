"use client";

import { useState } from "react";
import { VILLAGES, type VillageId } from "@/lib/villages";
import { VillageMascot } from "@/components/VillageMascot";

function defaultPick(
  mode: "join" | "change",
  currentVillageId: VillageId | null | undefined
): VillageId | "" {
  if (mode !== "change") return currentVillageId || "";
  // Change mode: don't pre-select the village you're already in — that left
  // "Visit this village" permanently disabled and looking stuck.
  const elsewhere = VILLAGES.find((v) => v.id !== currentVillageId);
  return elsewhere?.id || "";
}

export function VillageJoinPicker({
  currentVillageId = null,
  homeVillageId = null,
  mode = "join",
}: {
  currentVillageId?: VillageId | null;
  homeVillageId?: VillageId | null;
  mode?: "join" | "change";
}) {
  const resolvedHome = homeVillageId || currentVillageId;
  const [villageId, setVillageId] = useState<VillageId | "">(() =>
    defaultPick(mode, currentVillageId)
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"visit" | "makeHome" | null>(null);
  const changing = mode === "change";
  const alreadyHere = Boolean(villageId && villageId === currentVillageId);
  const alreadyHome = Boolean(villageId && villageId === resolvedHome);

  async function submit(intent: "visit" | "makeHome") {
    if (!villageId) {
      setError("Pick a village first");
      return;
    }
    if (intent === "visit" && villageId === currentVillageId) {
      setError("You're already visiting here — pick another village");
      return;
    }
    if (intent === "makeHome" && villageId === resolvedHome) {
      setError("That's already your home village");
      return;
    }
    setLoading(intent);
    setError("");
    try {
      const res = await fetch("/api/village/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ villageId, intent }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not update village");
        return;
      }
      window.location.assign("/village");
    } catch {
      setError("Travel hitch — try again in a moment");
    } finally {
      setLoading(null);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (typeof window === "undefined") return;
    e.preventDefault();
    await submit(changing ? "visit" : "makeHome");
  }

  return (
    <form
      className={`village-join ${changing ? "village-join-change" : ""}`}
      action="/api/village/join"
      method="post"
      onSubmit={onSubmit}
    >
      <input type="hidden" name="intent" value={changing ? "visit" : "makeHome"} />
      {!changing ? (
        <>
          <h1>Choose your home village</h1>
          <p className="lede">
            Every WhimPost soul belongs somewhere. Pick the place that feels like
            home — you can still visit the others later.
          </p>
        </>
      ) : (
        <p className="lede village-change-lead">
          Pick a village below, then visit for a while or remake it your
          permanent home. Your quiz belonging stays clear either way.
        </p>
      )}
      <div className="village-picker-grid">
        {VILLAGES.map((v) => {
          const isHere = currentVillageId === v.id;
          const isHome = resolvedHome === v.id;
          return (
            <label
              key={v.id}
              className={`village-card ${villageId === v.id ? "selected" : ""} ${
                isHome ? "is-home" : ""
              } ${isHere && !isHome ? "is-visiting" : ""}`}
              style={
                {
                  "--village-color": v.color,
                  "--village-soft": v.colorSoft,
                } as React.CSSProperties
              }
            >
              <input
                type="radio"
                name="villageId"
                value={v.id}
                checked={villageId === v.id}
                onChange={() => {
                  setVillageId(v.id);
                  setError("");
                }}
                className="village-card-radio"
              />
              <VillageMascot village={v} size="md" />
              <strong>{v.name}</strong>
              <em>{v.motto}</em>
              {isHome ? (
                <span className="village-current-tag village-home-tag">
                  Home
                </span>
              ) : isHere ? (
                <span className="village-current-tag village-visiting-tag">
                  Visiting
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
      {error && <p className="form-error">{error}</p>}
      {!changing ? (
        <button
          type="submit"
          className="btn-primary"
          disabled={!villageId || loading !== null}
        >
          {loading ? "Arriving…" : "Enter my home village"}
        </button>
      ) : (
        <div className="village-join-actions">
          <button
            type="button"
            className="btn-primary"
            disabled={!villageId || loading !== null || alreadyHere}
            onClick={() => void submit("visit")}
          >
            {loading === "visit"
              ? "Traveling…"
              : alreadyHere
                ? "Already here"
                : "Visit this village"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={!villageId || loading !== null || alreadyHome}
            onClick={() => void submit("makeHome")}
          >
            {loading === "makeHome"
              ? "Settling…"
              : alreadyHome
                ? "Already home"
                : "Make this my home"}
          </button>
        </div>
      )}
    </form>
  );
}
