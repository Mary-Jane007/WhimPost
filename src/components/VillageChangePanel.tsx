"use client";

import { useState } from "react";
import { VillageJoinPicker } from "@/components/VillageJoinPicker";
import type { VillageId } from "@/lib/villages";

export function VillageChangePanel({
  currentVillageId,
  homeVillageId,
  currentVillageName,
  homeVillageName,
  isAway,
}: {
  currentVillageId: VillageId;
  homeVillageId: VillageId;
  currentVillageName: string;
  homeVillageName: string;
  isAway: boolean;
}) {
  const [returning, setReturning] = useState(false);
  const [returnError, setReturnError] = useState("");

  async function returnHome() {
    setReturning(true);
    setReturnError("");
    try {
      const res = await fetch("/api/village/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "returnHome" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReturnError(data.error || "Could not return home");
        return;
      }
      window.location.assign("/village");
    } catch {
      setReturnError("Travel hitch — try again in a moment");
    } finally {
      setReturning(false);
    }
  }

  return (
    <section className="village-panel village-change-panel">
      <h2>Visit &amp; belonging</h2>
      <p className="section-lead">
        Your <strong>home</strong> is {homeVillageName}
        {isAway
          ? ` — you're visiting ${currentVillageName} right now.`
          : ". You can wander to other villages anytime without losing it."}
      </p>
      {isAway ? (
        <p className="village-return-row">
          <button
            type="button"
            className="btn-primary"
            disabled={returning}
            onClick={() => void returnHome()}
          >
            {returning
              ? "Returning…"
              : `Return home to ${homeVillageName}`}
          </button>
        </p>
      ) : null}
      {returnError ? <p className="form-error">{returnError}</p> : null}
      <details className="village-change-details">
        <summary className="btn-secondary village-change-summary">
          Browse other villages
        </summary>
        <VillageJoinPicker
          mode="change"
          currentVillageId={currentVillageId}
          homeVillageId={homeVillageId}
        />
      </details>
    </section>
  );
}
