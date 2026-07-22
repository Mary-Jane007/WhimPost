"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { UserPublic } from "@/lib/types";
import type { GardenProgress } from "@/lib/garden";
import {
  COMMUNITY_MILESTONES,
  GARDEN_COLLECTIONS,
  GARDEN_TABS,
  GARDEN_XP,
  SPOT_FLOWERS,
  WILD_VISITORS,
  WISH_GESTURES,
  dailyTasksForDay,
  featuredJoySeed,
  weeklyKindness,
  type GardenTabId,
} from "@/lib/gardenContent";

type Props = {
  user: UserPublic;
  initialProgress: GardenProgress;
};

export function BloomkeeperGarden({ user, initialProgress }: Props) {
  const [tab, setTab] = useState<GardenTabId>("overview");
  const [progress, setProgress] = useState(initialProgress);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [bloomBurst, setBloomBurst] = useState(false);
  const [wishBody, setWishBody] = useState("");
  const [seedBody, setSeedBody] = useState("");
  const [spotId, setSpotId] = useState(SPOT_FLOWERS[0]?.id || "daisy");
  const [spotNote, setSpotNote] = useState("");
  const [spotPhoto, setSpotPhoto] = useState<string | null>(null);
  const [journalName, setJournalName] = useState("");
  const [journalNote, setJournalNote] = useState("");
  const [journalMood, setJournalMood] = useState("gentle");
  const [uploading, setUploading] = useState(false);

  const daily = dailyTasksForDay();
  const kindness = weeklyKindness();
  const seed = featuredJoySeed();
  const dayKey = Math.floor(Date.now() / 86_400_000);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [toast]);

  function triggerBloom() {
    setBloomBurst(true);
    window.setTimeout(() => setBloomBurst(false), 1600);
  }

  async function postAction(action: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/garden/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not tend the garden");
      if (data.progress) {
        setProgress(data.progress);
        triggerBloom();
      }
      return data.progress as GardenProgress;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function onPhoto(file: File | null) {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      // Reuse workshop-style upload via a data URL for simplicity in this garden.
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Could not read photo"));
        reader.readAsDataURL(file);
      });
      setSpotPhoto(dataUrl.slice(0, 1_500_000));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setUploading(false);
    }
  }

  const meadowFlowers = Math.min(24, Math.max(3, progress.blooms));

  return (
    <div className="cm-garden">
      <div className="cm-sky" aria-hidden>
        <span className="cm-petal p1" />
        <span className="cm-petal p2" />
        <span className="cm-petal p3" />
        <span className="cm-seed s1" />
        <span className="cm-seed s2" />
        <span className="cm-butterfly b1" />
        <span className="cm-butterfly b2" />
        <span className="cm-bee" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/stickers/villages/clovermeadow/pack/butterfly-silk.png"
          alt=""
          className="cm-deco silk"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/stickers/villages/clovermeadow/pack/bunny-plush.png"
          alt=""
          className="cm-deco bunny"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/stickers/villages/clovermeadow/pack/blossom-branch.png"
          alt=""
          className="cm-deco blossom"
        />
      </div>

      {bloomBurst ? (
        <div className="cm-bloom-burst" aria-hidden>
          <span>🌸</span>
          <span>🌼</span>
          <span>🌷</span>
          <span>💛</span>
        </div>
      ) : null}

      <header className="cm-hero">
        <p className="cm-eyebrow">Clovermeadow · Bloomkeepers only</p>
        <h1>The Bloomkeeper&apos;s Garden</h1>
        <p className="cm-subtitle">
          <em>“Every flower begins with a small act of kindness.”</em>
        </p>
        <p className="cm-lead">
          Legends say the Bloomkeeper&apos;s Garden only blooms for those who
          spread warmth wherever they go, {user.displayName}. Complete gentle
          daily tasks to fill your meadow with flowers, attract woodland
          creatures, and uncover hidden corners of the garden.
        </p>
        <div className="cm-status">
          <span>
            {progress.title.emoji} {progress.title.title}
          </span>
          <span>{progress.xp} garden XP</span>
          <span>{progress.blooms} blooms</span>
          <span>{progress.badges.length} badges</span>
        </div>
      </header>

      {error ? <p className="cm-error">{error}</p> : null}
      {toast ? (
        <p className="cm-toast" role="status">
          {toast}
        </p>
      ) : null}

      <nav className="cm-tabs" aria-label="Garden sections">
        {GARDEN_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? "active" : ""}
            onClick={() => setTab(t.id)}
          >
            <span aria-hidden>{t.emoji}</span> {t.label}
          </button>
        ))}
      </nav>

      <div className="cm-panel">
        {tab === "overview" && (
          <section className="cm-section">
            <h2>Garden Overview</h2>
            <p className="cm-section-lead">
              You begin with one daisy patch, a dirt path, and a tiny birdhouse.
              Every completed task blooms a new flower — nothing here can be
              bought.
            </p>
            <div className="cm-meadow" aria-label="Your magical meadow">
              <div className="cm-path" />
              <div className="cm-birdhouse" title="Tiny birdhouse">
                🏠
              </div>
              {Array.from({ length: meadowFlowers }).map((_, i) => (
                <span
                  key={i}
                  className={`cm-meadow-flower f${(i % 6) + 1}`}
                  style={{
                    left: `${8 + ((i * 17) % 84)}%`,
                    bottom: `${10 + ((i * 11) % 55)}%`,
                    animationDelay: `${(i % 7) * 0.2}s`,
                  }}
                >
                  {["🌼", "🌸", "🌷", "🌻", "💜", "🌿"][i % 6]}
                </span>
              ))}
            </div>
            <div className="cm-starter">
              <article className="cm-card">
                <h3>Daisy patch</h3>
                <p>Your first soft circle of white and gold.</p>
              </article>
              <article className="cm-card">
                <h3>Dirt path</h3>
                <p>A gentle walkway waiting for more footsteps of kindness.</p>
              </article>
              <article className="cm-card">
                <h3>Tiny birdhouse</h3>
                <p>Ready for the first wild visitor.</p>
              </article>
            </div>
            {progress.decorations.length > 0 ? (
              <div className="cm-decor-list">
                <h3>Unlocked decorations</h3>
                <ul>
                  {progress.decorations.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        )}

        {tab === "daily" && (
          <section className="cm-section">
            <h2>Daily Bloom Tasks</h2>
            <p className="cm-section-lead">
              Five gentle tasks each day · +{GARDEN_XP.daily} XP and a bloom
              each.
            </p>
            <div className="cm-grid">
              {daily.map((task) => {
                const key = `${dayKey}:${task.id}`;
                const done = Boolean(progress.dailyDone[key]);
                return (
                  <article key={task.id} className="cm-card">
                    <h3>
                      <span aria-hidden>{task.emoji}</span> {task.label}
                    </h3>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={busy || done}
                      onClick={() =>
                        void postAction({
                          type: "completeDaily",
                          taskId: task.id,
                          mood: "gentle",
                        }).then((p) => {
                          if (p) setToast("A flower bloomed in your meadow.");
                        })
                      }
                    >
                      {done ? "Bloomed today" : "I did this"}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === "spotting" && (
          <section className="cm-section">
            <h2>Flower Spotting Journal</h2>
            <p className="cm-section-lead">
              Discover real flowers nearby, upload a photo, and watch them bloom
              in the magical garden (+{GARDEN_XP.spotting} XP).
            </p>
            <form
              className="cm-card cm-form"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void postAction({
                  type: "spotFlower",
                  flowerId: spotId,
                  photoUrl: spotPhoto || undefined,
                  note: spotNote,
                  mood: "wonder",
                }).then((p) => {
                  if (p) {
                    setSpotNote("");
                    setSpotPhoto(null);
                    setToast("Spotted flower added to your meadow.");
                  }
                });
              }}
            >
              <label>
                <span>Which flower did you find?</span>
                <select
                  value={spotId}
                  onChange={(e) => setSpotId(e.target.value)}
                  disabled={busy}
                >
                  {SPOT_FLOWERS.map((f) => (
                    <option
                      key={f.id}
                      value={f.id}
                      disabled={Boolean(progress.spotted[f.id])}
                    >
                      {f.emoji} {f.name}
                      {progress.spotted[f.id] ? " · found" : ""}
                    </option>
                  ))}
                </select>
              </label>
              {SPOT_FLOWERS.filter((f) => f.id === spotId).map((f) => (
                <div key={f.id} className="cm-flower-facts">
                  <p>{f.facts}</p>
                  <p className="cm-meta">
                    Season · {f.season} · Pollinators · {f.pollinators}
                  </p>
                  <p className="cm-meta">Symbolism · {f.symbolism}</p>
                </div>
              ))}
              <label>
                <span>Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={busy || uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    e.target.value = "";
                    void onPhoto(file);
                  }}
                />
              </label>
              {spotPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={spotPhoto} alt="Spotted flower preview" className="cm-photo-preview" />
              ) : null}
              <label>
                <span>Note (optional)</span>
                <textarea
                  rows={3}
                  value={spotNote}
                  onChange={(e) => setSpotNote(e.target.value)}
                  disabled={busy}
                />
              </label>
              <button
                type="submit"
                className="btn-primary"
                disabled={busy || Boolean(progress.spotted[spotId])}
              >
                {progress.spotted[spotId] ? "Already spotted" : "Log discovery"}
              </button>
            </form>
            <div className="cm-grid">
              {SPOT_FLOWERS.filter((f) => progress.spotted[f.id]).map((f) => (
                <article key={f.id} className="cm-card">
                  <h3>
                    {f.emoji} {f.name}
                  </h3>
                  {progress.spotted[f.id]?.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={progress.spotted[f.id].photoUrl}
                      alt={f.name}
                      className="cm-photo-preview"
                    />
                  ) : null}
                  <p className="cm-meta">{f.symbolism}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "kindness" && (
          <section className="cm-section">
            <h2>Acts of Kindness</h2>
            <p className="cm-section-lead">
              Weekly missions that unlock rare flowers (+{GARDEN_XP.kindness}{" "}
              XP).
            </p>
            <div className="cm-grid">
              {kindness.map((m) => {
                const done = Boolean(progress.kindnessDone[m.id]);
                return (
                  <article key={m.id} className="cm-card">
                    <h3>{m.label}</h3>
                    <p>{m.detail}</p>
                    <p className="cm-meta">Rare unlock · {m.rareFlower}</p>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={busy || done}
                      onClick={() =>
                        void postAction({
                          type: "completeKindness",
                          missionId: m.id,
                        }).then((p) => {
                          if (p) setToast(`${m.rareFlower} bloomed for you.`);
                        })
                      }
                    >
                      {done ? "Completed" : "I did this kindness"}
                    </button>
                  </article>
                );
              })}
            </div>
            {progress.rareFlowers.length > 0 ? (
              <div className="cm-decor-list">
                <h3>Rare flowers</h3>
                <ul>
                  {progress.rareFlowers.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        )}

        {tab === "seeds" && (
          <section className="cm-section">
            <h2>Seeds of Joy</h2>
            <p className="cm-section-lead">
              Share a small happiness — responses become anonymous petals
              floating through the village.
            </p>
            <article className="cm-card">
              <h3>{seed.prompt}</h3>
              <form
                className="cm-form"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  void postAction({
                    type: "submitSeed",
                    promptId: seed.id,
                    body: seedBody,
                  }).then((p) => {
                    if (p) {
                      setSeedBody("");
                      setToast("A joy petal drifted into the meadow.");
                    }
                  });
                }}
              >
                <textarea
                  rows={4}
                  value={seedBody}
                  onChange={(e) => setSeedBody(e.target.value)}
                  disabled={busy}
                  placeholder="Plant a soft answer…"
                  required
                  minLength={3}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={busy || seedBody.trim().length < 3}
                >
                  Release petal
                </button>
              </form>
            </article>
            <div className="cm-petal-stream" aria-label="Anonymous joy petals">
              {progress.petals.length === 0 ? (
                <p className="muted">No petals yet — be the first breeze.</p>
              ) : (
                progress.petals.map((p) => (
                  <blockquote key={p.id} className="cm-petal-card">
                    {p.body}
                  </blockquote>
                ))
              )}
            </div>
          </section>
        )}

        {tab === "visitors" && (
          <section className="cm-section">
            <h2>Wild Visitors</h2>
            <p className="cm-section-lead">
              As flowers bloom, animals begin visiting. Each species prefers
              different blooms.
            </p>
            <div className="cm-grid">
              {WILD_VISITORS.map((v) => {
                const here = Boolean(progress.visitors[v.id]);
                return (
                  <article
                    key={v.id}
                    className={here ? "cm-card visitor-here" : "cm-card"}
                  >
                    <h3>
                      <span aria-hidden>{v.emoji}</span> {v.name}
                    </h3>
                    <p>{v.prefers}</p>
                    <p className="cm-meta">
                      Needs {v.needBlooms} blooms · you have {progress.blooms}
                    </p>
                    <p className={here ? "cm-done" : "muted"}>
                      {here ? "Visiting your garden" : "Not yet arrived"}
                    </p>
                  </article>
                );
              })}
            </div>
            <div className="cm-collections">
              <h3>Flower Collections</h3>
              <ul>
                {GARDEN_COLLECTIONS.map((c) => (
                  <li key={c.id}>
                    <span aria-hidden>{c.emoji}</span> {c.title}{" "}
                    <em>
                      {progress.collections[c.id] || 0}/{c.need}
                    </em>
                    <span className="cm-meta"> → {c.decoration}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {tab === "wish" && (
          <section className="cm-section">
            <h2>The Wish Tree</h2>
            <p className="cm-section-lead">
              Hang one wish each week. Others leave quiet gestures — Bloom,
              Warmth, Hope, or Light — not comments.
            </p>
            <div className="cm-wish-tree" aria-hidden>
              🌳
            </div>
            <form
              className="cm-card cm-form"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void postAction({ type: "hangWish", body: wishBody }).then(
                  (p) => {
                    if (p) {
                      setWishBody("");
                      setToast("Your wish hangs among the blossoms.");
                    }
                  }
                );
              }}
            >
              <label>
                <span>This week&apos;s wish</span>
                <textarea
                  rows={3}
                  value={wishBody}
                  onChange={(e) => setWishBody(e.target.value)}
                  disabled={busy}
                  placeholder='e.g. "I hope to be kinder to myself."'
                  required
                  minLength={8}
                  maxLength={280}
                />
              </label>
              <button
                type="submit"
                className="btn-primary"
                disabled={busy || wishBody.trim().length < 8}
              >
                Hang wish
              </button>
            </form>
            <div className="cm-wish-list">
              {progress.wishes.map((w) => (
                <article key={w.id} className="cm-card">
                  <p className="cm-wish-body">“{w.body}”</p>
                  <p className="cm-meta">from {w.authorName}</p>
                  <div className="cm-gestures">
                    {WISH_GESTURES.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        className="btn-secondary"
                        disabled={busy}
                        onClick={() =>
                          void postAction({
                            type: "encourageWish",
                            wishId: w.id,
                            gesture: g.id,
                          })
                        }
                        title={g.label}
                      >
                        {g.emoji} {w.gestures[g.id] || 0}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "community" && (
          <section className="cm-section">
            <h2>Community Meadow</h2>
            <p className="cm-section-lead">
              Every kindness across Clovermeadow feeds one shared meadow.
            </p>
            <div className="cm-community-stats">
              <article className="cm-card">
                <h3>{progress.communityBlooms.toLocaleString()}</h3>
                <p>Community blooms</p>
              </article>
              <article className="cm-card">
                <h3>{progress.communityKindness.toLocaleString()}</h3>
                <p>Acts of kindness</p>
              </article>
            </div>
            <ul className="cm-milestones">
              {COMMUNITY_MILESTONES.map((m) => {
                const reached =
                  (m.id === "cherry"
                    ? progress.communityKindness
                    : progress.communityBlooms) >= m.at;
                return (
                  <li key={m.id} className={reached ? "reached" : ""}>
                    {reached ? "✦" : "·"} {m.label}
                    {reached ? ` · ${m.badge}` : ""}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {tab === "journal" && (
          <section className="cm-section">
            <h2>Garden Journal</h2>
            <p className="cm-section-lead">
              A pressed-flower botanical scrapbook of every gentle act.
            </p>
            <form
              className="cm-card cm-form"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void postAction({
                  type: "journalEntry",
                  activityName: journalName,
                  note: journalNote,
                  mood: journalMood,
                }).then((p) => {
                  if (p) {
                    setJournalName("");
                    setJournalNote("");
                    setToast("Scrapbook page pressed.");
                  }
                });
              }}
            >
              <h3>New scrapbook page</h3>
              <label>
                <span>Activity</span>
                <input
                  value={journalName}
                  onChange={(e) => setJournalName(e.target.value)}
                  disabled={busy}
                  required
                  maxLength={120}
                />
              </label>
              <label>
                <span>Reflection</span>
                <textarea
                  rows={4}
                  value={journalNote}
                  onChange={(e) => setJournalNote(e.target.value)}
                  disabled={busy}
                  required
                />
              </label>
              <label>
                <span>Mood</span>
                <input
                  value={journalMood}
                  onChange={(e) => setJournalMood(e.target.value)}
                  disabled={busy}
                  maxLength={80}
                />
              </label>
              <button type="submit" className="btn-primary" disabled={busy}>
                Save page
              </button>
            </form>

            {progress.journal.length === 0 ? (
              <p className="muted">Your first pressed page awaits.</p>
            ) : (
              <div className="cm-journal-pages">
                {progress.journal.map((entry) => (
                  <article key={entry.id} className="cm-journal-page">
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
                    {entry.flower ? (
                      <p className="cm-flower-tag">🌸 {entry.flower}</p>
                    ) : null}
                    {entry.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.photoUrl}
                        alt=""
                        className="cm-photo-preview"
                      />
                    ) : null}
                    <p>{entry.note}</p>
                    {entry.mood ? (
                      <p className="cm-meta">Mood · {entry.mood}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}

            {progress.badges.length > 0 ? (
              <div className="cm-decor-list">
                <h3>Badges</h3>
                <ul>
                  {progress.badges.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        )}
      </div>
    </div>
  );
}
