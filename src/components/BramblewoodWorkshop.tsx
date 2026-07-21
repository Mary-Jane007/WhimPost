"use client";

import { useMemo, useRef, useState } from "react";
import type { UserPublic } from "@/lib/types";
import type { WorkshopProgress } from "@/lib/workshop";
import {
  BIRDS,
  BROADCAST_VIDEOS,
  CRAFTS,
  PLANTS,
  QUEST_ITEMS,
  RECIPES,
  SEASONAL_PANELS,
  WORKSHOP_TABS,
  featuredCraft,
  featuredPrompt,
  featuredPuzzle,
  type WorkshopTabId,
} from "@/lib/workshopContent";

type Props = {
  user: UserPublic;
  initialProgress: WorkshopProgress;
};

async function uploadPhoto(file: File) {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.url as string;
}

export function BramblewoodWorkshop({ user, initialProgress }: Props) {
  const [tab, setTab] = useState<WorkshopTabId>("craft");
  const [progress, setProgress] = useState(initialProgress);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingPhotoKey = useRef<string | null>(null);
  const pendingPhotoKind = useRef<
    | "generic"
    | "craft"
    | "recipe"
    | "prompt"
    | "quest"
    | "plant"
    | "bird"
    | null
  >(null);
  const pendingMeta = useRef<Record<string, string | number>>({});

  const craft = useMemo(
    () => CRAFTS.find((c) => c.id === progress.featured.craftId) || featuredCraft(),
    [progress.featured.craftId]
  );
  const weeklyPrompt = featuredPrompt();
  const puzzle = featuredPuzzle();

  const questDone = QUEST_ITEMS.filter((q) => progress.questChecks[q.id]).length;
  const questPct = Math.round((questDone / QUEST_ITEMS.length) * 100);

  async function postAction(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/workshop/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setProgress(data.progress);
      setStatus("Saved to your Craft Journal");
      window.setTimeout(() => setStatus(null), 2800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  function requestPhoto(
    kind: NonNullable<typeof pendingPhotoKind.current>,
    key: string,
    meta: Record<string, string | number> = {}
  ) {
    pendingPhotoKind.current = kind;
    pendingPhotoKey.current = key;
    pendingMeta.current = meta;
    fileRef.current?.click();
  }

  async function onPickFile(file: File | null) {
    if (!file || !pendingPhotoKind.current || !pendingPhotoKey.current) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadPhoto(file);
      const kind = pendingPhotoKind.current;
      const key = pendingPhotoKey.current;
      const meta = pendingMeta.current;

      if (kind === "craft") {
        await postAction({
          type: "complete",
          completeKind: "craft",
          id: key,
          photoUrl: url,
        });
      } else if (kind === "recipe") {
        await postAction({
          type: "complete",
          completeKind: "recipe",
          id: key,
          photoUrl: url,
        });
      } else if (kind === "prompt") {
        await postAction({
          type: "complete",
          completeKind: "prompt",
          id: key,
          photoUrl: url,
        });
      } else if (kind === "quest") {
        await postAction({
          type: "questToggle",
          itemId: key,
          checked: true,
          photoUrl: url,
        });
      } else if (kind === "plant") {
        await postAction({
          type: "plantWeek",
          week: Number(meta.week),
          photoUrl: url,
        });
      } else if (kind === "bird") {
        await postAction({
          type: "bird",
          birdId: key,
          photoUrl: url,
        });
      } else {
        await postAction({ type: "photo", key, photoUrl: url });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setBusy(false);
    } finally {
      pendingPhotoKind.current = null;
      pendingPhotoKey.current = null;
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="bw-workshop">
      <div className="bw-floaters" aria-hidden>
        <span className="bw-leaf l1" />
        <span className="bw-leaf l2" />
        <span className="bw-leaf l3" />
        <span className="bw-leaf l4" />
        <span className="bw-bird b1" />
        <span className="bw-bird b2" />
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={(e) => void onPickFile(e.target.files?.[0] || null)}
      />

      <header className="bw-hero">
        <div className="bw-hero-copy">
          <p className="bw-eyebrow">Bramblewood Village</p>
          <h1>The Bramblewood Workshop</h1>
          <p className="bw-subtitle">
            “The forest is full of things waiting to be made.”
          </p>
          <p className="bw-lead">
            In Bramblewood, villagers don&apos;t simply watch stories—they create
            them. Every week brings new crafts, recipes, creative prompts, and
            woodland adventures. Complete activities to earn badges, collect
            memories in your Craft Journal, and help the village flourish.
          </p>
          <div className="bw-rank">
            <strong>
              {progress.title.emoji} {progress.title.title}
            </strong>
            <span>{progress.xp} workshop XP</span>
            {progress.badges.length ? (
              <em>{progress.badges.slice(-3).join(" · ")}</em>
            ) : (
              <em>Welcome, {user.displayName}</em>
            )}
          </div>
        </div>
        <div className="bw-hero-atelier" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/stickers/villages/bramblewood/candle-jar.png" alt="" className="a candle" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/stickers/villages/bramblewood/bouquet.png" alt="" className="a flowers" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/stickers/villages/bramblewood/book-leaf.png" alt="" className="a books" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/stickers/villages/bramblewood/mushroom.png" alt="" className="a mush" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/stickers/villages/bramblewood/fox-sitting.png" alt="" className="a fox" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/stickers/villages/bramblewood/maple-branch.png" alt="" className="a maple" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/stickers/villages/bramblewood/teapot.png" alt="" className="a tea" />
          <div className="bw-hero-table" />
        </div>
      </header>

      {(status || error) && (
        <p className={`bw-toast ${error ? "err" : ""}`} role="status">
          {error || status}
        </p>
      )}

      <div className="bw-tabs" role="tablist" aria-label="Workshop sections">
        {WORKSHOP_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? "active" : ""}
            onClick={() => setTab(t.id)}
          >
            <span aria-hidden>{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bw-panel" role="tabpanel">
        {tab === "craft" && (
          <section className="bw-section">
            <h2>Weekly Craft</h2>
            <p className="bw-section-lead">
              One featured craft each week — mark complete for XP and the
              Craftsman Badge.
            </p>
            <article className="bw-card craft-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={craft.image} alt="" className="bw-card-art" />
              <div>
                <p className="bw-meta">
                  {craft.difficulty} · {craft.time}
                </p>
                <h3>{craft.title}</h3>
                <h4>Materials</h4>
                <ul>
                  {craft.materials.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
                <h4>Instructions</h4>
                <ol>
                  {craft.instructions.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
                <div className="bw-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={busy || progress.completed[`craft:${craft.id}`]}
                    onClick={() =>
                      void postAction({
                        type: "complete",
                        completeKind: "craft",
                        id: craft.id,
                      })
                    }
                  >
                    {progress.completed[`craft:${craft.id}`]
                      ? "Completed"
                      : "Mark Complete"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={busy}
                    onClick={() => requestPhoto("craft", craft.id)}
                  >
                    Upload Photo
                  </button>
                </div>
                {progress.photos[`craft:${craft.id}`] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={progress.photos[`craft:${craft.id}`]}
                    alt="Your craft"
                    className="bw-upload-preview"
                  />
                ) : null}
              </div>
            </article>
            <details className="bw-more">
              <summary>More craft ideas</summary>
              <ul className="bw-idea-list">
                {CRAFTS.map((c) => (
                  <li key={c.id}>
                    <strong>{c.title}</strong>
                    <span>
                      {c.difficulty} · {c.time}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </section>
        )}

        {tab === "kitchen" && (
          <section className="bw-section">
            <h2>Cozy Kitchen</h2>
            <p className="bw-section-lead">
              Cottage recipes — finish a dish to unlock kitchen badges.
            </p>
            <div className="bw-grid">
              {RECIPES.map((r) => {
                const done = progress.completed[`recipe:${r.id}`];
                return (
                  <article key={r.id} className="bw-card recipe-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.image} alt="" />
                    <h3>{r.title}</h3>
                    <p className="bw-meta">
                      {r.difficulty} · {r.time}
                    </p>
                    <details>
                      <summary>Ingredients &amp; steps</summary>
                      <ul>
                        {r.ingredients.map((i) => (
                          <li key={i}>{i}</li>
                        ))}
                      </ul>
                      <ol>
                        {r.instructions.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ol>
                    </details>
                    <div className="bw-actions">
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={busy || done}
                        onClick={() =>
                          void postAction({
                            type: "complete",
                            completeKind: "recipe",
                            id: r.id,
                          })
                        }
                      >
                        {done ? "Cooked" : "Mark Complete"}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busy}
                        onClick={() => requestPhoto("recipe", r.id)}
                      >
                        Upload Finished Dish
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === "prompt" && (
          <section className="bw-section">
            <h2>Creative Prompt</h2>
            <p className="bw-section-lead">This week&apos;s woodland invitation.</p>
            <article className="bw-card prompt-card">
              <p className="bw-prompt-text">{weeklyPrompt.text}</p>
              <div className="bw-actions">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy}
                  onClick={() => requestPhoto("prompt", weeklyPrompt.id)}
                >
                  Upload Artwork
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setGalleryOpen((v) => !v)}
                >
                  View Community Gallery
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={
                    busy || progress.completed[`prompt:${weeklyPrompt.id}`]
                  }
                  onClick={() =>
                    void postAction({
                      type: "complete",
                      completeKind: "prompt",
                      id: weeklyPrompt.id,
                    })
                  }
                >
                  Mark Prompt Done
                </button>
              </div>
              {galleryOpen ? (
                <div className="bw-gallery">
                  <p>
                    Community walls fill as villagers upload. Your pieces appear
                    in the Craft Journal scrapbook below.
                  </p>
                  {progress.photos[`prompt:${weeklyPrompt.id}`] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={progress.photos[`prompt:${weeklyPrompt.id}`]}
                      alt="Your artwork"
                    />
                  ) : (
                    <p className="muted">Upload to pin the first scrap.</p>
                  )}
                </div>
              ) : null}
            </article>
          </section>
        )}

        {tab === "quest" && (
          <section className="bw-section">
            <h2>Woodland Quest</h2>
            <p className="bw-section-lead">
              A real-life scavenger hunt · {questPct}% complete · Explorer XP
            </p>
            <div className="bw-progress-bar" aria-hidden>
              <span style={{ width: `${questPct}%` }} />
            </div>
            <ul className="bw-quest-list">
              {QUEST_ITEMS.map((q) => (
                <li key={q.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={Boolean(progress.questChecks[q.id])}
                      disabled={busy}
                      onChange={(e) =>
                        void postAction({
                          type: "questToggle",
                          itemId: q.id,
                          checked: e.target.checked,
                        })
                      }
                    />
                    <span aria-hidden>{q.emoji}</span>
                    {q.label}
                  </label>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={busy}
                    onClick={() => requestPhoto("quest", q.id)}
                  >
                    Photo
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === "grow" && (
          <section className="bw-section">
            <h2>Grow Something</h2>
            <p className="bw-section-lead">
              Choose one plant and upload a progress photo each week.
            </p>
            <div className="bw-plant-pick">
              {PLANTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={
                    progress.plantId === p.id ? "bw-chip active" : "bw-chip"
                  }
                  disabled={busy}
                  onClick={() =>
                    void postAction({ type: "choosePlant", plantId: p.id })
                  }
                >
                  {p.emoji} {p.name}
                </button>
              ))}
            </div>
            {progress.plantId ? (
              <div className="bw-weeks">
                {[1, 2, 3, 4].map((week) => (
                  <article key={week} className="bw-card">
                    <h3>Week {week}</h3>
                    {progress.plantWeeks[String(week)] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={progress.plantWeeks[String(week)]}
                        alt={`Week ${week}`}
                        className="bw-upload-preview"
                      />
                    ) : (
                      <p className="muted">No photo yet</p>
                    )}
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={busy}
                      onClick={() =>
                        requestPhoto("plant", progress.plantId!, { week })
                      }
                    >
                      Upload progress
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">Pick a plant to begin your grow journal.</p>
            )}
            <p className="bw-rewards">
              Rewards: 🌱 Tiny Sprout · 🌿 Gardener · 🌻 Green Thumb
            </p>
          </section>
        )}

        {tab === "birds" && (
          <section className="bw-section">
            <h2>Bird Watch</h2>
            <p className="bw-section-lead">
              Log species in your illustrated field guide.
            </p>
            <div className="bw-grid birds">
              {BIRDS.map((b) => {
                const spotted = progress.birds[b.id]?.spotted;
                return (
                  <article key={b.id} className="bw-card bird-card">
                    <span className="bw-bird-emoji" aria-hidden>
                      {b.emoji}
                    </span>
                    <h3>{b.name}</h3>
                    <p>{b.hint}</p>
                    <div className="bw-actions">
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={busy || spotted}
                        onClick={() =>
                          void postAction({ type: "bird", birdId: b.id })
                        }
                      >
                        {spotted ? "Spotted" : "Log sighting"}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busy}
                        onClick={() => requestPhoto("bird", b.id)}
                      >
                        Upload photo
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === "puzzle" && (
          <section className="bw-section">
            <h2>Puzzle Table</h2>
            <p className="bw-section-lead">A new cozy puzzle each day.</p>
            <article className="bw-card">
              <h3>{puzzle.title}</h3>
              <p>{puzzle.blurb}</p>
              <p className="bw-prompt-text">{puzzle.prompt}</p>
              <button
                type="button"
                className="btn-primary"
                disabled={busy || progress.completed[`puzzle:${puzzle.id}`]}
                onClick={() =>
                  void postAction({
                    type: "complete",
                    completeKind: "puzzle",
                    id: puzzle.id,
                  })
                }
              >
                {progress.completed[`puzzle:${puzzle.id}`]
                  ? "Solved today"
                  : "Mark solved"}
              </button>
            </article>
          </section>
        )}

        {tab === "broadcast" && (
          <section className="bw-section">
            <h2>Bramblewood Broadcast</h2>
            <p className="bw-section-lead">
              Exclusive creative channel for Bramblewood villagers — relaxing
              how-tos instead of cartoons.
            </p>
            {playingId ? (
              <div className="bw-player">
                <p>
                  Now playing:{" "}
                  <strong>
                    {BROADCAST_VIDEOS.find((v) => v.id === playingId)?.title}
                  </strong>
                </p>
                <div className="bw-player-screen">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      BROADCAST_VIDEOS.find((v) => v.id === playingId)?.image
                    }
                    alt=""
                  />
                  <p>Soft creative hour — imagine the workshop demo unfolding.</p>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progress.broadcast[playingId]?.progress || 0}
                  onChange={(e) =>
                    void postAction({
                      type: "broadcast",
                      videoId: playingId,
                      progress: Number(e.target.value),
                    })
                  }
                  aria-label="Continue watching progress"
                />
              </div>
            ) : null}
            <div className="bw-grid broadcast">
              {BROADCAST_VIDEOS.map((v) => {
                const state = progress.broadcast[v.id] || {
                  favorite: false,
                  completed: false,
                  progress: 0,
                };
                return (
                  <article key={v.id} className="bw-card broadcast-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.image} alt="" />
                    <p className="bw-meta">
                      {v.categoryEmoji} {v.category} · {v.duration}
                    </p>
                    <h3>{v.title}</h3>
                    <p>{v.blurb}</p>
                    <div className="bw-actions wrap">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => setPlayingId(v.id)}
                      >
                        Play
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busy}
                        onClick={() =>
                          void postAction({
                            type: "broadcast",
                            videoId: v.id,
                            favorite: !state.favorite,
                          })
                        }
                      >
                        {state.favorite ? "★ Favorited" : "☆ Favorite"}
                      </button>
                      <label className="bw-check">
                        <input
                          type="checkbox"
                          checked={state.completed}
                          disabled={busy}
                          onChange={(e) =>
                            void postAction({
                              type: "broadcast",
                              videoId: v.id,
                              completed: e.target.checked,
                            })
                          }
                        />
                        Completed
                      </label>
                    </div>
                    {state.progress > 0 ? (
                      <div className="bw-progress-bar thin" aria-hidden>
                        <span style={{ width: `${state.progress}%` }} />
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === "journal" && (
          <section className="bw-section">
            <h2>Craft Journal</h2>
            <p className="bw-section-lead">
              An old scrapbook of everything you&apos;ve made in the workshop.
            </p>
            {progress.journal.length === 0 ? (
              <p className="muted">
                Complete a craft, recipe, or quest — entries appear here with
                dates, XP, and handwritten notes.
              </p>
            ) : (
              <div className="bw-journal">
                {progress.journal.map((entry) => (
                  <article key={entry.id} className="bw-journal-entry">
                    <header>
                      <time dateTime={entry.createdAt}>
                        {new Date(
                          entry.createdAt.replace(" ", "T") + "Z"
                        ).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </time>
                      <span>+{entry.xpEarned} XP</span>
                    </header>
                    <h3>{entry.activityName}</h3>
                    {entry.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.photoUrl}
                        alt=""
                        className="bw-journal-photo"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src="/stickers/villages/bramblewood/maple-branch.png"
                        alt=""
                        className="bw-journal-stamp"
                      />
                    )}
                    <p className="bw-handnote">{entry.note}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <section className="bw-seasonal">
        <h2>Seasonal Events</h2>
        <div className="bw-grid seasonal">
          {SEASONAL_PANELS.map((panel) => (
            <article key={panel.id} className="bw-card">
              <h3>
                <span aria-hidden>{panel.emoji}</span> {panel.title}
              </h3>
              <ul className="bw-season-tasks">
                {panel.tasks.map((task, index) => {
                  const key = `${panel.id}:${index}`;
                  const done = progress.seasonal[key];
                  return (
                    <li key={task}>
                      <label>
                        <input
                          type="checkbox"
                          checked={Boolean(done)}
                          disabled={busy || done}
                          onChange={() =>
                            void postAction({
                              type: "seasonal",
                              eventId: panel.id,
                              taskIndex: index,
                            })
                          }
                        />
                        {task}
                      </label>
                    </li>
                  );
                })}
              </ul>
              <p className="bw-meta">Reward: {panel.reward}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
