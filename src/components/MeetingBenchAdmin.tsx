"use client";

import { useEffect, useState } from "react";
import type {
  BenchItem,
  BenchItemKind,
  BenchItemStatus,
} from "@/lib/meetingBench";
import type { GardenSeason } from "@/lib/gardenContent";
import { VILLAGES, type VillageId } from "@/lib/villages";

const KINDS: Array<{ id: BenchItemKind; label: string }> = [
  { id: "notice", label: "Village Notice" },
  { id: "gathering", label: "Gathering" },
  { id: "seasonal", label: "Seasonal Activity" },
  { id: "chronicle", label: "Chronicle Story" },
  { id: "community_event", label: "Community Event" },
];

const STATUSES: BenchItemStatus[] = [
  "draft",
  "upcoming",
  "active",
  "published",
  "finished",
  "archived",
];

const SEASONS: Array<GardenSeason | ""> = [
  "",
  "spring",
  "summer",
  "autumn",
  "winter",
];

const emptyForm = {
  kind: "notice" as BenchItemKind,
  title: "",
  body: "",
  status: "published" as BenchItemStatus,
  season: "" as GardenSeason | "",
  startsAt: "",
  endsAt: "",
  activityType: "",
  villages: "all" as VillageId[] | "all",
  ctaLabel: "",
  ctaHref: "",
  pinned: false,
  sortOrder: 50,
  villageTasksJson: "",
};

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

export function MeetingBenchAdmin() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<BenchItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/meeting-bench?admin=1");
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not load Meeting Bench");
      return;
    }
    setItems(data.items || []);
  }

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setStatus("");
    setError("");
  }

  function startEdit(item: BenchItem) {
    setEditingId(item.id);
    const tasks =
      item.meta &&
      typeof item.meta.villageTasks === "object" &&
      item.meta.villageTasks
        ? (item.meta.villageTasks as Record<string, string>)
        : null;
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
      villageTasksJson: tasks ? JSON.stringify(tasks, null, 2) : "",
    });
    setStatus("");
    setError("");
  }

  function buildMeta() {
    if (!form.villageTasksJson.trim()) return {};
    try {
      const parsed = JSON.parse(form.villageTasksJson) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return { villageTasks: parsed };
      }
    } catch {
      throw new Error("Village tasks must be valid JSON");
    }
    return {};
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const meta = buildMeta();
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
      setStatus(editingId ? "Updated on the board." : "Pinned to the board.");
      await load();
      if (!editingId && data.item?.id) {
        startEdit(data.item as BenchItem);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Take this paper off the board?")) return;
    setError("");
    const res = await fetch(`/api/meeting-bench?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not delete");
      return;
    }
    if (editingId === id) startCreate();
    setStatus("Removed from the board.");
    await load();
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

  if (!open) {
    return (
      <div className="mb-admin-launch">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setOpen(true)}
        >
          Tend the Meeting Bench
        </button>
      </div>
    );
  }

  return (
    <section className="mb-admin">
      <div className="mb-admin-head">
        <h3>Meeting Bench — Owner desk</h3>
        <button type="button" className="nav-ghost" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
      <p className="muted">
        Only you can pin notices, gatherings, seasonal activities, Chronicle
        stories, and community-wide events. Write them in-universe when you can.
      </p>

      <div className="mb-admin-layout">
        <aside className="mb-admin-list">
          <button type="button" className="btn-secondary" onClick={startCreate}>
            New paper
          </button>
          {loading ? <p className="muted">Loading…</p> : null}
          <ul>
            {items.map((item) => (
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
                  </span>
                </button>
                <button
                  type="button"
                  className="nav-ghost"
                  onClick={() => void remove(item.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <form className="mb-admin-form" onSubmit={save}>
          <label>
            Kind
            <select
              value={form.kind}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  kind: e.target.value as BenchItemKind,
                }))
              }
              disabled={Boolean(editingId)}
            >
              {KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
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
            />
          </label>

          <label>
            Body
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={6}
              maxLength={4000}
              required
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
                <option value="">None</option>
                {SEASONS.filter(Boolean).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Activity type
              <input
                value={form.activityType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, activityType: e.target.value }))
                }
                placeholder="nature, movie, lore…"
              />
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
              Sort
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    sortOrder: Number(e.target.value) || 50,
                  }))
                }
              />
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
                {v.name}
              </label>
            ))}
          </fieldset>

          <div className="mb-admin-row">
            <label>
              Button label
              <input
                value={form.ctaLabel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ctaLabel: e.target.value }))
                }
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
              />
            </label>
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

          {(form.kind === "community_event" || form.villageTasksJson) && (
            <label>
              Village tasks JSON
              <textarea
                value={form.villageTasksJson}
                onChange={(e) =>
                  setForm((f) => ({ ...f, villageTasksJson: e.target.value }))
                }
                rows={6}
                placeholder={`{\n  "clovermeadow": "…",\n  "bramblewood": "…"\n}`}
              />
            </label>
          )}

          {error ? <p className="form-error">{error}</p> : null}
          {status ? <p className="form-success">{status}</p> : null}

          <div className="mb-admin-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Pin to board"}
            </button>
            {editingId ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={startCreate}
              >
                Clear form
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}
