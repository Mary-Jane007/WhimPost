"use client";

import { VillageJoinPicker } from "@/components/VillageJoinPicker";
import type { VillageId } from "@/lib/villages";

export function VillageChangePanel({
  currentVillageId,
  currentVillageName,
}: {
  currentVillageId: VillageId;
  currentVillageName: string;
}) {
  return (
    <section className="village-panel village-change-panel">
      <h2>Change village</h2>
      <p className="section-lead">
        Feeling called elsewhere? You can leave {currentVillageName} and settle in
        another woodland home.
      </p>
      <details className="village-change-details">
        <summary className="btn-secondary village-change-summary">
          Browse other villages
        </summary>
        <VillageJoinPicker mode="change" currentVillageId={currentVillageId} />
      </details>
    </section>
  );
}
