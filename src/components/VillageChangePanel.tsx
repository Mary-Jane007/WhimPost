"use client";

import { useState } from "react";
import { VillageJoinPicker } from "@/components/VillageJoinPicker";
import type { VillageId } from "@/lib/villages";

export function VillageChangePanel({
  currentVillageId,
  currentVillageName,
}: {
  currentVillageId: VillageId;
  currentVillageName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="village-panel village-change-panel">
      <h2>Change village</h2>
      <p className="section-lead">
        Feeling called elsewhere? You can leave {currentVillageName} and settle in
        another woodland home.
      </p>
      {!open ? (
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setOpen(true)}
        >
          Browse other villages
        </button>
      ) : (
        <>
          <button
            type="button"
            className="btn-ghost village-change-cancel"
            onClick={() => setOpen(false)}
          >
            Keep living in {currentVillageName}
          </button>
          <VillageJoinPicker
            mode="change"
            currentVillageId={currentVillageId}
          />
        </>
      )}
    </section>
  );
}
