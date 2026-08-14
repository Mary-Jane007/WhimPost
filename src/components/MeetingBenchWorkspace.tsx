"use client";

import { useState } from "react";
import type { BenchItemKind } from "@/lib/meetingBench";
import {
  MeetingBench,
  type MeetingBenchBoard,
} from "@/components/MeetingBench";
import { MeetingBenchAdmin } from "@/components/MeetingBenchAdmin";

export function MeetingBenchWorkspace({
  initialBoard,
  isOwner,
}: {
  initialBoard: MeetingBenchBoard;
  isOwner: boolean;
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
      {isOwner ? (
        <MeetingBenchAdmin
          key={editorKey}
          initialOpen
          focusItemId={focusItemId}
          focusKind={focusKind}
          onBoardChange={setBoard}
        />
      ) : null}

      <MeetingBench
        initialBoard={initialBoard}
        board={board}
        canRsvp
        isOwner={isOwner}
        onEditItem={isOwner ? editItem : undefined}
        onAddKind={isOwner ? addKind : undefined}
      />
    </>
  );
}
