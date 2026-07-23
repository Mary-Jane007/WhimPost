"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { UserPublic } from "@/lib/types";
import type { MoonProgress } from "@/lib/moon";
import {
  CELESTIAL_PLAYLISTS,
  CONSTELLATIONS,
  DREAM_THEME_LABELS,
  MOON_ART,
  MOON_TABS,
  NIGHT_CREATURES,
  SKY_FACTS,
  dailyRituals,
  todaysConstellation,
  todaysCreature,
  todaysInspiration,
  todaysJournalPrompt,
  todaysMoonPhase,
  todaysSkyFact,
  type DreamTheme,
  type MoonTabId,
} from "@/lib/moonContent";

type Props = {
  user: UserPublic;
  initialProgress: MoonProgress;
};

export function MoonmereObservatory({ user, initialProgress }: Props) {
  const [tab, setTab] = useState<MoonTabId>("overview");
  const [progress, setProgress] = useState(initialProgress);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [journalBody, setJournalBody] = useState("");
  const [dreamBody, setDreamBody] = useState("");
  const [dreamTheme, setDreamTheme] = useState<DreamTheme>("flying");
  const [dreamFilter, setDreamFilter] = useState<DreamTheme | "all">("all");
  const [selectedConstellation, setSelectedConstellation] = useState<
    string | null
  >(null);
  const [selectedCreature, setSelectedCreature] = useState<string | null>(null);
  const [listeningId, setListeningId] = useState<string | null>(null);
  const [showStardustOnly, setShowStardustOnly] = useState(false);
  const [randomWishId, setRandomWishId] = useState<string | null>(null);

  const rituals = dailyRituals();
  const moon = todaysMoonPhase();
  const constellation = todaysConstellation();
  const creature = todaysCreature();
  const fact = todaysSkyFact();
  const prompt = todaysJournalPrompt();
  const inspiration = todaysInspiration();
  const dayKey = Math.floor(Date.now() / 86_400_000);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function postAction(action: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/moon/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setProgress(data.progress);
      return data.progress as MoonProgress;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      return null;
    } finally {
      setBusy(false);
    }
  }

  const openConstellation =
    CONSTELLATIONS.find((c) => c.id === selectedConstellation) ||
    constellation;

  const openCreature =
    NIGHT_CREATURES.find((c) => c.id === selectedCreature) || creature;

  const filteredDreams = useMemo(() => {
    if (dreamFilter === "all") return progress.dreams;
    return progress.dreams.filter((d) => d.theme === dreamFilter);
  }, [progress.dreams, dreamFilter]);

  const visibleWishes = useMemo(() => {
    if (showStardustOnly) {
      return progress.wishes.filter((w) => progress.stardust[w.id]);
    }
    if (randomWishId) {
      const one = progress.wishes.find((w) => w.id === randomWishId);
      return one ? [one] : progress.wishes.slice(0, 1);
    }
    return progress.wishes;
  }, [progress.wishes, progress.stardust, showStardustOnly, randomWishId]);

  const inspConstellation =
    CONSTELLATIONS.find((c) => c.id === inspiration.constellationId) ||
    constellation;
  const inspFact =
    SKY_FACTS.find((f) => f.id === inspiration.factId) || fact;
  const inspCreature =
    NIGHT_CREATURES.find((c) => c.id === inspiration.creatureId) || creature;

  function pickRandomWish() {
    if (progress.wishes.length === 0) return;
    const idx = Math.floor(Math.random() * progress.wishes.length);
    setRandomWishId(progress.wishes[idx].id);
    setShowStardustOnly(false);
  }

  async function onJournal(e: FormEvent) {
    e.preventDefault();
    const next = await postAction({ type: "saveJournal", body: journalBody });
    if (next) {
      setJournalBody("");
      setToast("Saved privately in your Moon Journal.");
    }
  }

  async function onDream(e: FormEvent) {
    e.preventDefault();
    const next = await postAction({
      type: "submitDream",
      body: dreamBody,
      theme: dreamTheme,
    });
    if (next) {
      setDreamBody("");
      setToast("Dream sealed in a glass bottle.");
    }
  }

  return (
    <div className="mm-observatory">
      <div className="mm-atmosphere" aria-hidden>
        <span className="mm-star s1" />
        <span className="mm-star s2" />
        <span className="mm-star s3" />
        <span className="mm-star s4" />
        <span className="mm-star s5" />
        <span className="mm-firefly f1" />
        <span className="mm-firefly f2" />
        <span className="mm-firefly f3" />
        <span className="mm-cloud c1" />
        <span className="mm-cloud c2" />
        <span className="mm-particle p1" />
        <span className="mm-particle p2" />
        <span className="mm-particle p3" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MOON_ART.moth} alt="" className="mm-deco moth" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MOON_ART.lantern} alt="" className="mm-deco lantern" />
      </div>

      <header className="mm-hero">
        <p className="mm-eyebrow">Moonmere · The Observatory</p>
        <h1>The Observatory</h1>
        <p className="mm-motto">Some answers only arrive after sunset.</p>
        <p className="mm-lead">
          Welcome beneath the dome, {user.displayName}. Soft blue light,
          brass instruments, and a sky full of quiet questions await.
        </p>
        <div className="mm-status">
          <span>
            {progress.title.emoji} {progress.title.title}
          </span>
          <span>{progress.xp} XP</span>
          <span>
            {Object.keys(progress.stardust).length} stardust wishes
          </span>
          <span>{progress.journal.length} journal pages</span>
        </div>
      </header>

      {error ? <p className="mm-error">{error}</p> : null}
      {toast ? <p className="mm-toast">{toast}</p> : null}

      <div className="mm-tabs" role="tablist" aria-label="Observatory rooms">
        {MOON_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? "active" : ""}
            onClick={() => setTab(t.id)}
          >
            <span aria-hidden>{t.emoji}</span> {t.label}
          </button>
        ))}
      </div>

      <div className="mm-panel">
        {tab === "overview" && (
          <section className="mm-section">
            <div className="mm-dome">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={MOON_ART.observatory}
                alt="A circular observatory with a giant telescope under stars"
                className="mm-dome-art"
              />
            </div>
            <h2>Welcome to the Observatory</h2>
            <p className="mm-section-lead">
              A circular room with a giant telescope beneath an opening dome.
              Celestial maps, constellation charts, moon journals, brass
              instruments, star globes, hanging lanterns, hourglasses, and soft
              cushions wait beside warm blankets. Everything here revolves around
              watching the night sky and reflecting quietly.
            </p>
            <div className="mm-grid">
              <article className="mm-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MOON_ART.fullMoon} alt="" className="mm-card-img" />
                <h3>
                  Today&apos;s Moon · {moon.emoji} {moon.name}
                </h3>
                <p className="mm-meta">
                  Live sky · {Math.round(moon.illumination * 100)}% lit ·{" "}
                  {moon.ageDays.toFixed(1)} days since new
                </p>
                <p>{moon.detail}</p>
              </article>
              <article className="mm-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={constellation.image} alt="" className="mm-card-img" />
                <h3>Today&apos;s Constellation · {constellation.name}</h3>
                <p>{constellation.mythology}</p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setSelectedConstellation(constellation.id);
                    setTab("atlas");
                  }}
                >
                  Open Star Atlas
                </button>
              </article>
              <article className="mm-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MOON_ART.starlight} alt="" className="mm-card-img" />
                <h3>Shooting Star Wishes</h3>
                <p>
                  Anonymous hopes drift across the sky. No replies — only
                  stardust you choose to keep.
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setTab("wishes")}
                >
                  Read wishes
                </button>
              </article>
            </div>
            {progress.badges.length > 0 ? (
              <div className="mm-badges">
                <h3>Night badges</h3>
                <ul>
                  {progress.badges.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        )}

        {tab === "rituals" && (
          <section className="mm-section">
            <h2>Today&apos;s Night Rituals</h2>
            <p className="mm-section-lead">
              Five gentle tasks that rotate each day — peaceful, never a race.
            </p>
            <div className="mm-ritual-list">
              {rituals.map((r) => {
                const key = `${dayKey}:${r.id}`;
                const done = Boolean(progress.ritualsDone[key]);
                return (
                  <article
                    key={r.id}
                    className={done ? "mm-ritual done" : "mm-ritual"}
                  >
                    <div>
                      <h3>
                        <span aria-hidden>{r.emoji}</span> {r.label}
                      </h3>
                      <p>{r.detail}</p>
                    </div>
                    <button
                      type="button"
                      className={done ? "btn-secondary" : "btn-primary"}
                      disabled={busy || done}
                      onClick={() =>
                        void postAction({
                          type: "completeRitual",
                          ritualId: r.id,
                        }).then((p) => {
                          if (p) setToast("Ritual noted under the stars.");
                        })
                      }
                    >
                      {done ? "Done" : "Complete"}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === "atlas" && (
          <section className="mm-section">
            <h2>Star Atlas</h2>
            <p className="mm-section-lead">
              An interactive constellation encyclopedia — mythology, visibility,
              and the brightest lights.
            </p>
            <div className="mm-chip-row">
              {CONSTELLATIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={
                    openConstellation.id === c.id ? "active" : ""
                  }
                  onClick={() => setSelectedConstellation(c.id)}
                >
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
            <article className="mm-feature-card mm-constellation-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={openConstellation.image}
                alt=""
                className="mm-feature-img"
              />
              <div>
                <h3>
                  {openConstellation.emoji} {openConstellation.name}
                </h3>
                <p className="mm-meta">Visibility · {openConstellation.visibility}</p>
                <p>{openConstellation.mythology}</p>
                <h4>Brightest stars</h4>
                <ul className="mm-ing">
                  {openConstellation.brightestStars.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                <h4>Interesting facts</h4>
                <ul className="mm-steps">
                  {openConstellation.facts.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            </article>
          </section>
        )}

        {tab === "journal" && (
          <section className="mm-section">
            <h2>Moon Journal</h2>
            <p className="mm-section-lead">
              A private journal inspired by the moon. Only you can read these
              pages.
            </p>
            <article className="mm-card mm-journal-prompt">
              <h3>Today&apos;s prompt</h3>
              <p className="mm-prompt-text">{prompt.prompt}</p>
              <form onSubmit={onJournal} className="mm-form">
                <textarea
                  value={journalBody}
                  onChange={(e) => setJournalBody(e.target.value)}
                  rows={5}
                  maxLength={800}
                  placeholder="Write softly…"
                  required
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={busy || journalBody.trim().length < 8}
                >
                  Save privately
                </button>
              </form>
            </article>
            {progress.journal.length > 0 ? (
              <div className="mm-journal-list">
                <h3>Your pages</h3>
                {progress.journal.map((entry) => (
                  <article key={entry.id} className="mm-journal-entry">
                    <p className="mm-meta">{entry.prompt}</p>
                    <p>{entry.body}</p>
                    <p className="mm-meta">{entry.createdAt}</p>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        )}

        {tab === "dreams" && (
          <section className="mm-section">
            <h2>Dream Archive</h2>
            <p className="mm-section-lead">
              Anonymous dreams sealed like folded pages in glass bottles. No
              interpretation — only imagination.
            </p>
            <form onSubmit={onDream} className="mm-form mm-card">
              <h3>Bottle a dream</h3>
              <label>
                Theme
                <select
                  value={dreamTheme}
                  onChange={(e) =>
                    setDreamTheme(e.target.value as DreamTheme)
                  }
                >
                  {(Object.keys(DREAM_THEME_LABELS) as DreamTheme[]).map(
                    (t) => (
                      <option key={t} value={t}>
                        {DREAM_THEME_LABELS[t]}
                      </option>
                    )
                  )}
                </select>
              </label>
              <textarea
                value={dreamBody}
                onChange={(e) => setDreamBody(e.target.value)}
                rows={4}
                maxLength={400}
                placeholder="What did you dream?"
                required
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={busy || dreamBody.trim().length < 12}
              >
                Seal in a bottle
              </button>
            </form>
            <div className="mm-chip-row">
              <button
                type="button"
                className={dreamFilter === "all" ? "active" : ""}
                onClick={() => setDreamFilter("all")}
              >
                All
              </button>
              {(Object.keys(DREAM_THEME_LABELS) as DreamTheme[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={dreamFilter === t ? "active" : ""}
                  onClick={() => setDreamFilter(t)}
                >
                  {DREAM_THEME_LABELS[t]}
                </button>
              ))}
            </div>
            <div className="mm-dream-grid">
              {filteredDreams.map((d) => (
                <article key={d.id} className="mm-dream-bottle">
                  <span className="mm-bottle-glow" aria-hidden />
                  <p className="mm-meta">{DREAM_THEME_LABELS[d.theme]}</p>
                  <p>{d.body}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "facts" && (
          <section className="mm-section">
            <h2>Night Sky Facts</h2>
            <p className="mm-section-lead">
              Daily astronomy wonders — moons, meteors, galaxies, and quiet
              discoveries.
            </p>
            <article className="mm-feature-card">
              <div>
                <p className="mm-meta">Today&apos;s fact · {fact.category}</p>
                <h3>
                  {fact.emoji} {fact.title}
                </h3>
                <p>{fact.body}</p>
              </div>
            </article>
            <div className="mm-grid">
              {SKY_FACTS.map((f) => (
                <article key={f.id} className="mm-card">
                  <h3>
                    {f.emoji} {f.title}
                  </h3>
                  <p className="mm-meta">{f.category}</p>
                  <p>{f.body}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "wishes" && (
          <section className="mm-section">
            <h2>Shooting Star Wishes</h2>
            <p className="mm-section-lead">
              Anonymous hopes drift across the sky. Nobody replies. Nobody knows
              who wrote them. Save favorites into Stardust.
            </p>
            <div className="mm-wish-sky" aria-hidden>
              <span className="mm-shooting w1" />
              <span className="mm-shooting w2" />
              <span className="mm-shooting w3" />
            </div>
            <div className="mm-chip-row">
              <button
                type="button"
                className={!showStardustOnly && !randomWishId ? "active" : ""}
                onClick={() => {
                  setShowStardustOnly(false);
                  setRandomWishId(null);
                }}
              >
                All wishes
              </button>
              <button
                type="button"
                className={showStardustOnly ? "active" : ""}
                onClick={() => {
                  setShowStardustOnly(true);
                  setRandomWishId(null);
                }}
              >
                ✦ Stardust
              </button>
              <button type="button" onClick={pickRandomWish}>
                Read a random wish
              </button>
            </div>
            <div className="mm-wish-list">
              {visibleWishes.map((w) => {
                const saved = Boolean(progress.stardust[w.id]);
                return (
                  <article key={w.id} className="mm-wish-card">
                    <p>{w.body}</p>
                    <button
                      type="button"
                      className={saved ? "btn-primary" : "btn-secondary"}
                      disabled={busy}
                      onClick={() =>
                        void postAction({
                          type: "toggleStardust",
                          wishId: w.id,
                        }).then(() =>
                          setToast(
                            saved
                              ? "Released from Stardust."
                              : "Saved to your Stardust collection."
                          )
                        )
                      }
                    >
                      {saved ? "✦ In Stardust" : "☆ Save to Stardust"}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === "creatures" && (
          <section className="mm-section">
            <h2>Night Creature Field Guide</h2>
            <p className="mm-section-lead">
              Animals active at dusk and night — habitat, seasons, and soft
              trivia.
            </p>
            <div className="mm-chip-row">
              {NIGHT_CREATURES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={openCreature.id === c.id ? "active" : ""}
                  onClick={() => setSelectedCreature(c.id)}
                >
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
            <article className="mm-feature-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={openCreature.image} alt="" className="mm-feature-img" />
              <div>
                <h3>
                  {openCreature.emoji} {openCreature.name}
                </h3>
                <p className="mm-meta">Habitat · {openCreature.habitat}</p>
                <p className="mm-meta">Active · {openCreature.season}</p>
                <h4>Facts</h4>
                <ul className="mm-steps">
                  {openCreature.facts.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <p className="mm-trivia">Trivia · {openCreature.trivia}</p>
              </div>
            </article>
          </section>
        )}

        {tab === "playlists" && (
          <section className="mm-section">
            <h2>Celestial Playlists</h2>
            <p className="mm-section-lead">
              Collections of relaxing ambient sounds for observatory evenings.
              Choose one and listen along in your own space.
            </p>
            <div className="mm-grid">
              {CELESTIAL_PLAYLISTS.map((pl) => {
                const on = listeningId === pl.id;
                return (
                  <article
                    key={pl.id}
                    className={on ? "mm-card mm-listening" : "mm-card"}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pl.image} alt="" className="mm-card-img" />
                    <h3>
                      {pl.emoji} {pl.name}
                    </h3>
                    <p className="mm-meta">{pl.mood}</p>
                    <p>{pl.description}</p>
                    <ul className="mm-ing">
                      {pl.listenFor.map((l) => (
                        <li key={l}>{l}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className={on ? "btn-primary" : "btn-secondary"}
                      onClick={() =>
                        setListeningId(on ? null : pl.id)
                      }
                    >
                      {on ? "Listening…" : "Begin listening"}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === "inspiration" && (
          <section className="mm-section">
            <h2>Daily Inspiration</h2>
            <p className="mm-section-lead">
              A soft rotation of moon, stars, dreams, and quiet color — refreshed
              every day.
            </p>
            <div className="mm-grid mm-inspo-grid">
              <article className="mm-card">
                <h3>Today&apos;s Moon</h3>
                <p>
                  {inspiration.moon.emoji} {inspiration.moon.name}
                </p>
                <p className="mm-meta">
                  Live sky · {Math.round(inspiration.moon.illumination * 100)}%
                  lit · {inspiration.moon.ageDays.toFixed(1)} days since new
                </p>
                <p>{inspiration.moon.detail}</p>
              </article>
              <article className="mm-card">
                <h3>Today&apos;s Constellation</h3>
                <p>
                  {inspConstellation.emoji} {inspConstellation.name}
                </p>
                <p>{inspConstellation.mythology}</p>
              </article>
              <article className="mm-card">
                <h3>Today&apos;s Dream Prompt</h3>
                <p className="mm-prompt-text">
                  {inspiration.dreamPrompt.prompt}
                </p>
              </article>
              <article className="mm-card">
                <h3>Today&apos;s Astronomy Fact</h3>
                <p>
                  {inspFact.emoji} {inspFact.title}
                </p>
                <p>{inspFact.body}</p>
              </article>
              <article className="mm-card">
                <h3>Today&apos;s Night Creature</h3>
                <p>
                  {inspCreature.emoji} {inspCreature.name}
                </p>
                <p>{inspCreature.trivia}</p>
              </article>
              <article className="mm-card">
                <h3>Today&apos;s Quote</h3>
                <p className="mm-prompt-text">{inspiration.quote}</p>
              </article>
              <article className="mm-card">
                <h3>Today&apos;s Reflection</h3>
                <p>{inspiration.reflection}</p>
              </article>
              <article className="mm-card">
                <h3>Today&apos;s Sky Color</h3>
                <div
                  className="mm-sky-swatch"
                  style={{ background: inspiration.skyColor.hex }}
                />
                <p>{inspiration.skyColor.name}</p>
              </article>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
