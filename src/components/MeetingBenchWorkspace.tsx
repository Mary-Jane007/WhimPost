"use client";

import { useState } from "react";
import type { BenchItemKind } from "@/lib/meetingBench";
import type { VillageId } from "@/lib/villages";
import {
  MeetingBench,
  type MeetingBenchBoard,
} from "@/components/MeetingBench";
import { MeetingBenchAdmin } from "@/components/MeetingBenchAdmin";

export function MeetingBenchWorkspace({
  initialBoard,
  isOwner,
  villageId = null,
}: {
  initialBoard: MeetingBenchBoard;
  isOwner: boolean;
  villageId?: VillageId | null;
}) {
  const [board, setBoard] = useState(initialBoard);
  const [focusItemId, setFocusItemId] = useState<string | null>(null);
  const [focusKind, setFocusKind] = useState<BenchItemKind | null>(null);
  const [editorKey, setEditorKey] = useState(0);

  function editItem(id: string) {
    setFocusKind(null);
    setFocusItemId(id);
    setEditorKey((k) => k + 1);
    window.requestAnimationFrame(() => {
      document.getElementById("mb-owner-desk")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function addKind(kind: BenchItemKind) {
    setFocusItemId(null);
    setFocusKind(kind);
    setEditorKey((k) => k + 1);
    window.requestAnimationFrame(() => {
      document.getElementById("mb-owner-desk")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  return (
    <>
      <MeetingBench
        initialBoard={initialBoard}
        board={board}
        villageId={villageId}
        canRsvp
        isOwner={isOwner}
        onEditItem={isOwner ? editItem : undefined}
        onAddKind={isOwner ? addKind : undefined}
      />

      {isOwner ? (
        <MeetingBenchAdmin
          key={editorKey}
          initialOpen={Boolean(focusItemId || focusKind)}
          focusItemId={focusItemId}
          focusKind={focusKind}
          onBoardChange={setBoard}
        />
      ) : null}
    </>
  );
}
