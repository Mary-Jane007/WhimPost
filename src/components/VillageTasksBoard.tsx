"use client";

import { useEffect, useState } from "react";
import type { CollectibleKind, VillageId } from "@/lib/villages";
import type { VillageHubId, VillageTaskView } from "@/lib/villageTasks";
import { buildXpCelebration } from "@/lib/xpCelebrate";
import { emitXpCelebration } from "@/lib/xpCelebrateClient";

type Props = {
  villageId: VillageId;
  hub: VillageHubId;
};

export function VillageTasksBoard({ villageId, hub }: Props) {
  const [tasks, setTasks] = useState<VillageTaskView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    const res = await fetch(
      `/api/village-tasks?villageId=${encodeURIComponent(villageId)}&hub=${encodeURIComponent(hub)}`
    );
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Could not load tasks");
      return;
    }
    setTasks(data.tasks || []);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [villageId, hub]);

  async function complete(taskId: string) {
    setBusyId(taskId);
    setError("");
    setStatus("");
    const res = await fetch("/api/village-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId }),
    });
    const data = await res.json();
    setBusyId(null);
    if (!res.ok) {
      setError(data.error || "Could not complete task");
      return;
    }
    const granted = (data.granted || []) as CollectibleKind[];
    const names = (data.task?.rewardMeta || [])
      .map((r: { emoji: string; name: string }) => `${r.emoji} ${r.name}`)
      .join(", ");
    setStatus(
      names
        ? `Done! You earned ${names}${
            data.reputationGained
              ? ` (+${data.reputationGained} standing)`
              : ""
          }.`
        : "Task complete."
    );
    emitXpCelebration(
      buildXpCelebration({
        reputation: Number(data.reputationGained) || 0,
        collectibles: granted,
        activityHint: "finishing a village task",
      })
    );
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...data.task } : t))
    );
  }

  if (loading) {
    return (
      <section className="vt-board" aria-label="Village tasks">
        <p className="vt-board-lead">Loading village tasks…</p>
      </section>
    );
  }

  if (tasks.length === 0) {
    return null;
  }

  return (
    <section className="vt-board" aria-label="Village tasks">
      <header className="vt-board-head">
        <h2>Village tasks</h2>
        <p className="vt-board-lead">
          Soft quests from the village owner — finish one to earn the listed
          collectibles and a little forest standing.
        </p>
      </header>
      {error ? <p className="form-error">{error}</p> : null}
      {status ? <p className="vt-board-status">{status}</p> : null}
      <ul className="vt-board-list">
        {tasks.map((task) => (
          <li key={task.id} className={task.completed ? "done" : ""}>
            <div className="vt-board-copy">
              <strong>{task.title}</strong>
              {task.detail ? <p>{task.detail}</p> : null}
              {task.rewardMeta.length > 0 ? (
                <ul className="vt-board-rewards">
                  {task.rewardMeta.map((r) => (
                    <li key={r.kind}>
                      <span aria-hidden>{r.emoji}</span> {r.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="vt-board-lead">No collectible reward set.</p>
              )}
            </div>
            {task.completed ? (
              <span className="vt-board-done">Completed</span>
            ) : (
              <button
                type="button"
                className="btn-primary"
                disabled={busyId === task.id}
                onClick={() => void complete(task.id)}
              >
                {busyId === task.id ? "Saving…" : "Mark complete"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
