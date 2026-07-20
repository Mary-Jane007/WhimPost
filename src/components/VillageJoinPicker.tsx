"use client";

import { useState } from "react";
import { VILLAGES, type VillageId } from "@/lib/villages";

export function VillageJoinPicker() {
  const [villageId, setVillageId] = useState<VillageId | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function join() {
    if (!villageId) {
      setError("Pick a village first");
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
    <div className="village-join">
      <h1>Choose your village</h1>
      <p className="lede">
        Every WhimPost soul belongs somewhere. Pick the place that feels like home.
      </p>
      <div className="village-picker-grid">
        {VILLAGES.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`village-card ${villageId === v.id ? "selected" : ""}`}
            style={
              {
                "--village-color": v.color,
                "--village-soft": v.colorSoft,
              } as React.CSSProperties
            }
            onClick={() => setVillageId(v.id)}
          >
            <span className="village-mascot">{v.mascot}</span>
            <strong>{v.name}</strong>
            <em>{v.motto}</em>
          </button>
        ))}
      </div>
      {error && <p className="form-error">{error}</p>}
      <button
        type="button"
        className="btn-primary"
        disabled={!villageId || loading}
        onClick={join}
      >
        {loading ? "Arriving…" : "Enter the village"}
      </button>
    </div>
  );
}
