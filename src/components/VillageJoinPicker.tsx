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

  async function join() {
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
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not join village");
      return;
    }
    window.location.assign("/village");
  }

  return (
    <div className={`village-join ${changing ? "village-join-change" : ""}`}>
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
            <button
              key={v.id}
              type="button"
              className={`village-card ${villageId === v.id ? "selected" : ""} ${
                isCurrent ? "current" : ""
              }`}
              style={
                {
                  "--village-color": v.color,
                  "--village-soft": v.colorSoft,
                } as React.CSSProperties
              }
              onClick={() => setVillageId(v.id)}
            >
              <VillageMascot village={v} size="md" />
              <strong>{v.name}</strong>
              <em>{v.motto}</em>
              {isCurrent ? <span className="village-current-tag">Home</span> : null}
            </button>
          );
        })}
      </div>
      {error && <p className="form-error">{error}</p>}
      <button
        type="button"
        className="btn-primary"
        disabled={
          !villageId ||
          loading ||
          (changing && villageId === currentVillageId)
        }
        onClick={join}
      >
        {loading
          ? changing
            ? "Moving…"
            : "Arriving…"
          : changing
            ? "Move to this village"
            : "Enter the village"}
      </button>
    </div>
  );
}
