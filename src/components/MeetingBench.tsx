"use client";

import { useState } from "react";
import Link from "next/link";
import type { BenchItem, BenchItemKind } from "@/lib/meetingBench";
import { VILLAGES, type VillageId } from "@/lib/villages";

export type MeetingBenchBoard = {
  season: string;
  seasonLabel: string;
  notices: BenchItem[];
  gatherings: BenchItem[];
  seasonal: BenchItem[];
  chronicles: BenchItem[];
  communityEvents: BenchItem[];
};

function villageNames(villages: VillageId[] | "all") {
  if (villages === "all") return "All villages";
  return villages
    .map((id) => VILLAGES.find((v) => v.id === id)?.name || id)
    .join(" · ");
}

function formatWhen(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

function statusLabel(status: string) {
  if (status === "active") return "Happening now";
  if (status === "upcoming") return "Coming up";
  if (status === "finished") return "Finished";
  if (status === "published") return "Pinned";
  return status;
}

function SeasonDecor({ season }: { season: string }) {
  const glyphs =
    season === "spring"
      ? ["🌿", "🌸", "💧", "🐦"]
      : season === "summer"
        ? ["☀️", "🌊", "🍑", "🌅"]
        : season === "autumn"
          ? ["🍂", "🍄", "🌧️", "📖"]
          : ["❄️", "🕯️", "🧣", "⭐"];
  return (
    <div className="mb-season-decor" aria-hidden>
      {glyphs.map((g) => (
        <span key={g}>{g}</span>
      ))}
    </div>
  );
}

function OwnerBar({
  isOwner,
  onEdit,
  onAdd,
  kind,
}: {
  isOwner?: boolean;
  onEdit?: (id: string) => void;
  onAdd?: (kind: BenchItemKind) => void;
  kind?: BenchItemKind;
  itemId?: string;
}) {
  if (!isOwner) return null;
  return (
    <div className="mb-owner-bar">
      {onAdd && kind ? (
        <button type="button" className="nav-ghost" onClick={() => onAdd(kind)}>
          + Add
        </button>
      ) : null}
    </div>
  );
}

function EditBtn({
  isOwner,
  itemId,
  onEdit,
}: {
  isOwner?: boolean;
  itemId: string;
  onEdit?: (id: string) => void;
}) {
  if (!isOwner || !onEdit) return null;
  return (
    <button
      type="button"
      className="mb-edit-btn"
      onClick={() => onEdit(itemId)}
    >
      Edit
    </button>
  );
}

function NoticeSlip({
  item,
  isOwner,
  onEdit,
}: {
  item: BenchItem;
  isOwner?: boolean;
  onEdit?: (id: string) => void;
}) {
  return (
    <article className={`mb-slip ${item.pinned ? "is-pinned" : ""}`}>
      {item.pinned ? <span className="mb-pin" aria-hidden /> : null}
      <EditBtn isOwner={isOwner} itemId={item.id} onEdit={onEdit} />
      <h3>{item.title}</h3>
      <p>{item.body}</p>
      <div className="mb-slip-meta">
        <span>{villageNames(item.villages)}</span>
        {item.ctaHref ? (
          <Link href={item.ctaHref} className="btn-secondary">
            {item.ctaLabel || "Take a look"}
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function GatheringCard({
  item,
  onRsvp,
  busy,
  isOwner,
  onEdit,
}: {
  item: BenchItem;
  onRsvp: (id: string) => void;
  busy: boolean;
  isOwner?: boolean;
  onEdit?: (id: string) => void;
}) {
  const when = formatWhen(item.startsAt);
  return (
    <article className={`mb-gathering status-${item.status}`}>
      <EditBtn isOwner={isOwner} itemId={item.id} onEdit={onEdit} />
      <div className="mb-gathering-top">
        <span className="mb-status">{statusLabel(item.status)}</span>
        {item.activityType ? (
          <span className="mb-type">{item.activityType}</span>
        ) : null}
      </div>
      <h3>{item.title}</h3>
      {when ? <p className="mb-when">{when}</p> : null}
      <p>{item.body}</p>
      <p className="mb-villages">{villageNames(item.villages)}</p>
      <div className="mb-gathering-actions">
        <button
          type="button"
          className={item.userJoined ? "btn-primary" : "btn-secondary"}
          disabled={busy || item.status === "finished"}
          onClick={() => onRsvp(item.id)}
        >
          {item.userJoined
            ? "You're going"
            : item.ctaLabel || "I'll be there"}
        </button>
        <em>
          {item.rsvpCount || 0} villager
          {(item.rsvpCount || 0) === 1 ? "" : "s"} saving a seat
        </em>
        {item.ctaHref ? (
          <Link href={item.ctaHref} className="nav-ghost">
            Details
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function ChronicleStory({
  item,
  isOwner,
  onEdit,
}: {
  item: BenchItem;
  isOwner?: boolean;
  onEdit?: (id: string) => void;
}) {
  return (
    <article className="mb-chronicle-story">
      <EditBtn isOwner={isOwner} itemId={item.id} onEdit={onEdit} />
      <h3>{item.title}</h3>
      <p>
        <em>{item.body}</em>
      </p>
      <span className="mb-villages">{villageNames(item.villages)}</span>
    </article>
  );
}

function CommunityEvent({
  item,
  onRsvp,
  busy,
  isOwner,
  onEdit,
}: {
  item: BenchItem;
  onRsvp: (id: string) => void;
  busy: boolean;
  isOwner?: boolean;
  onEdit?: (id: string) => void;
}) {
  const tasks =
    item.meta &&
    typeof item.meta.villageTasks === "object" &&
    item.meta.villageTasks
      ? (item.meta.villageTasks as Record<string, string>)
      : {};

  return (
    <article className="mb-community">
      <EditBtn isOwner={isOwner} itemId={item.id} onEdit={onEdit} />
      <div className="mb-gathering-top">
        <span className="mb-status">{statusLabel(item.status)}</span>
        {item.season ? <span className="mb-type">{item.season}</span> : null}
      </div>
      <h3>{item.title}</h3>
      <p>{item.body}</p>
      {Object.keys(tasks).length > 0 ? (
        <ul className="mb-village-tasks">
          {VILLAGES.map((v) => {
            const task = tasks[v.id];
            if (!task) return null;
            return (
              <li key={v.id}>
                <strong>
                  {v.mascot} {v.name}
                </strong>
                <span>{task}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
      <div className="mb-gathering-actions">
        <button
          type="button"
          className={item.userJoined ? "btn-primary" : "btn-secondary"}
          disabled={busy || item.status === "finished"}
          onClick={() => onRsvp(item.id)}
        >
          {item.userJoined
            ? "Joined the gathering"
            : item.ctaLabel || "Join in"}
        </button>
        <em>{item.rsvpCount || 0} across the villages</em>
      </div>
    </article>
  );
}

function SectionHead({
  title,
  lead,
  kind,
  isOwner,
  onAdd,
}: {
  title: string;
  lead: string;
  kind: BenchItemKind;
  isOwner?: boolean;
  onAdd?: (kind: BenchItemKind) => void;
}) {
  return (
    <header className="mb-section-head">
      <div>
        <h2>{title}</h2>
        <p>{lead}</p>
      </div>
      <OwnerBar isOwner={isOwner} onAdd={onAdd} kind={kind} />
    </header>
  );
}

export function MeetingBench({
  initialBoard,
  board: controlledBoard,
  canRsvp = true,
  isOwner = false,
  onEditItem,
  onAddKind,
}: {
  initialBoard: MeetingBenchBoard;
  board?: MeetingBenchBoard;
  canRsvp?: boolean;
  isOwner?: boolean;
  onEditItem?: (id: string) => void;
  onAddKind?: (kind: BenchItemKind) => void;
}) {
  const baseBoard = controlledBoard ?? initialBoard;
  const [rsvpPatches, setRsvpPatches] = useState<
    Record<string, Pick<BenchItem, "rsvpCount" | "userJoined">>
  >({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const board = {
    ...baseBoard,
    gatherings: baseBoard.gatherings.map((g) =>
      rsvpPatches[g.id] ? { ...g, ...rsvpPatches[g.id] } : g
    ),
    communityEvents: baseBoard.communityEvents.map((g) =>
      rsvpPatches[g.id] ? { ...g, ...rsvpPatches[g.id] } : g
    ),
  };

  async function rsvp(itemId: string) {
    if (!canRsvp) return;
    setBusyId(itemId);
    setError("");
    try {
      const res = await fetch("/api/meeting-bench/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not join");
      const updated = data.item as BenchItem;
      setRsvpPatches((prev) => ({
        ...prev,
        [updated.id]: {
          rsvpCount: updated.rsvpCount,
          userJoined: updated.userJoined,
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className={`meeting-bench season-${board.season}`}>
      <section className="mb-scene" aria-label="The wooden bench">
        <div className="mb-board-frame">
          <div className="mb-board-header">
            <span>Community notice board · every village</span>
            <SeasonDecor season={board.season} />
          </div>
          <p className="mb-scene-lead">
            It is <strong>{board.seasonLabel}</strong> across WhimPost. This
            board is shared by every village — papers shift with the wind;
            someone has left a calendar under a stone.
          </p>
        </div>
        <div className="mb-bench-illustration" aria-hidden>
          <div className="mb-bench-wood">
            <span className="mb-bench-slat" />
            <span className="mb-bench-slat" />
            <span className="mb-bench-slat" />
          </div>
          <div className="mb-bench-legs" />
          <div className="mb-under-bench">
            <em>a tucked-away letter</em>
          </div>
        </div>
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      <section id="notices" className="mb-section mb-notices">
        <SectionHead
          title="📌 Village Notices"
          lead="Important whispers from the living world of WhimPost."
          kind="notice"
          isOwner={isOwner}
          onAdd={onAddKind}
        />
        {board.notices.length === 0 ? (
          <p className="muted">The board is clear for now. Check back soon.</p>
        ) : (
          <div className="mb-slip-grid">
            {board.notices.map((item) => (
              <NoticeSlip
                key={item.id}
                item={item}
                isOwner={isOwner}
                onEdit={onEditItem}
              />
            ))}
          </div>
        )}
      </section>

      <section id="gatherings" className="mb-section">
        <SectionHead
          title="🗓️ Gatherings"
          lead="Upcoming activities where villages meet in the middle."
          kind="gathering"
          isOwner={isOwner}
          onAdd={onAddKind}
        />
        {board.gatherings.length === 0 ? (
          <p className="muted">No gatherings pencilled in yet.</p>
        ) : (
          <div className="mb-gathering-grid">
            {board.gatherings.map((item) => (
              <GatheringCard
                key={item.id}
                item={item}
                busy={busyId === item.id}
                onRsvp={rsvp}
                isOwner={isOwner}
                onEdit={onEditItem}
              />
            ))}
          </div>
        )}
      </section>

      <section id="seasonal" className="mb-section mb-seasonal">
        <SectionHead
          title="🌱 Seasonal Activities"
          lead={`Celebrating the feel of ${board.seasonLabel.toLowerCase()} — weather, plants, light, and quiet outdoor (or fireside) traditions.`}
          kind="seasonal"
          isOwner={isOwner}
          onAdd={onAddKind}
        />
        {board.seasonal.length === 0 ? (
          <p className="muted">The season is still finding its activities.</p>
        ) : (
          <div className="mb-slip-grid">
            {board.seasonal.map((item) => (
              <article key={item.id} className="mb-slip mb-season-card">
                <EditBtn
                  isOwner={isOwner}
                  itemId={item.id}
                  onEdit={onEditItem}
                />
                <span className="mb-type">{item.season || board.season}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                {item.ctaHref ? (
                  <Link href={item.ctaHref} className="btn-secondary">
                    {item.ctaLabel || "Join the season"}
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="chronicle" className="mb-section mb-chronicle">
        <SectionHead
          title="📰 The WhimPost Chronicle"
          lead="A tiny village newspaper of discoveries and soft mysteries."
          kind="chronicle"
          isOwner={isOwner}
          onAdd={onAddKind}
        />
        <div className="mb-chronicle-paper">
          <p className="mb-chronicle-masthead">THE WHIMPOST CHRONICLE</p>
          {board.chronicles.length === 0 ? (
            <p className="muted">The press is quiet today.</p>
          ) : (
            board.chronicles.map((item) => (
              <ChronicleStory
                key={item.id}
                item={item}
                isOwner={isOwner}
                onEdit={onEditItem}
              />
            ))
          )}
        </div>
      </section>

      <section id="community" className="mb-section">
        <SectionHead
          title="🌍 Community-Wide Events"
          lead="Occasional gatherings that give every village its own piece of a shared story."
          kind="community_event"
          isOwner={isOwner}
          onAdd={onAddKind}
        />
        {board.communityEvents.length === 0 ? (
          <p className="muted">No community-wide event is stirring yet.</p>
        ) : (
          <div className="mb-community-list">
            {board.communityEvents.map((item) => (
              <CommunityEvent
                key={item.id}
                item={item}
                busy={busyId === item.id}
                onRsvp={rsvp}
                isOwner={isOwner}
                onEdit={onEditItem}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
