"use client";

import { useEffect, useState } from "react";
import type { VillageId } from "@/lib/villages";
import {
  WORKSHOP_ACCESS_LABELS,
  WORKSHOP_ACCESS_MODES,
  type WorkshopAccessMode,
  type WorkshopAccessSettings,
  type WorkshopActivityAccess,
} from "@/lib/workshopAccess";

type Bundle = {
  workshops: WorkshopAccessSettings[];
  activitiesByVillage: Partial<Record<VillageId, WorkshopActivityAccess[]>>;
};

export function WorkshopAccessAdmin() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [bundle, setBundle] = useState<Bundle | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/workshop-access");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load workshop access");
      setBundle({
        workshops: data.workshops,
        activitiesByVillage: data.activitiesByVillage || {},
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open && !bundle) void load();
  }, [open, bundle]);

  async function saveWorkshop(
    villageId: VillageId,
    patch: {
      accessMode: WorkshopAccessMode;
      eventAccessMode?: WorkshopAccessMode | null;
      eventStartsAt?: string | null;
      eventEndsAt?: string | null;
      clearEvent?: boolean;
    }
  ) {
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const res = await fetch("/api/admin/workshop-access", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ villageId, ...patch }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setBundle((prev) =>
        prev
          ? {
              ...prev,
              workshops: prev.workshops.map((w) =>
                w.villageId === villageId ? data.workshop : w
              ),
            }
          : prev
      );
      setStatus(`${data.workshop.name} updated — takes effect immediately.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveActivity(
    villageId: VillageId,
    activity: {
      activityKey: string;
      label: string;
      accessMode: WorkshopAccessMode;
      isCrossVillage?: boolean;
    }
  ) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/workshop-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ villageId, ...activity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Activity save failed");
      setBundle((prev) => {
        if (!prev) return prev;
        const list = [...(prev.activitiesByVillage[villageId] || [])];
        const idx = list.findIndex((a) => a.activityKey === activity.activityKey);
        if (idx >= 0) list[idx] = data.activity;
        else list.push(data.activity);
        return {
          ...prev,
          activitiesByVillage: {
            ...prev.activitiesByVillage,
            [villageId]: list,
          },
        };
      });
      setStatus("Activity access updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Activity save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <section className="village-panel workshop-access-admin">
        <h2>🛠 Owner · Workshop management</h2>
        <p className="section-lead">
          Control who may enter each village workshop — home villagers, visitors,
          everyone, invite-only, or closed — without changing workshop content.
        </p>
        <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>
          Open workshop access panel
        </button>
      </section>
    );
  }

  return (
    <section className="village-panel workshop-access-admin">
      <h2>🛠 Workshop management</h2>
      <p className="section-lead">
        Changes apply immediately. Temporary event access can open a hub to
        everyone (or visitors) and automatically fall back when the window ends.
      </p>
      {loading ? <p className="muted">Loading…</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {status ? <p className="welcome-editor-status">{status}</p> : null}

      <div className="workshop-access-grid">
        {(bundle?.workshops || []).map((w) => {
          const activities = bundle?.activitiesByVillage[w.villageId] || [];
          return (
            <article key={w.villageId} className="workshop-access-tile">
              <header>
                <h3>{w.buildingName}</h3>
                <p className="muted">{w.name}</p>
                <p
                  className={`workshop-access-status tone-${w.statusTone}`}
                >
                  <span aria-hidden>
                    {w.statusTone === "closed"
                      ? "🔴"
                      : w.statusTone === "event"
                        ? "🌎"
                        : "🟢"}
                  </span>{" "}
                  {w.statusLabel}
                  {w.eventActive
                    ? ` · event: ${WORKSHOP_ACCESS_LABELS[w.effectiveMode]}`
                    : ""}
                </p>
              </header>

              <label>
                Access
                <select
                  value={w.accessMode}
                  disabled={saving}
                  onChange={(e) =>
                    void saveWorkshop(w.villageId, {
                      accessMode: e.target.value as WorkshopAccessMode,
                    })
                  }
                >
                  {WORKSHOP_ACCESS_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {WORKSHOP_ACCESS_LABELS[mode]}
                    </option>
                  ))}
                </select>
              </label>

              <details className="workshop-access-event">
                <summary>Temporary opening / event</summary>
                <label>
                  Event access
                  <select
                    value={w.eventAccessMode || ""}
                    disabled={saving}
                    onChange={(e) => {
                      const val = e.target.value;
                      void saveWorkshop(w.villageId, {
                        accessMode: w.accessMode,
                        eventAccessMode: val
                          ? (val as WorkshopAccessMode)
                          : null,
                        eventStartsAt: w.eventStartsAt,
                        eventEndsAt: w.eventEndsAt,
                        clearEvent: !val,
                      });
                    }}
                  >
                    <option value="">None (use normal access)</option>
                    {WORKSHOP_ACCESS_MODES.filter((m) => m !== "CLOSED").map(
                      (mode) => (
                        <option key={mode} value={mode}>
                          {WORKSHOP_ACCESS_LABELS[mode]}
                        </option>
                      )
                    )}
                  </select>
                </label>
                <label>
                  Starts
                  <input
                    type="datetime-local"
                    disabled={saving || !w.eventAccessMode}
                    value={toLocalInput(w.eventStartsAt)}
                    onChange={(e) =>
                      void saveWorkshop(w.villageId, {
                        accessMode: w.accessMode,
                        eventAccessMode: w.eventAccessMode,
                        eventStartsAt: fromLocalInput(e.target.value),
                        eventEndsAt: w.eventEndsAt,
                      })
                    }
                  />
                </label>
                <label>
                  Ends
                  <input
                    type="datetime-local"
                    disabled={saving || !w.eventAccessMode}
                    value={toLocalInput(w.eventEndsAt)}
                    onChange={(e) =>
                      void saveWorkshop(w.villageId, {
                        accessMode: w.accessMode,
                        eventAccessMode: w.eventAccessMode,
                        eventStartsAt: w.eventStartsAt,
                        eventEndsAt: fromLocalInput(e.target.value),
                      })
                    }
                  />
                </label>
                {w.eventAccessMode ? (
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={saving}
                    onClick={() =>
                      void saveWorkshop(w.villageId, {
                        accessMode: w.accessMode,
                        clearEvent: true,
                      })
                    }
                  >
                    Clear event override
                  </button>
                ) : null}
              </details>

              <div className="workshop-access-activities">
                <h4>Activities</h4>
                {activities.length === 0 ? (
                  <p className="muted">
                    No activity overrides yet — workshop access applies to all
                    activities. Add one below for a special or cross-village
                    task.
                  </p>
                ) : (
                  <ul>
                    {activities.map((a) => (
                      <li key={a.id}>
                        <span>
                          {a.isCrossVillage ? "🌉 " : ""}
                          {a.label}
                        </span>
                        <select
                          value={a.accessMode}
                          disabled={saving}
                          onChange={(e) =>
                            void saveActivity(w.villageId, {
                              activityKey: a.activityKey,
                              label: a.label,
                              accessMode: e.target.value as WorkshopAccessMode,
                              isCrossVillage: a.isCrossVillage,
                            })
                          }
                        >
                          {WORKSHOP_ACCESS_MODES.map((mode) => (
                            <option key={mode} value={mode}>
                              {WORKSHOP_ACCESS_LABELS[mode]}
                            </option>
                          ))}
                        </select>
                      </li>
                    ))}
                  </ul>
                )}
                <ActivityAddForm
                  disabled={saving}
                  onAdd={(draft) => void saveActivity(w.villageId, draft)}
                />
              </div>
            </article>
          );
        })}
      </div>

      <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
        Close panel
      </button>
    </section>
  );
}

function ActivityAddForm({
  disabled,
  onAdd,
}: {
  disabled: boolean;
  onAdd: (draft: {
    activityKey: string;
    label: string;
    accessMode: WorkshopAccessMode;
    isCrossVillage: boolean;
  }) => void;
}) {
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [mode, setMode] = useState<WorkshopAccessMode>("HOME_VILLAGERS_ONLY");
  const [cross, setCross] = useState(false);

  return (
    <form
      className="workshop-access-add-activity"
      onSubmit={(e) => {
        e.preventDefault();
        if (!key.trim()) return;
        onAdd({
          activityKey: key.trim(),
          label: label.trim() || key.trim(),
          accessMode: mode,
          isCrossVillage: cross,
        });
        setKey("");
        setLabel("");
        setCross(false);
      }}
    >
      <input
        placeholder="activity-key"
        value={key}
        disabled={disabled}
        onChange={(e) => setKey(e.target.value)}
      />
      <input
        placeholder="Label"
        value={label}
        disabled={disabled}
        onChange={(e) => setLabel(e.target.value)}
      />
      <select
        value={mode}
        disabled={disabled}
        onChange={(e) => setMode(e.target.value as WorkshopAccessMode)}
      >
        {WORKSHOP_ACCESS_MODES.map((m) => (
          <option key={m} value={m}>
            {WORKSHOP_ACCESS_LABELS[m]}
          </option>
        ))}
      </select>
      <label className="workshop-access-cross">
        <input
          type="checkbox"
          checked={cross}
          disabled={disabled}
          onChange={(e) => setCross(e.target.checked)}
        />
        Cross-village
      </label>
      <button type="submit" className="btn-secondary" disabled={disabled}>
        Add activity rule
      </button>
    </form>
  );
}

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string) {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
