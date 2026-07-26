"use client";

import { useState } from "react";
import { VILLAGES, type VillageId } from "@/lib/villages";
import { VillageMascot } from "@/components/VillageMascot";

export function VillageJoinPicker({
  currentVillageId = null,
  mode = "join",
}: {
  currentVillageId?: VillageId | null;
  mode?: "join" | "change";
}) {
  const [villageId, setVillageId] = useState<VillageId | "">(
    currentVillageId || ""
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const changing = mode === "change";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Progressive enhancement: without JS the form POSTs and redirects.
    if (typeof window === "undefined") return;
    e.preventDefault();
    if (!villageId) {
      setError("Pick a village first");
      return;
    }
    if (changing && villageId === currentVillageId) {
      setError("You're already settled here");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/village/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ villageId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not join village");
      return;
    }
    window.location.assign("/village");
  }

  return (
    <form
      className={`village-join ${changing ? "village-join-change" : ""}`}
      action="/api/village/join"
      method="post"
      onSubmit={onSubmit}
    >
      {!changing ? (
        <>
          <h1>Choose your village</h1>
          <p className="lede">
            Every WhimPost soul belongs somewhere. Pick the place that feels like
            home.
          </p>
        </>
      ) : (
        <p className="lede village-change-lead">
          Your belongings travel with you. Reputation stays yours; the new
          village will greet you in its own way.
        </p>
      )}
      <div className="village-picker-grid">
        {VILLAGES.map((v) => {
          const isCurrent = currentVillageId === v.id;
          return (
            <label
              key={v.id}
              className={`village-card ${villageId === v.id ? "selected" : ""} ${
                isCurrent ? "current" : ""
              }`}
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
                onChange={() => setVillageId(v.id)}
                className="village-card-radio"
              />
              <VillageMascot village={v} size="md" />
              <strong>{v.name}</strong>
              <em>{v.motto}</em>
              {isCurrent ? (
                <span className="village-current-tag">Home</span>
              ) : null}
            </label>
          );
        })}
      </div>
      {error && <p className="form-error">{error}</p>}
      <button
        type="submit"
        className="btn-primary"
        disabled={
          !villageId ||
          loading ||
          (changing && villageId === currentVillageId)
        }
      >
        {loading
          ? changing
            ? "Moving…"
            : "Arriving…"
          : changing
            ? "Move to this village"
            : "Enter the village"}
      </button>
    </form>
  );
}
