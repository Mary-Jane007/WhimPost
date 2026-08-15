"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { UserPublic } from "@/lib/types";
import type { MoonProgress } from "@/lib/moon";
import {
  CELESTIAL_PLAYLISTS,
  NIGHT_STARS,
  PLANETS,
  DREAM_THEME_LABELS,
  MOON_ART,
  MOON_TABS,
  NIGHT_CREATURES,
  SKY_FACTS,
  dailyRituals,
  spaceEventsHappeningNow,
  todaysBrightStar,
  todaysCreature,
  todaysInspiration,
  todaysJournalPrompt,
  todaysMoonPhase,
  todaysPlanet,
  todaysSkyFact,
  upcomingSpaceEvents,
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
  const [selectedStar, setSelectedStar] = useState<string | null>(null);
  const [selectedCreature, setSelectedCreature] = useState<string | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [listeningId, setListeningId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const rituals = dailyRituals();
  const moon = todaysMoonPhase();
  const brightStar = todaysBrightStar();
  const planet = todaysPlanet();
  const creature = todaysCreature();
  const fact = todaysSkyFact();
  const prompt = todaysJournalPrompt();
  const inspiration = todaysInspiration();
  const dayKey = Math.floor(Date.now() / 86_400_000);
  const happeningNow = spaceEventsHappeningNow();
  const upcomingEvents = upcomingSpaceEvents(new Date(), 10);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

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
      const { emitChronicleUnlock } = await import("@/lib/chronicleClient");
      emitChronicleUnlock(data.chronicleUnlock);
      return data.progress as MoonProgress;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      return null;
    } finally {
      setBusy(false);
    }
  }

  const openStar =
    NIGHT_STARS.find((s) => s.id === selectedStar) || brightStar;

  const openCreature =
    NIGHT_CREATURES.find((c) => c.id === selectedCreature) || creature;

  const openPlanet =
    PLANETS.find((p) => p.id === selectedPlanet) || planet;

  const filteredDreams = useMemo(() => {
    if (dreamFilter === "all") return progress.dreams;
    return progress.dreams.filter((d) => d.theme === dreamFilter);
  }, [progress.dreams, dreamFilter]);

  const inspStar =
    NIGHT_STARS.find(
      (s) => s.id === (inspiration.brightStarId || inspiration.constellationId)
    ) || brightStar;
  const inspPlanet =
    PLANETS.find((p) => p.id === inspiration.planetId) || planet;
  const inspFact =
    SKY_FACTS.find((f) => f.id === inspiration.factId) || fact;
  const inspCreature =
    NIGHT_CREATURES.find((c) => c.id === inspiration.creatureId) || creature;

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

  function stopListening() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setListeningId(null);
  }

  function toggleListening(playlistId: string) {
    const soundUrl = progress.playlistSounds[playlistId];
    if (!soundUrl) {
      setToast("No sound has been added to this playlist yet.");
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;

    if (listeningId === playlistId) {
      stopListening();
      return;
    }

    audio.src = soundUrl;
    void audio.play().then(
      () => setListeningId(playlistId),
      () => setError("Could not play that sound — try another file.")
    );
  }

  async function uploadPlaylistSound(playlistId: string, file: File | null) {
    if (!file || !user.isOwner) return;
    setUploadingId(playlistId);
    setUploadPercent(0);
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("playlistId", playlistId);
      form.set("audio", file);
      const { uploadFormData } = await import("@/lib/clientUpload");
      const { ok, data } = await uploadFormData(
        "/api/moon/playlist-sound",
        form,
        { onProgress: setUploadPercent }
      );
      if (!ok) {
        throw new Error(
          (typeof data.error === "string" && data.error) ||
            "Could not upload sound"
        );
      }
      if (data.progress) setProgress(data.progress as typeof progress);
      else if (data.playlistSounds) {
        setProgress((p) => ({
          ...p,
          playlistSounds: data.playlistSounds as typeof p.playlistSounds,
        }));
      }
      if (listeningId === playlistId) stopListening();
      setToast("Sound added to this celestial playlist.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      setUploadingId(null);
      setUploadPercent(null);
    }
  }

  async function removeSound(playlistId: string) {
    if (!user.isOwner) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/moon/playlist-sound", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove sound");
      if (data.progress) setProgress(data.progress);
      else if (data.playlistSounds) {
        setProgress((p) => ({ ...p, playlistSounds: data.playlistSounds }));
      }
      if (listeningId === playlistId) stopListening();
      setToast("Sound removed from this playlist.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove sound");
    } finally {
      setBusy(false);
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
          <span>{progress.dreams.length} bottled dreams</span>
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
              Star charts, planet cards, moon journals, brass instruments, sky
              calendars, hanging lanterns, hourglasses, and soft cushions wait
              beside warm blankets. Everything here revolves around real night
              skies — stars, planets, and quiet watching.
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
                <img src={brightStar.image} alt="" className="mm-card-img" />
                <h3>
                  Tonight&apos;s brightest star · {brightStar.emoji}{" "}
                  {brightStar.name}
                </h3>
                <p className="mm-meta">
                  {brightStar.constellationHome} · {brightStar.distanceLy}
                </p>
                <p>{brightStar.summary}</p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setSelectedStar(brightStar.id);
                    setTab("atlas");
                  }}
                >
                  Open Bright Stars
                </button>
              </article>
              <article className="mm-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={MOON_ART.dreams} alt="" className="mm-card-img" />
                <h3>Dream Archive</h3>
                <p>
                  Anonymous dreams sealed like folded pages in glass bottles —
                  imagination only, no interpretation.
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setTab("dreams")}
                >
                  Browse dreams
                </button>
              </article>
              <article className="mm-card">
                <h3>🪐 Today&apos;s planet · {planet.name}</h3>
                <p className="mm-meta">{planet.type}</p>
                <p>{planet.summary}</p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setSelectedPlanet(planet.id);
                    setTab("facts");
                  }}
                >
                  Planet facts
                </button>
              </article>
              <article className="mm-card">
                <h3>📅 Sky Calendar</h3>
                {happeningNow.length ? (
                  <p>
                    Happening now: {happeningNow.map((e) => e.title).join(" · ")}
                  </p>
                ) : (
                  <p>
                    Next up: {upcomingEvents[0]?.title || "Check the calendar"}{" "}
                    {upcomingEvents[0]?.peakNote
                      ? `(${upcomingEvents[0].peakNote})`
                      : ""}
                  </p>
                )}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setTab("calendar")}
                >
                  Open schedule
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
            <h2>Bright Stars</h2>
            <p className="mm-section-lead">
              Real stars for tonight&apos;s sky — distance, type, and when to
              look. No astrology, only astronomy.
            </p>
            <div className="mm-chip-row">
              {NIGHT_STARS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={openStar.id === s.id ? "active" : ""}
                  onClick={() => setSelectedStar(s.id)}
                >
                  {s.emoji} {s.name}
                </button>
              ))}
            </div>
            <article className="mm-feature-card mm-constellation-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={openStar.image} alt="" className="mm-feature-img" />
              <div>
                <h3>
                  {openStar.emoji} {openStar.name}
                </h3>
                <p className="mm-meta">
                  Home · {openStar.constellationHome} · {openStar.distanceLy} ·{" "}
                  {openStar.spectralType}
                </p>
                <p>{openStar.summary}</p>
                <h4>When to look</h4>
                <p>{openStar.whenToLook}</p>
                <h4>Facts</h4>
                <ul className="mm-steps">
                  {openStar.facts.map((f) => (
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
              Astronomy wonders — stars, planets, moons, meteors, and quiet
              discoveries. Science only.
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

            <h3 className="mm-subhead">Planet guide</h3>
            <div className="mm-chip-row">
              {PLANETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={openPlanet.id === p.id ? "active" : ""}
                  onClick={() => setSelectedPlanet(p.id)}
                >
                  {p.emoji} {p.name}
                </button>
              ))}
            </div>
            <article className="mm-feature-card">
              <div>
                <h3>
                  {openPlanet.emoji} {openPlanet.name}
                </h3>
                <p className="mm-meta">{openPlanet.type}</p>
                <p>{openPlanet.summary}</p>
                <ul className="mm-steps">
                  {openPlanet.facts.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            </article>

            <h3 className="mm-subhead">More sky facts</h3>
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

        {tab === "calendar" && (
          <section className="mm-section">
            <h2>Sky Calendar</h2>
            <p className="mm-section-lead">
              Real upcoming space events — meteor showers, eclipses, and planet
              tips. Dates are UTC calendar guides; check a local almanac for exact
              timing where you stand.
            </p>
            {happeningNow.length ? (
              <article className="mm-feature-card">
                <div>
                  <p className="mm-meta">Happening now</p>
                  <ul className="mm-steps">
                    {happeningNow.map((ev) => (
                      <li key={ev.id}>
                        <strong>
                          {ev.emoji} {ev.title}
                        </strong>{" "}
                        — {ev.body}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ) : null}
            <div className="mm-grid">
              {upcomingEvents.map((ev) => (
                <article key={ev.id} className="mm-card">
                  <h3>
                    {ev.emoji} {ev.title}
                  </h3>
                  <p className="mm-meta">
                    {ev.startDate === ev.endDate
                      ? ev.startDate
                      : `${ev.startDate} → ${ev.endDate}`}
                    {ev.peakNote ? ` · ${ev.peakNote}` : ""}
                  </p>
                  <p className="mm-meta">
                    {ev.kind === "meteor-shower"
                      ? "Meteor shower"
                      : ev.kind === "lunar-eclipse"
                        ? "Lunar eclipse"
                        : ev.kind === "solar-eclipse"
                          ? "Solar eclipse"
                          : ev.kind === "planet"
                            ? "Planet tip"
                            : "Sky event"}
                  </p>
                  <p>{ev.body}</p>
                </article>
              ))}
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
              {user.isOwner
                ? " As owner, you can add an audio file to each playlist."
                : " Press play when a soft sound has been tucked into a card."}
            </p>
            <div className="mm-grid">
              {CELESTIAL_PLAYLISTS.map((pl) => {
                const on = listeningId === pl.id;
                const soundUrl = progress.playlistSounds[pl.id];
                const hasSound = Boolean(soundUrl);
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
                    <p className="mm-meta">
                      {hasSound ? "Sound ready" : "Waiting for a sound"}
                    </p>
                    {hasSound ? (
                      // eslint-disable-next-line jsx-a11y/media-has-caption
                      <audio
                        className="mm-audio"
                        controls
                        loop
                        preload="none"
                        src={soundUrl}
                      />
                    ) : null}
                    <button
                      type="button"
                      className={on ? "btn-primary" : "btn-secondary"}
                      disabled={!hasSound}
                      onClick={() => toggleListening(pl.id)}
                    >
                      {on ? "Stop listening" : "Begin listening"}
                    </button>
                    {user.isOwner ? (
                      <div className="mm-owner-sound">
                        <label className="mm-upload-label">
                          <span>
                            {uploadingId === pl.id
                              ? uploadPercent != null
                                ? `Uploading ${uploadPercent}%…`
                                : "Uploading…"
                              : hasSound
                                ? "Replace sound"
                                : "Add sound"}
                          </span>
                          <input
                            type="file"
                            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/mp4,audio/x-m4a,audio/aac,.mp3,.wav,.ogg,.m4a,.aac,.webm"
                            disabled={busy}
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              e.target.value = "";
                              void uploadPlaylistSound(pl.id, file);
                            }}
                          />
                        </label>
                        {uploadingId === pl.id && uploadPercent != null ? (
                          <div
                            className="mh-upload-meter"
                            role="progressbar"
                            aria-valuenow={uploadPercent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <span style={{ width: `${uploadPercent}%` }} />
                          </div>
                        ) : null}
                        {hasSound ? (
                          <button
                            type="button"
                            className="btn-secondary"
                            disabled={busy}
                            onClick={() => void removeSound(pl.id)}
                          >
                            Remove sound
                          </button>
                        ) : null}
                      </div>
                    ) : null}
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
                <h3>Tonight&apos;s brightest star</h3>
                <p>
                  {inspStar.emoji} {inspStar.name}
                </p>
                <p className="mm-meta">
                  {inspStar.constellationHome} · {inspStar.distanceLy}
                </p>
                <p>{inspStar.summary}</p>
              </article>
              <article className="mm-card">
                <h3>Today&apos;s planet</h3>
                <p>
                  {inspPlanet.emoji} {inspPlanet.name}
                </p>
                <p className="mm-meta">{inspPlanet.type}</p>
                <p>{inspPlanet.summary}</p>
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
