"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { VILLAGE_MAP, type CollectibleKind, type VillageId } from "@/lib/villages";
import type { VillageHubId, VillageTask } from "@/lib/villageTasks";

type VillageOption = {
  id: VillageId;
  name: string;
  hub: VillageHubId;
  hubLabel: string;
};

type CollectibleOption = {
  kind: CollectibleKind;
  name: string;
  emoji: string;
  image?: string;
  max: number;
};

export function VillageTasksAdminEditor({
  initialVillageId,
}: {
  initialVillageId: VillageId;
}) {
  const [open, setOpen] = useState(false);
  const [villages, setVillages] = useState<VillageOption[]>([]);
  const [villageId, setVillageId] = useState<VillageId>(initialVillageId);
  const [tasks, setTasks] = useState<VillageTask[]>([]);
  const [collectibles, setCollectibles] = useState<CollectibleOption[]>([]);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [rewards, setRewards] = useState<CollectibleKind[]>([]);
  const [sortOrder, setSortOrder] = useState(50);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentVillage = villages.find((v) => v.id === villageId);

  async function load(nextVillage: VillageId = villageId) {
    setLoading(true);
    setError("");
    setStatus("");
    const res = await fetch(
      `/api/admin/village-tasks?villageId=${encodeURIComponent(nextVillage)}`
    );
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not load village tasks");
      return;
    }
    setVillages(data.villages || []);
    setVillageId(nextVillage);
    setTasks(data.tasks || []);
    setCollectibles(data.collectibles || []);
  }

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      void load(initialVillageId);
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialVillageId]);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDetail("");
    setRewards([]);
    setSortOrder(50);
  }

  function startEdit(task: VillageTask) {
    setEditingId(task.id);
    setTitle(task.title);
    setDetail(task.detail);
    setRewards([...task.rewards]);
    setSortOrder(task.sortOrder);
    setStatus("");
    setError("");
  }

  function toggleReward(kind: CollectibleKind) {
    setRewards((prev) =>
      prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind]
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setStatus("");

    const hub = currentVillage?.hub;
    const payload = {
      villageId,
      hub,
      title,
      detail,
      rewards,
      sortOrder,
      id: editingId || undefined,
    };

    const res = await fetch("/api/admin/village-tasks", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        editingId
          ? {
              id: editingId,
              title,
              detail,
              rewards,
              sortOrder,
              active: true,
            }
          : payload
      ),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Could not save task");
      return;
    }
    setStatus(editingId ? "Task updated." : "Task added for this hub.");
    resetForm();
    await load(villageId);
  }

  async function setActive(task: VillageTask, active: boolean) {
    setError("");
    const res = await fetch("/api/admin/village-tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, active }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not update task");
      return;
    }
    await load(villageId);
  }

  async function remove(task: VillageTask) {
    if (
      !window.confirm(
        `Delete “${task.title}”? Completions for this task will also be removed.`
      )
    ) {
      return;
    }
    setError("");
    const res = await fetch("/api/admin/village-tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not delete task");
      return;
    }
    if (editingId === task.id) resetForm();
    setStatus("Task deleted.");
    await load(villageId);
  }

  if (!open) {
    return (
      <button
        type="button"
        className="btn-primary"
        onClick={() => setOpen(true)}
      >
        Village hub tasks &amp; collectibles
      </button>
    );
  }

  return (
    <section
      className="vt-admin"
      aria-label="Village hub tasks admin"
      style={
        {
          "--village-color": VILLAGE_MAP[villageId].color,
          "--village-soft": VILLAGE_MAP[villageId].colorSoft,
        } as CSSProperties
      }
    >
      <div className="vt-admin-head">
        <h3>Village hub tasks</h3>
        <button type="button" className="nav-ghost" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
      <p className="vt-admin-lead">
        Add tasks for each village specialty hub (Workshop, Garden, Fireside,
        Observatory, Library). Choose which collectibles villagers earn when
        they mark a task complete.
      </p>

      {loading ? <p className="vt-admin-lead">Loading tasks…</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {status ? <p className="vt-admin-lead">{status}</p> : null}

      <label className="vt-admin-village">
        Village / hub
        <select
          value={villageId}
          onChange={(e) => {
            resetForm();
            void load(e.target.value as VillageId);
          }}
        >
          {villages.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} — {v.hubLabel}
            </option>
          ))}
        </select>
      </label>

      <ul className="vt-admin-list">
        {tasks.length === 0 ? (
          <li className="vt-admin-lead">No tasks yet for this hub.</li>
        ) : (
          tasks.map((task) => (
            <li key={task.id} className={!task.active ? "vt-inactive" : ""}>
              <div>
                <strong>{task.title}</strong>
                {!task.active ? (
                  <span className="vt-admin-lead"> (inactive)</span>
                ) : null}
                {task.detail ? <p className="vt-admin-lead">{task.detail}</p> : null}
                <p className="vt-reward-line">
                  Rewards:{" "}
                  {task.rewards.length
                    ? task.rewards
                        .map((k) => {
                          const meta = collectibles.find((c) => c.kind === k);
                          return meta
                            ? `${meta.emoji} ${meta.name}`
                            : k;
                        })
                        .join(", ")
                    : "none"}
                </p>
              </div>
              <div className="vt-admin-row-actions">
                <button type="button" className="nav-ghost" onClick={() => startEdit(task)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="nav-ghost"
                  onClick={() => void setActive(task, !task.active)}
                >
                  {task.active ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  className="nav-ghost"
                  onClick={() => void remove(task)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      <form className="vt-admin-form" onSubmit={save}>
        <h4>{editingId ? "Edit task" : "Add a new task"}</h4>
        <label>
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
            placeholder="e.g. Press three autumn leaves"
          />
        </label>
        <label>
          Details (optional)
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="What should the villager do?"
          />
        </label>
        <label>
          Sort order
          <input
            type="number"
            min={0}
            max={999}
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
          />
        </label>

        <fieldset className="vt-reward-fieldset">
          <legend>Collectibles earned on complete</legend>
          <p className="vt-admin-lead">
            Pick one or more keepsakes from{" "}
            {currentVillage?.name || "this village"}&apos;s collection.
          </p>
          <div className="vt-reward-grid">
            {collectibles.map((c) => {
              const checked = rewards.includes(c.kind);
              return (
                <label key={c.kind} className={checked ? "on" : ""}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleReward(c.kind)}
                  />
                  <span aria-hidden>{c.emoji}</span>
                  <span>{c.name}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="vt-admin-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving
              ? "Saving…"
              : editingId
                ? "Save changes"
                : "Add task"}
          </button>
          {editingId ? (
            <button
              type="button"
              className="nav-ghost"
              onClick={() => resetForm()}
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
