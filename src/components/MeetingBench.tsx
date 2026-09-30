"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
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
  type SceneObject,
} from "@/lib/meetingBenchScene";

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
  onBoardChange?: (board: MeetingBenchBoard) => void;
};

export function MeetingBench({
  initialBoard,
  board: controlledBoard,
  villageId = null,
  canRsvp = true,
  isOwner,
  onEditItem,
  onAddKind,
  onBoardChange,
}: Props) {
  const [board, setBoard] = useState(controlledBoard || initialBoard);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [discoverySeen, setDiscoverySeen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [livePos, setLivePos] = useState<Record<string, { x: number; y: number }>>(
    {}
  );
  const objectsLayerRef = useRef<HTMLDivElement | null>(null);

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
  const allItems = useMemo(() => flattenBoardItems(board), [board]);
  const sceneObjects = useMemo(
    () => buildSceneObjects(allItems, theme.villageId),
    [allItems, theme.villageId]
  );
  const journal = useMemo(() => journalEntries(allItems), [allItems]);
  const discovery = useMemo(() => findDiscoveryItem(allItems), [allItems]);
  const openObject = sceneObjects.find((o) => o.id === openId) || null;
  const ambient = theme.ambient.slice(0, 4);

  function applyBoard(next: MeetingBenchBoard) {
    setBoard(next);
    onBoardChange?.(next);
  }

  function patchItemMeta(
    prev: MeetingBenchBoard,
    itemId: string,
    metaPatch: Record<string, unknown>
  ): MeetingBenchBoard {
    const patchList = (list: BenchItem[]) =>
      list.map((item) =>
        item.id === itemId
          ? { ...item, meta: { ...item.meta, ...metaPatch } }
          : item
      );
    return {
      ...prev,
      notices: patchList(prev.notices),
      gatherings: patchList(prev.gatherings),
      seasonal: patchList(prev.seasonal),
      chronicles: patchList(prev.chronicles),
      communityEvents: patchList(prev.communityEvents),
    };
  }

  async function saveBoardPosition(itemId: string, x: number, y: number) {
    setBusyId(itemId);
    try {
      const res = await fetch("/api/meeting-bench", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: itemId,
          action: "place",
          boardX: x,
          boardY: y,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save place");
      if (data.board) {
        applyBoard(data.board as MeetingBenchBoard);
      } else {
        applyBoard(
          patchItemMeta(board, itemId, { boardX: x, boardY: y })
        );
      }
      setLivePos((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    } catch {
      setLivePos((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    } finally {
      setBusyId(null);
    }
  }

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
      className={`meeting-bench mb-living mb-gathering-board village-${theme.villageId} season-${board.season}`}
    >
      <section className="mb-scene-stage" aria-label={theme.sceneLabel}>
        <div className="mb-board-frame">
          <div className="mb-board-rail mb-board-rail-top" aria-hidden />
          <div className="mb-board-rail mb-board-rail-left" aria-hidden />
          <div className="mb-board-rail mb-board-rail-right" aria-hidden />
          <div className="mb-board-rail mb-board-rail-bottom" aria-hidden />

          <div className="mb-play-blobs" aria-hidden>
            <span className="mb-play-blob b1" />
            <span className="mb-play-blob b2" />
            <span className="mb-play-blob b3" />
          </div>

          <div className="mb-board-ambient" aria-hidden>
            {ambient.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${src}-${i}`}
                src={src}
                alt=""
                className={`mb-ambient-sticker a${i + 1}`}
                draggable={false}
              />
            ))}
          </div>

          <header className="mb-scene-hero">
            <p className="mb-scene-kicker">{theme.kicker}</p>
            <h2 className="mb-scene-title">{theme.headline}</h2>
            <p className="mb-scene-sub">{theme.subtitle}</p>
            <p className="mb-scene-hint">
              {isOwner
                ? "Drag notes to arrange them — villagers can tap to read."
                : "Tap what the keeper pinned to the gathering board."}
            </p>
          </header>

          <div className="mb-scene-ground">
            <div className="mb-bench-figure mb-board-figure">
              <div className="mb-bench-photo-wrap mb-board-photo-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="mb-bench-photo mb-board-photo"
                  src="/meeting-bench/village-notice-board.png"
                  alt=""
                  width={1280}
                  height={720}
                />
              </div>
              <p className="mb-bench-caption">
                {theme.boardLabel}
              </p>
            </div>

            <div
              className={`mb-scene-objects ${isOwner ? "mb-objects-editable" : ""} ${
                dragId ? "is-dragging" : ""
              }`}
              role="list"
              ref={objectsLayerRef}
            >
              {sceneObjects
                .filter((o) => o.placement !== "under")
                .map((obj) => (
                  <BenchObjectButton
                    key={obj.id}
                    obj={obj}
                    livePos={livePos[obj.id] || null}
                    canDrag={Boolean(isOwner)}
                    dragging={dragId === obj.id}
                    layerRef={objectsLayerRef}
                    onOpen={() => setOpenId(obj.id)}
                    onDragStart={() => setDragId(obj.id)}
                    onDragMove={(pos) =>
                      setLivePos((prev) => ({ ...prev, [obj.id]: pos }))
                    }
                    onDragEnd={async (pos, moved) => {
                      setDragId(null);
                      if (!moved || !pos) return;
                      await saveBoardPosition(obj.id, pos.x, pos.y);
                    }}
                  />
                ))}
            </div>

            {discovery && !sceneObjects.some((o) => o.placement === "under") ? (
              <button
                type="button"
                className={`mb-discovery-nudge ${discoverySeen ? "seen" : ""}`}
                onClick={openDiscovery}
                aria-label="Something caught your eye behind the board"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/stickers/skeleton-key.png"
                  alt=""
                  className="mb-discovery-sticker"
                  draggable={false}
                />
                <span>Something caught your eye…</span>
              </button>
            ) : null}

            {sceneObjects
              .filter((o) => o.placement === "under")
              .map((obj) => (
                <BenchObjectButton
                  key={obj.id}
                  obj={obj}
                  livePos={null}
                  canDrag={false}
                  dragging={false}
                  layerRef={objectsLayerRef}
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
                  onDragStart={() => {}}
                  onDragMove={() => {}}
                  onDragEnd={() => {}}
                />
              ))}
          </div>
        </div>

        {isOwner ? (
          <div className="mb-scene-owner-row">
            <p>
              Keeper tools — drag notes on the board to place them, or pin
              something new:
            </p>
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

      <MeetingBenchQuestionJar items={allItems} villageId={theme.villageId} />

      <section className="mb-journal" aria-labelledby="mb-journal-title">
        <header className="mb-journal-head">
          <h2 id="mb-journal-title">Board Journal</h2>
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
          stickerSrc={openObject.src}
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
  livePos,
  canDrag,
  dragging,
  layerRef,
  onOpen,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  obj: SceneObject;
  livePos: { x: number; y: number } | null;
  canDrag: boolean;
  dragging: boolean;
  layerRef: RefObject<HTMLDivElement | null>;
  onOpen: () => void;
  onDragStart: () => void;
  onDragMove: (pos: { x: number; y: number }) => void;
  onDragEnd: (
    pos: { x: number; y: number } | null,
    moved: boolean
  ) => void | Promise<void>;
}) {
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    moved: boolean;
    pos: { x: number; y: number } | null;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const boardPos = livePos || obj.boardPos;
  const placed = Boolean(boardPos);

  function percentFromEvent(clientX: number, clientY: number) {
    const layer = layerRef.current;
    if (!layer) return null;
    const rect = layer.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return null;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.min(94, Math.max(6, x)),
      y: Math.min(90, Math.max(8, y)),
    };
  }

  return (
    <button
      type="button"
      role="listitem"
      className={`mb-object mb-place-${obj.placement} mb-obj-${obj.objectId} ${
        obj.featured ? "featured" : ""
      } ${placed ? "mb-object-placed" : ""} ${
        canDrag ? "mb-object-draggable" : ""
      } ${dragging ? "is-dragging" : ""}`}
      style={{
        ["--mb-pin-rot" as string]: `${obj.rotation}deg`,
        ...(boardPos
          ? {
              left: `${boardPos.x}%`,
              top: `${boardPos.y}%`,
              right: "auto",
              bottom: "auto",
              transform: `translate(-50%, -45%) rotate(var(--mb-pin-rot, 0deg))`,
            }
          : null),
      }}
      onClick={(e) => {
        if (dragRef.current?.moved) {
          e.preventDefault();
          return;
        }
        onOpen();
      }}
      onPointerDown={(e) => {
        if (!canDrag || e.button !== 0) return;
        const pos = percentFromEvent(e.clientX, e.clientY);
        dragRef.current = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          moved: false,
          pos: pos || boardPos,
        };
        onDragStart();
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const drag = dragRef.current;
        if (!canDrag || !drag || drag.pointerId !== e.pointerId) return;
        const dist = Math.hypot(
          e.clientX - drag.startX,
          e.clientY - drag.startY
        );
        if (dist > 6) drag.moved = true;
        if (!drag.moved) return;
        const pos = percentFromEvent(e.clientX, e.clientY);
        if (!pos) return;
        drag.pos = pos;
        onDragMove(pos);
      }}
      onPointerUp={(e) => {
        const drag = dragRef.current;
        if (!canDrag || !drag || drag.pointerId !== e.pointerId) return;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        const moved = drag.moved;
        const pos = drag.pos;
        dragRef.current = null;
        void onDragEnd(pos, moved);
      }}
      onPointerCancel={() => {
        const drag = dragRef.current;
        dragRef.current = null;
        void onDragEnd(drag?.pos || null, false);
      }}
      aria-label={
        canDrag
          ? `${obj.openVerb} — ${obj.label}. Drag to move.`
          : `${obj.openVerb} — ${obj.label}`
      }
      title={canDrag ? "Drag to move · click to open" : undefined}
    >
      <span className="mb-object-pin" aria-hidden />
      <span className="mb-object-sticker-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="mb-object-sticker"
          src={obj.src}
          alt=""
          draggable={false}
        />
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
