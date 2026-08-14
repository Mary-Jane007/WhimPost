"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  BenchItem,
  BenchItemKind,
  BenchItemStatus,
} from "@/lib/meetingBench";
import type { GardenSeason } from "@/lib/gardenContent";
import { VILLAGES, type VillageId } from "@/lib/villages";
import type { MeetingBenchBoard } from "@/components/MeetingBench";

const KINDS: Array<{ id: BenchItemKind; label: string; emoji: string }> = [
  { id: "notice", label: "Village Notice", emoji: "📌" },
  { id: "gathering", label: "Gathering", emoji: "🗓️" },
  { id: "seasonal", label: "Seasonal Activity", emoji: "🌱" },
  { id: "chronicle", label: "Chronicle Story", emoji: "📰" },
  { id: "community_event", label: "Community Event", emoji: "🌍" },
];

const STATUSES: BenchItemStatus[] = [
  "draft",
  "upcoming",
  "active",
  "published",
  "finished",
  "archived",
];

type VillageTasks = Record<VillageId, string>;

type FormState = {
  kind: BenchItemKind;
  title: string;
  body: string;
  status: BenchItemStatus;
  season: GardenSeason | "";
  startsAt: string;
  endsAt: string;
  activityType: string;
  villages: VillageId[] | "all";
  ctaLabel: string;
  ctaHref: string;
  pinned: boolean;
  sortOrder: number;
  villageTasks: VillageTasks;
};

function emptyVillageTasks(): VillageTasks {
  return {
    mosshollow: "",
    clovermeadow: "",
    moonmere: "",
    bramblewood: "",
    hearthwick: "",
  };
}

function defaultStatusFor(kind: BenchItemKind): BenchItemStatus {
  if (kind === "gathering") return "upcoming";
  if (kind === "seasonal" || kind === "community_event") return "active";
  return "published";
}

function emptyForm(kind: BenchItemKind = "notice"): FormState {
  return {
    kind,
    title: "",
    body: "",
    status: defaultStatusFor(kind),
    season: "",
    startsAt: "",
    endsAt: "",
    activityType: "",
    villages: "all",
    ctaLabel: "",
    ctaHref: "",
    pinned: false,
    sortOrder: 50,
    villageTasks: emptyVillageTasks(),
  };
}

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function parseVillageTasks(meta: Record<string, unknown> | undefined): VillageTasks {
  const base = emptyVillageTasks();
  const raw = meta?.villageTasks;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  for (const v of VILLAGES) {
    const val = (raw as Record<string, unknown>)[v.id];
    if (typeof val === "string") base[v.id] = val;
  }
  return base;
}

function buildMetaFromTasks(
  kind: BenchItemKind,
  tasks: VillageTasks,
  existingMeta?: Record<string, unknown>
) {
  const meta: Record<string, unknown> = { ...(existingMeta || {}) };
  if (kind === "community_event") {
    const villageTasks: Record<string, string> = {};
    for (const v of VILLAGES) {
      const text = tasks[v.id].trim();
      if (text) villageTasks[v.id] = text;
    }
    if (Object.keys(villageTasks).length) meta.villageTasks = villageTasks;
    else delete meta.villageTasks;
  } else {
    delete meta.villageTasks;
  }
  return meta;
}

const QUICK_LINKS = [
  { label: "Village", href: "/village" },
  { label: "TV Corner", href: "/tv-corner" },
  { label: "Garden", href: "/garden" },
  { label: "Library", href: "/library" },
  { label: "Workshop", href: "/workshop" },
  { label: "Fireside", href: "/fireside" },
  { label: "Observatory", href: "/observatory" },
  { label: "Meeting Bench", href: "/meeting-bench" },
];

export function MeetingBenchAdmin({
  initialOpen = true,
  focusItemId = null,
  focusKind = null,
  onBoardChange,
}: {
  initialOpen?: boolean;
  focusItemId?: string | null;
  focusKind?: BenchItemKind | null;
  onBoardChange?: (board: MeetingBenchBoard) => void;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [items, setItems] = useState<BenchItem[]>([]);
  const [filter, setFilter] = useState<"all" | BenchItemKind>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [existingMeta, setExistingMeta] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => i.kind === filter);
  }, [items, filter]);

  async function load(selectId?: string | null) {
    setLoading(true);
    setError("");
    const res = await fetch("/api/meeting-bench?admin=1");
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not load Meeting Bench");
      return;
    }
    const list = (data.items || []) as BenchItem[];
    setItems(list);
    if (data.board && onBoardChange) onBoardChange(data.board);
    if (selectId) {
      const found = list.find((i) => i.id === selectId);
      if (found) startEdit(found);
    }
  }

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      void load(focusItemId);
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || !focusItemId) return;
    const found = items.find((i) => i.id === focusItemId);
    if (found) startEdit(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusItemId]);

  useEffect(() => {
    if (!open || !focusKind || editingId) return;
    startCreate(focusKind);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKind]);

  function startCreate(kind: BenchItemKind = "notice") {
    setEditingId(null);
    setExistingMeta({});
    setForm(emptyForm(kind));
    setFilter(kind);
    setStatus("");
    setError("");
    setOpen(true);
  }

  function startEdit(item: BenchItem) {
    setEditingId(item.id);
    setExistingMeta(item.meta || {});
    setForm({
      kind: item.kind,
      title: item.title,
      body: item.body,
      status: item.status,
      season: item.season || "",
      startsAt: toLocalInput(item.startsAt),
      endsAt: toLocalInput(item.endsAt),
      activityType: item.activityType || "",
      villages: item.villages,
      ctaLabel: item.ctaLabel || "",
      ctaHref: item.ctaHref || "",
      pinned: item.pinned,
      sortOrder: item.sortOrder,
      villageTasks: parseVillageTasks(item.meta),
    });
    setFilter(item.kind);
    setStatus("");
    setError("");
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const meta = buildMetaFromTasks(form.kind, form.villageTasks, existingMeta);
      const payload = {
        kind: form.kind,
        title: form.title,
        body: form.body,
        status: form.status,
        season: form.season || null,
        startsAt: fromLocalInput(form.startsAt),
        endsAt: fromLocalInput(form.endsAt),
        activityType: form.activityType || null,
        villages: form.villages,
        ctaLabel: form.ctaLabel || null,
        ctaHref: form.ctaHref || null,
        pinned: form.pinned,
        sortOrder: form.sortOrder,
        meta,
      };
      const res = await fetch("/api/meeting-bench", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId ? { id: editingId, ...payload } : payload
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      if (data.board && onBoardChange) onBoardChange(data.board);
      setStatus(editingId ? "Saved — the board is updated." : "Added to the board.");
      const newId = (data.item as BenchItem | undefined)?.id || editingId;
      await load(newId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Take this paper off the board for good?")) return;
    setError("");
    const res = await fetch(`/api/meeting-bench?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not delete");
      return;
    }
    if (data.board && onBoardChange) onBoardChange(data.board);
    if (editingId === id) startCreate(form.kind);
    setStatus("Removed from the board.");
    await load();
  }

  async function duplicate(id: string) {
    setError("");
    const res = await fetch("/api/meeting-bench", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "duplicate", id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not duplicate");
      return;
    }
    if (data.board && onBoardChange) onBoardChange(data.board);
    setStatus("Copied onto the board — edit the new paper.");
    const copy = data.item as BenchItem | undefined;
    await load(copy?.id || null);
  }

  async function quickPatch(
    id: string,
    patch: Record<string, unknown>,
    okMessage: string
  ) {
    setError("");
    const res = await fetch("/api/meeting-bench", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not update");
      return;
    }
    if (data.board && onBoardChange) onBoardChange(data.board);
    setStatus(okMessage);
    await load(editingId === id ? id : null);
  }

  function toggleVillage(id: VillageId) {
    setForm((prev) => {
      if (prev.villages === "all") {
        return { ...prev, villages: [id] };
      }
      const has = prev.villages.includes(id);
      const next = has
        ? prev.villages.filter((v) => v !== id)
        : [...prev.villages, id];
      return { ...prev, villages: next.length ? next : "all" };
    });
  }

  function nudgeSort(delta: number) {
    setForm((f) => ({
      ...f,
      sortOrder: Math.max(0, (Number(f.sortOrder) || 0) + delta),
    }));
  }

  if (!open) {
    return (
      <div className="mb-admin-launch">
        <button
          type="button"
          className="btn-primary"
          onClick={() => setOpen(true)}
        >
          Edit Meeting Bench
        </button>
        <p className="muted mb-admin-launch-hint">
          Add notices, gatherings, seasonal activities, Chronicle stories, and
          community events — only you can edit this board.
        </p>
      </div>
    );
  }

  return (
    <section className="mb-admin" id="mb-owner-desk">
      <div className="mb-admin-head">
        <div>
          <h3>Edit Meeting Bench</h3>
          <p className="muted">
            Add and rewrite anything on the board. Villagers only see published /
            active / upcoming papers — drafts stay private to you.
          </p>
        </div>
        <button type="button" className="nav-ghost" onClick={() => setOpen(false)}>
          Hide editor
        </button>
      </div>

      <div className="mb-quick-add" role="group" aria-label="Add new">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            className="btn-secondary"
            onClick={() => startCreate(k.id)}
          >
            {k.emoji} Add {k.label}
          </button>
        ))}
      </div>

      <div className="mb-admin-layout">
        <aside className="mb-admin-list">
          <div className="mb-admin-filters" role="tablist" aria-label="Filter">
            <button
              type="button"
              className={filter === "all" ? "active" : ""}
              onClick={() => setFilter("all")}
            >
              All ({items.length})
            </button>
            {KINDS.map((k) => {
              const count = items.filter((i) => i.kind === k.id).length;
              return (
                <button
                  key={k.id}
                  type="button"
                  className={filter === k.id ? "active" : ""}
                  onClick={() => setFilter(k.id)}
                >
                  {k.emoji} {count}
                </button>
              );
            })}
          </div>

          {loading ? <p className="muted">Loading…</p> : null}

          <ul>
            {filtered.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={editingId === item.id ? "active" : ""}
                  onClick={() => startEdit(item)}
                >
                  <strong>{item.title}</strong>
                  <span>
                    {item.kind} · {item.status}
                    {item.pinned ? " · pinned" : ""}
                    {item.season ? ` · ${item.season}` : ""}
                  </span>
                </button>
                <div className="mb-admin-item-actions">
                  <button
                    type="button"
                    className="nav-ghost"
                    title="Duplicate"
                    onClick={() => void duplicate(item.id)}
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    className="nav-ghost"
                    title={item.pinned ? "Unpin" : "Pin"}
                    onClick={() =>
                      void quickPatch(
                        item.id,
                        { pinned: !item.pinned },
                        item.pinned ? "Unpinned." : "Pinned."
                      )
                    }
                  >
                    {item.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    type="button"
                    className="nav-ghost"
                    onClick={() => void remove(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
            {!loading && filtered.length === 0 ? (
              <li className="muted">Nothing in this section yet.</li>
            ) : null}
          </ul>
        </aside>

        <form className="mb-admin-form" onSubmit={save}>
          <div className="mb-admin-form-title">
            <h4>{editingId ? "Edit paper" : "New paper"}</h4>
            {editingId ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => startCreate(form.kind)}
              >
                Start blank instead
              </button>
            ) : null}
          </div>

          <label>
            Kind
            <select
              value={form.kind}
              onChange={(e) => {
                const kind = e.target.value as BenchItemKind;
                setForm((f) => ({
                  ...f,
                  kind,
                  status: editingId ? f.status : defaultStatusFor(kind),
                }));
              }}
            >
              {KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.emoji} {k.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Title
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              maxLength={120}
              required
              placeholder="A Curious Parcel Has Arrived…"
            />
          </label>

          <label>
            Body
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={7}
              maxLength={4000}
              required
              placeholder="Write in-universe — make the world feel alive."
            />
          </label>

          <div className="mb-admin-row">
            <label>
              Status
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as BenchItemStatus,
                  }))
                }
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Season
              <select
                value={form.season}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    season: e.target.value as GardenSeason | "",
                  }))
                }
              >
                <option value="">None / any</option>
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="autumn">Autumn</option>
                <option value="winter">Winter</option>
              </select>
            </label>
            <label>
              Activity type
              <input
                value={form.activityType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, activityType: e.target.value }))
                }
                placeholder="nature, movie, lore, cozy…"
                list="mb-activity-types"
              />
              <datalist id="mb-activity-types">
                <option value="nature" />
                <option value="movie" />
                <option value="stargazing" />
                <option value="crafting" />
                <option value="recipe" />
                <option value="lore" />
                <option value="feature" />
                <option value="community" />
                <option value="cozy" />
                <option value="outdoors" />
              </datalist>
            </label>
          </div>

          <div className="mb-admin-row">
            <label>
              Starts
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startsAt: e.target.value }))
                }
              />
            </label>
            <label>
              Ends
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endsAt: e.target.value }))
                }
              />
            </label>
            <label>
              Sort order
              <div className="mb-sort-row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => nudgeSort(-5)}
                >
                  ↑
                </button>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sortOrder: Number(e.target.value) || 0,
                    }))
                  }
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => nudgeSort(5)}
                >
                  ↓
                </button>
              </div>
            </label>
          </div>

          <fieldset className="mb-admin-villages">
            <legend>Villages</legend>
            <label className="mb-admin-check">
              <input
                type="checkbox"
                checked={form.villages === "all"}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    villages: e.target.checked ? "all" : [],
                  }))
                }
              />
              All villages
            </label>
            {VILLAGES.map((v) => (
              <label key={v.id} className="mb-admin-check">
                <input
                  type="checkbox"
                  checked={
                    form.villages === "all" || form.villages.includes(v.id)
                  }
                  disabled={form.villages === "all"}
                  onChange={() => toggleVillage(v.id)}
                />
                {v.mascot} {v.name}
              </label>
            ))}
          </fieldset>

          <div className="mb-admin-row mb-admin-row-2">
            <label>
              Button label
              <input
                value={form.ctaLabel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ctaLabel: e.target.value }))
                }
                placeholder="I'll be there"
              />
            </label>
            <label>
              Button link
              <input
                value={form.ctaHref}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ctaHref: e.target.value }))
                }
                placeholder="/garden"
                list="mb-cta-links"
              />
              <datalist id="mb-cta-links">
                {QUICK_LINKS.map((l) => (
                  <option key={l.href} value={l.href}>
                    {l.label}
                  </option>
                ))}
              </datalist>
            </label>
          </div>

          <div className="mb-quick-links" aria-label="Quick insert links">
            {QUICK_LINKS.map((l) => (
              <button
                key={l.href}
                type="button"
                className="nav-ghost"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    ctaHref: l.href,
                    ctaLabel: f.ctaLabel || `Visit ${l.label}`,
                  }))
                }
              >
                {l.label}
              </button>
            ))}
          </div>

          <label className="mb-admin-check">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) =>
                setForm((f) => ({ ...f, pinned: e.target.checked }))
              }
            />
            Pin to the top of its section
          </label>

          {form.kind === "community_event" ? (
            <fieldset className="mb-admin-tasks">
              <legend>Per-village tasks</legend>
              <p className="muted">
                Each village can get its own piece of the shared gathering.
              </p>
              {VILLAGES.map((v) => (
                <label key={v.id}>
                  {v.mascot} {v.name}
                  <input
                    value={form.villageTasks[v.id]}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        villageTasks: {
                          ...f.villageTasks,
                          [v.id]: e.target.value,
                        },
                      }))
                    }
                    placeholder={`What should ${v.name} do?`}
                  />
                </label>
              ))}
            </fieldset>
          ) : null}

          {error ? <p className="form-error">{error}</p> : null}
          {status ? <p className="form-success">{status}</p> : null}

          <div className="mb-admin-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving
                ? "Saving…"
                : editingId
                  ? "Save changes"
                  : "Add to board"}
            </button>
            {editingId ? (
              <>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => void duplicate(editingId)}
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    void quickPatch(
                      editingId,
                      { status: "archived" },
                      "Archived — hidden from villagers."
                    )
                  }
                >
                  Archive
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => void remove(editingId)}
                >
                  Delete
                </button>
              </>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}
