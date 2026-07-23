"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { UserPublic } from "@/lib/types";
import type { HearthProgress } from "@/lib/hearth";
import {
  CANDLE_CRAFTS,
  COZY_RECIPES,
  HEARTH_ART,
  HEARTH_TABS,
  HEARTH_XP,
  HERBS,
  HERB_CATEGORY_LABELS,
  KNIT_PROJECTS,
  RECIPE_CATEGORY_LABELS,
  dailyRituals,
  todaysHerb,
  todaysInspiration,
  type HearthTabId,
  type HerbCategory,
  type KnitDifficulty,
  type RecipeCategory,
} from "@/lib/hearthContent";

type Props = {
  user: UserPublic;
  initialProgress: HearthProgress;
};

export function HearthwickFireside({ user, initialProgress }: Props) {
  const [tab, setTab] = useState<HearthTabId>("overview");
  const [progress, setProgress] = useState(initialProgress);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [noteBody, setNoteBody] = useState("");
  const [herbQuery, setHerbQuery] = useState("");
  const [herbCat, setHerbCat] = useState<HerbCategory | "all">("all");
  const [recipeCat, setRecipeCat] = useState<RecipeCategory | "all">("all");
  const [knitDiff, setKnitDiff] = useState<KnitDifficulty | "all">("all");
  const [selectedHerb, setSelectedHerb] = useState<string | null>(null);
  const [showKindlingOnly, setShowKindlingOnly] = useState(false);

  const rituals = dailyRituals();
  const herbToday = todaysHerb();
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
      const res = await fetch("/api/hearth/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setProgress(data.progress);
      const { emitChronicleUnlock } = await import("@/lib/chronicleClient");
      emitChronicleUnlock(data.chronicleUnlock);
      return data.progress as HearthProgress;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      return null;
    } finally {
      setBusy(false);
    }
  }

  const filteredHerbs = useMemo(() => {
    const q = herbQuery.trim().toLowerCase();
    return HERBS.filter((h) => {
      if (herbCat !== "all" && h.category !== herbCat) return false;
      if (!q) return true;
      return (
        h.name.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q) ||
        h.uses.toLowerCase().includes(q) ||
        h.folklore.toLowerCase().includes(q)
      );
    });
  }, [herbQuery, herbCat]);

  const openHerb =
    HERBS.find((h) => h.id === selectedHerb) ||
    filteredHerbs[0] ||
    HERBS[0];

  const filteredRecipes = useMemo(() => {
    if (recipeCat === "all") return COZY_RECIPES;
    return COZY_RECIPES.filter((r) => r.category === recipeCat);
  }, [recipeCat]);

  const filteredKnits = useMemo(() => {
    if (knitDiff === "all") return KNIT_PROJECTS;
    return KNIT_PROJECTS.filter((k) => k.difficulty === knitDiff);
  }, [knitDiff]);

  const visibleNotes = showKindlingOnly
    ? progress.notes.filter((n) => progress.kindling[n.id])
    : progress.notes;

  const inspHerb = HERBS.find((h) => h.id === inspiration.herbId) || herbToday;
  const inspRecipe =
    COZY_RECIPES.find((r) => r.id === inspiration.recipeId) || COZY_RECIPES[0];

  return (
    <div className="hw-fireside">
      <div className="hw-atmosphere" aria-hidden>
        <span className="hw-ember e1" />
        <span className="hw-ember e2" />
        <span className="hw-ember e3" />
        <span className="hw-steam s1" />
        <span className="hw-steam s2" />
        <span className="hw-dust d1" />
        <span className="hw-dust d2" />
        <span className="hw-dust d3" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HEARTH_ART.hedgehog} alt="" className="hw-deco hedgehog" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HEARTH_ART.kettle} alt="" className="hw-deco kettle" />
      </div>

      <header className="hw-hero">
        <p className="hw-eyebrow">Hearthwick · The Hearth Hall</p>
        <h1>The Fireside</h1>
        <p className="hw-motto">Every stranger is welcomed home.</p>
        <p className="hw-lead">
          Come in from the soft rain, {user.displayName}. There are no grand
          adventures here — only warm drinks, handmade crafts, and evenings
          beside a crackling fire.
        </p>
        <div className="hw-status">
          <span>
            {progress.title.emoji} {progress.title.title}
          </span>
          <span>{progress.xp} XP</span>
          <span>
            {Object.keys(progress.favoriteRecipes).length} saved recipes
          </span>
          <span>{Object.keys(progress.kindling).length} kindling notes</span>
        </div>
      </header>

      {error ? <p className="hw-error">{error}</p> : null}
      {toast ? <p className="hw-toast">{toast}</p> : null}

      <div className="hw-tabs" role="tablist" aria-label="Fireside rooms">
        {HEARTH_TABS.map((t) => (
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

      <div className="hw-panel">
        {tab === "overview" && (
          <section className="hw-section">
            <div className="hw-fireplace">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HEARTH_ART.fireplace}
                alt="A watercolor cottage fireplace with warm amber light"
                className="hw-fireplace-art"
              />
            </div>
            <h2 className="hw-welcome-title">Welcome to the Fireside</h2>
            <p className="hw-section-lead hw-welcome-lead">
              The central room is already fully decorated — a stone fireplace,
              wooden beams with dried herbs, knitted blankets, and copper
              kettles. Pull up a chair.
            </p>
            <div className="hw-grid">
              <article className="hw-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={herbToday.image} alt="" className="hw-card-img" />
                <h3>Today&apos;s Herb · {herbToday.name}</h3>
                <p>{herbToday.description}</p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setSelectedHerb(herbToday.id);
                    setTab("apothecary");
                  }}
                >
                  Open Apothecary
                </button>
              </article>
              <article className="hw-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={HEARTH_ART.letters} alt="" className="hw-card-img" />
                <h3>Fireside Notes</h3>
                <p>
                  Anonymous kindness left beside the fire — no sender, no
                  recipient.
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setTab("notes")}
                >
                  Read notes
                </button>
              </article>
              <article className="hw-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={HEARTH_ART.teacup} alt="" className="hw-card-img" />
                <h3>Today&apos;s Rituals</h3>
                <p>
                  Five gentle tasks that rotate each day — restful, never a
                  race.
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setTab("rituals")}
                >
                  Begin softly
                </button>
              </article>
            </div>
            {progress.badges.length > 0 ? (
              <div className="hw-badges">
                <h3>Cottage badges</h3>
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
          <section className="hw-section">
            <h2>Today&apos;s Fireside Rituals</h2>
            <p className="hw-section-lead">
              Five quiet practices that refresh every 24 hours. Complete them
              for yourself — +{HEARTH_XP.ritual} XP each.
            </p>
            <div className="hw-grid">
              {rituals.map((r) => {
                const key = `${dayKey}:${r.id}`;
                const done = Boolean(progress.ritualsDone[key]);
                return (
                  <article
                    key={r.id}
                    className={done ? "hw-card done" : "hw-card"}
                  >
                    <h3>
                      <span aria-hidden>{r.emoji}</span> {r.label}
                    </h3>
                    <p>{r.detail}</p>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={busy || done}
                      onClick={() =>
                        void postAction({
                          type: "completeRitual",
                          ritualId: r.id,
                        }).then((p) => {
                          if (p?.ritualsDone[key]) {
                            setToast("A soft glow settles over the hearth.");
                          }
                        })
                      }
                    >
                      {done ? "Done for today" : "I did this"}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === "apothecary" && (
          <section className="hw-section">
            <h2>Herbal Apothecary</h2>
            <p className="hw-section-lead">
              Shelves of dried herbs — browse like an old herbalist&apos;s
              notebook.
            </p>
            <article className="hw-card hw-todays-herb">
              <p className="hw-eyebrow">Today&apos;s Herb</p>
              <div className="hw-todays-herb-row">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={herbToday.image} alt={herbToday.name} />
                <div>
                  <h3>
                    {herbToday.emoji} {herbToday.name}
                  </h3>
                  <p>{herbToday.description}</p>
                  <p className="hw-meta">
                    Pairs with {herbToday.teaPairing}. {herbToday.folklore}
                  </p>
                </div>
              </div>
            </article>
            <div className="hw-filters">
              <input
                type="search"
                className="hw-search"
                placeholder="Search herbs…"
                value={herbQuery}
                onChange={(e) => setHerbQuery(e.target.value)}
              />
              <div className="hw-chip-row">
                <button
                  type="button"
                  className={herbCat === "all" ? "active" : ""}
                  onClick={() => setHerbCat("all")}
                >
                  All
                </button>
                {(Object.keys(HERB_CATEGORY_LABELS) as HerbCategory[]).map(
                  (c) => (
                    <button
                      key={c}
                      type="button"
                      className={herbCat === c ? "active" : ""}
                      onClick={() => setHerbCat(c)}
                    >
                      {HERB_CATEGORY_LABELS[c]}
                    </button>
                  )
                )}
              </div>
            </div>
            <div className="hw-apothecary">
              <div className="hw-herb-shelf">
                {filteredHerbs.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    className={
                      openHerb.id === h.id
                        ? "hw-herb-jar active"
                        : "hw-herb-jar"
                    }
                    onClick={() => setSelectedHerb(h.id)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={h.image} alt="" />
                    <span>
                      {h.emoji} {h.name}
                    </span>
                  </button>
                ))}
              </div>
              <article className="hw-card hw-herb-page">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={openHerb.image} alt={openHerb.name} />
                <h3>
                  {openHerb.emoji} {openHerb.name}
                </h3>
                <p className="hw-meta">
                  {HERB_CATEGORY_LABELS[openHerb.category]} · {openHerb.season}
                </p>
                <p>{openHerb.description}</p>
                <dl className="hw-herb-dl">
                  <div>
                    <dt>Facts</dt>
                    <dd>{openHerb.facts}</dd>
                  </div>
                  <div>
                    <dt>Traditional uses</dt>
                    <dd>{openHerb.uses}</dd>
                  </div>
                  <div>
                    <dt>Aroma</dt>
                    <dd>{openHerb.aroma}</dd>
                  </div>
                  <div>
                    <dt>Tea pairing</dt>
                    <dd>{openHerb.teaPairing}</dd>
                  </div>
                  <div>
                    <dt>Folklore</dt>
                    <dd>{openHerb.folklore}</dd>
                  </div>
                </dl>
              </article>
            </div>
          </section>
        )}

        {tab === "recipes" && (
          <section className="hw-section">
            <h2>Cozy Recipes</h2>
            <p className="hw-section-lead">
              Comfort cooking for rainy evenings. Save favorites to your
              kitchen shelf.
            </p>
            <div className="hw-chip-row">
              <button
                type="button"
                className={recipeCat === "all" ? "active" : ""}
                onClick={() => setRecipeCat("all")}
              >
                All
              </button>
              {(Object.keys(RECIPE_CATEGORY_LABELS) as RecipeCategory[]).map(
                (c) => (
                  <button
                    key={c}
                    type="button"
                    className={recipeCat === c ? "active" : ""}
                    onClick={() => setRecipeCat(c)}
                  >
                    {RECIPE_CATEGORY_LABELS[c]}
                  </button>
                )
              )}
            </div>
            <div className="hw-grid">
              {filteredRecipes.map((r) => {
                const fav = Boolean(progress.favoriteRecipes[r.id]);
                return (
                  <article key={r.id} className="hw-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.image} alt="" className="hw-card-img" />
                    <h3>
                      <span aria-hidden>{r.emoji}</span> {r.name}
                    </h3>
                    <p className="hw-meta">
                      {RECIPE_CATEGORY_LABELS[r.category]} · {r.time} ·{" "}
                      {r.difficulty}
                    </p>
                    <p>{r.description}</p>
                    <ul className="hw-ing">
                      {r.ingredients.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                    {r.herbalPairing ? (
                      <p className="hw-meta">Pairs with {r.herbalPairing}</p>
                    ) : null}
                    <button
                      type="button"
                      className={fav ? "btn-primary" : "btn-secondary"}
                      disabled={busy}
                      onClick={() =>
                        void postAction({
                          type: "toggleRecipeFavorite",
                          recipeId: r.id,
                        }).then(() =>
                          setToast(
                            fav
                              ? "Removed from favorites."
                              : "Saved to your cozy favorites."
                          )
                        )
                      }
                    >
                      {fav ? "★ Saved" : "☆ Save favorite"}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === "candles" && (
          <section className="hw-section">
            <h2>Candle Crafts</h2>
            <p className="hw-section-lead">
              Slow handmade light — tutorials for beeswax, botanicals, and
              teacup glows.
            </p>
            <div className="hw-grid">
              {CANDLE_CRAFTS.map((c) => (
                <article key={c.id} className="hw-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image} alt="" className="hw-card-img" />
                  <h3>
                    <span aria-hidden>{c.emoji}</span> {c.name}
                  </h3>
                  <p className="hw-meta">
                    {c.difficulty} · {c.time}
                  </p>
                  <h4>Materials</h4>
                  <ul className="hw-ing">
                    {c.materials.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                  <h4>Steps</h4>
                  <ol className="hw-steps">
                    {c.steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                  <p className="hw-safety">Safety · {c.safety}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "knitting" && (
          <section className="hw-section">
            <h2>Knitting Nook</h2>
            <p className="hw-section-lead">
              Yarn baskets by the fire — projects from first dishcloth to plush
              hedgehog.
            </p>
            <div className="hw-chip-row">
              <button
                type="button"
                className={knitDiff === "all" ? "active" : ""}
                onClick={() => setKnitDiff("all")}
              >
                All
              </button>
              {(
                [
                  "beginner",
                  "easy",
                  "intermediate",
                  "advanced",
                ] as KnitDifficulty[]
              ).map((d) => (
                <button
                  key={d}
                  type="button"
                  className={knitDiff === d ? "active" : ""}
                  onClick={() => setKnitDiff(d)}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="hw-grid">
              {filteredKnits.map((k) => (
                <article key={k.id} className="hw-card hw-knit-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={k.image} alt="" className="hw-card-img" />
                  <h3>
                    <span aria-hidden>{k.emoji}</span> {k.name}
                  </h3>
                  <p className="hw-meta">
                    {k.difficulty} · {k.hours} · {k.size}
                  </p>
                  <h4>Materials</h4>
                  <ul className="hw-ing">
                    {k.materials.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                  <p className="hw-meta">Tip · {k.tips}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "notes" && (
          <section className="hw-section">
            <h2>Fireside Notes</h2>
            <p className="hw-section-lead">
              Anonymous kindness left beside the fireplace. No sender. No
              recipient. Just warmth. +{HEARTH_XP.note} XP to leave one.
            </p>
            <form
              className="hw-card hw-form"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void postAction({ type: "leaveNote", body: noteBody }).then(
                  (p) => {
                    if (p) {
                      setNoteBody("");
                      setToast("Your note rests by the fire.");
                    }
                  }
                );
              }}
            >
              <label>
                <span>Leave a Fireside Note</span>
                <textarea
                  rows={3}
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  disabled={busy}
                  placeholder='e.g. "Take your time."'
                  required
                  minLength={8}
                  maxLength={280}
                />
              </label>
              <button
                type="submit"
                className="btn-primary"
                disabled={busy || noteBody.trim().length < 8}
              >
                Leave note
              </button>
            </form>
            <div className="hw-chip-row" style={{ marginTop: "1rem" }}>
              <button
                type="button"
                className={!showKindlingOnly ? "active" : ""}
                onClick={() => setShowKindlingOnly(false)}
              >
                All notes
              </button>
              <button
                type="button"
                className={showKindlingOnly ? "active" : ""}
                onClick={() => setShowKindlingOnly(true)}
              >
                My Kindling
              </button>
            </div>
            <div className="hw-notes">
              {visibleNotes.map((n) => {
                const saved = Boolean(progress.kindling[n.id]);
                return (
                  <article key={n.id} className="hw-card hw-note">
                    <p className="hw-note-body">“{n.body}”</p>
                    <p className="hw-meta">
                      Anonymous · {n.favoriteCount} kindling
                    </p>
                    <button
                      type="button"
                      className={saved ? "btn-primary" : "btn-secondary"}
                      disabled={busy}
                      onClick={() =>
                        void postAction({
                          type: "toggleKindling",
                          noteId: n.id,
                        })
                      }
                    >
                      {saved ? "★ In Kindling" : "☆ Save to Kindling"}
                    </button>
                  </article>
                );
              })}
              {visibleNotes.length === 0 ? (
                <p className="muted">No notes in this view yet.</p>
              ) : null}
            </div>
          </section>
        )}

        {tab === "inspiration" && (
          <section className="hw-section">
            <h2>Cozy Inspiration</h2>
            <p className="hw-section-lead">
              A rotating tray of gentle suggestions for today.
            </p>
            <div className="hw-grid">
              <article className="hw-card">
                <h3>Today&apos;s Tea</h3>
                <p>{inspiration.tea}</p>
              </article>
              <article className="hw-card">
                <h3>Today&apos;s Cozy Quote</h3>
                <p className="hw-quote">“{inspiration.quote}”</p>
              </article>
              <article className="hw-card">
                <h3>Today&apos;s Knitting Pattern</h3>
                <p>{inspiration.knitting}</p>
              </article>
              <article className="hw-card">
                <h3>Today&apos;s Candle</h3>
                <p>{inspiration.candle}</p>
              </article>
              <article className="hw-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={inspHerb.image} alt="" className="hw-card-img" />
                <h3>Today&apos;s Herb</h3>
                <p>
                  {inspHerb.emoji} {inspHerb.name} — {inspHerb.aroma}
                </p>
              </article>
              <article className="hw-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={inspRecipe.image} alt="" className="hw-card-img" />
                <h3>Today&apos;s Recipe</h3>
                <p>
                  {inspRecipe.emoji} {inspRecipe.name}
                </p>
              </article>
              <article className="hw-card">
                <h3>Today&apos;s Journal Prompt</h3>
                <p>{inspiration.journalPrompt}</p>
              </article>
              <article className="hw-card">
                <h3>Today&apos;s Comfort Song</h3>
                <p>{inspiration.song}</p>
              </article>
              <article className="hw-card">
                <h3>Today&apos;s Cozy Movie</h3>
                <p>{inspiration.movie}</p>
              </article>
              <article className="hw-card">
                <h3>Today&apos;s Gentle Reminder</h3>
                <p>{inspiration.reminder}</p>
              </article>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
