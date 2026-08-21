"use client";

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
  async function returnHome() {
    const res = await fetch("/api/village/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent: "returnHome" }),
    });
    if (res.ok) window.location.assign("/village");
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
          <button type="button" className="btn-primary" onClick={returnHome}>
            Return home to {homeVillageName}
          </button>
        </p>
      ) : null}
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
