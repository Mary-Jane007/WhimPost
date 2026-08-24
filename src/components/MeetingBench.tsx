"use client";

import { useEffect, useMemo, useState } from "react";
import type { BenchItem, BenchItemKind } from "@/lib/meetingBench";
import type { VillageId } from "@/lib/villages";
import { MeetingBenchReveal, entryTypeLabel } from "@/components/MeetingBenchReveal";
import { MeetingBenchQuestionJar } from "@/components/MeetingBenchQuestionJar";
import {
  buildSceneObjects,
  findDiscoveryItem,
  flattenBoardItems,
  getBenchTheme,
  journalEntries,
  SEASON_AMBIENT,
  type SceneObject,
} from "@/lib/meetingBenchScene";
import type { GardenSeason } from "@/lib/gardenContent";

export type MeetingBenchBoard = {
  season: string;
  seasonLabel: string;
  notices: BenchItem[];
  gatherings: BenchItem[];
  seasonal: BenchItem[];
  chronicles: BenchItem[];
  communityEvents: BenchItem[];
};

type Props = {
  initialBoard: MeetingBenchBoard;
  board?: MeetingBenchBoard;
  villageId?: VillageId | null;
  canRsvp?: boolean;
  isOwner?: boolean;
  onEditItem?: (id: string) => void;
  onAddKind?: (kind: BenchItemKind) => void;
};

export function MeetingBench({
  initialBoard,
  board: controlledBoard,
  villageId = null,
  canRsvp = true,
  isOwner,
  onEditItem,
  onAddKind,
}: Props) {
  const [board, setBoard] = useState(controlledBoard || initialBoard);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [discoverySeen, setDiscoverySeen] = useState(false);

  useEffect(() => {
    if (controlledBoard) setBoard(controlledBoard);
  }, [controlledBoard]);

  useEffect(() => {
    try {
      setDiscoverySeen(
        localStorage.getItem("whimpost.meeting-bench.discovery-seen") === "1"
      );
    } catch {
      /* ignore */
    }
  }, []);

  const theme = getBenchTheme(villageId);
  const season = board.season as GardenSeason;
  const allItems = useMemo(() => flattenBoardItems(board), [board]);
  const sceneObjects = useMemo(
    () => buildSceneObjects(allItems, theme.villageId),
    [allItems, theme.villageId]
  );
  const journal = useMemo(() => journalEntries(allItems), [allItems]);
  const discovery = useMemo(() => findDiscoveryItem(allItems), [allItems]);
  const openObject = sceneObjects.find((o) => o.id === openId) || null;
  const ambient = [
    ...theme.ambient.slice(0, 2),
    ...(SEASON_AMBIENT[season] || []).slice(0, 2),
  ];

  async function rsvp(itemId: string) {
    if (!canRsvp) return;
    setBusyId(itemId);
    try {
      const res = await fetch("/api/meeting-bench/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not RSVP");
      setBoard((prev) => ({
        ...prev,
        gatherings: patchRsvp(prev.gatherings, itemId, data),
        communityEvents: patchRsvp(prev.communityEvents, itemId, data),
      }));
    } catch {
      /* keep quiet; status shown in reveal if needed */
    } finally {
      setBusyId(null);
    }
  }

  function openDiscovery() {
    if (!discovery) return;
    try {
      localStorage.setItem("whimpost.meeting-bench.discovery-seen", "1");
    } catch {
      /* ignore */
    }
    setDiscoverySeen(true);
    setOpenId(discovery.id);
  }

  return (
    <div
      className={`meeting-bench mb-living village-${theme.villageId} season-${board.season}`}
    >
      <section
        className="mb-scene-stage"
        aria-label={theme.sceneLabel}
      >
        <div className="mb-scene-sky" aria-hidden>
          {ambient.map((g, i) => (
            <span key={`${g}-${i}`} className={`mb-float f${i + 1}`}>
              {g}
            </span>
          ))}
        </div>

        <header className="mb-scene-hero">
          <p className="mb-scene-kicker">{theme.kicker}</p>
          <h2 className="mb-scene-title">{theme.headline}</h2>
          <p className="mb-scene-sub">{theme.subtitle}</p>
          <p className="mb-scene-hint">
            Come sit for a little while. Tap what the keeper left on the bench.
          </p>
        </header>

        <div className="mb-scene-ground">
          <div className="mb-scene-objects" role="list">
            {sceneObjects
              .filter((o) => o.placement !== "under")
              .map((obj) => (
                <BenchObjectButton
                  key={obj.id}
                  obj={obj}
                  onOpen={() => setOpenId(obj.id)}
                />
              ))}
          </div>

          <div className="mb-bench-figure" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="mb-bench-photo"
              src="/meeting-bench/bench-nature.png"
              alt=""
              width={1280}
              height={720}
            />
            <p className="mb-bench-caption">{theme.benchLabel}</p>
          </div>

          {discovery && !sceneObjects.some((o) => o.placement === "under") ? (
            <button
              type="button"
              className={`mb-discovery-nudge ${discoverySeen ? "seen" : ""}`}
              onClick={openDiscovery}
              aria-label="Something caught your eye under the bench"
            >
              <span aria-hidden>✨</span>
              <span>Something caught your eye…</span>
            </button>
          ) : null}

          {sceneObjects
            .filter((o) => o.placement === "under")
            .map((obj) => (
              <BenchObjectButton
                key={obj.id}
                obj={obj}
                onOpen={() => {
                  try {
                    localStorage.setItem(
                      "whimpost.meeting-bench.discovery-seen",
                      "1"
                    );
                  } catch {
                    /* ignore */
                  }
                  setDiscoverySeen(true);
                  setOpenId(obj.id);
                }}
              />
            ))}
        </div>

        {isOwner ? (
          <div className="mb-scene-owner-row">
            <p>Keeper tools — leave something new on the bench:</p>
            <div className="mb-scene-owner-actions">
              {(
                [
                  ["notice", "Note"],
                  ["gathering", "Event"],
                  ["seasonal", "Activity"],
                  ["chronicle", "Chronicle"],
                  ["community_event", "Community"],
                ] as Array<[BenchItemKind, string]>
              ).map(([kind, label]) => (
                <button
                  key={kind}
                  type="button"
                  className="btn-secondary"
                  onClick={() => onAddKind?.(kind)}
                >
                  + {label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <MeetingBenchQuestionJar items={allItems} />

      <section className="mb-journal" aria-labelledby="mb-journal-title">
        <header className="mb-journal-head">
          <h2 id="mb-journal-title">Bench Journal</h2>
          <p>A little village record of what has been left here.</p>
        </header>
        {journal.length === 0 ? (
          <p className="mb-journal-empty">
            The journal is blank — the keeper hasn&apos;t left anything yet.
          </p>
        ) : (
          <ol className="mb-journal-list">
            {journal.map((entry, index) => (
              <li
                key={entry.item.id}
                className={`mb-journal-item age-${Math.min(entry.ageDays, 14)} ${
                  index === 0 ? "newest" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenId(entry.item.id)}
                >
                  <span className="mb-journal-when">{entry.whenLabel}</span>
                  <span className="mb-journal-type">
                    {entryTypeLabel(entry.entryType)}
                  </span>
                  <strong>{entry.item.title}</strong>
                </button>
                {isOwner && onEditItem ? (
                  <button
                    type="button"
                    className="nav-ghost mb-journal-edit"
                    onClick={() => onEditItem(entry.item.id)}
                  >
                    Edit
                  </button>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      {openObject ? (
        <MeetingBenchReveal
          item={
            allItems.find((i) => i.id === openObject.id) || openObject.item
          }
          objectId={openObject.objectId}
          entryType={openObject.entryType}
          onClose={() => setOpenId(null)}
          onRsvp={canRsvp ? rsvp : undefined}
          rsvpBusy={busyId === openObject.id}
          isOwner={isOwner}
          onEdit={onEditItem}
        />
      ) : null}
      {!openObject && openId
        ? (() => {
            const item = allItems.find((i) => i.id === openId);
            if (!item) return null;
            const journalHit = journal.find((j) => j.item.id === openId);
            return (
              <MeetingBenchReveal
                item={item}
                objectId="paper"
                entryType={journalHit?.entryType || "announcement"}
                onClose={() => setOpenId(null)}
                onRsvp={canRsvp ? rsvp : undefined}
                rsvpBusy={busyId === openId}
                isOwner={isOwner}
                onEdit={onEditItem}
              />
            );
          })()
        : null}
    </div>
  );
}

function BenchObjectButton({
  obj,
  onOpen,
}: {
  obj: SceneObject;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      role="listitem"
      className={`mb-object mb-place-${obj.placement} mb-obj-${obj.objectId} ${
        obj.featured ? "featured" : ""
      }`}
      onClick={onOpen}
      aria-label={`${obj.openVerb} — ${obj.label}`}
    >
      <span className="mb-object-emoji" aria-hidden>
        {obj.emoji}
      </span>
      <span className="mb-object-label">{obj.item.title}</span>
    </button>
  );
}

function patchRsvp(
  list: BenchItem[],
  itemId: string,
  data: { joined?: boolean; rsvpCount?: number }
) {
  return list.map((item) =>
    item.id === itemId
      ? {
          ...item,
          userJoined: Boolean(data.joined),
          rsvpCount:
            typeof data.rsvpCount === "number"
              ? data.rsvpCount
              : item.rsvpCount,
        }
      : item
  );
}
