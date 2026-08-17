"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import type { UserPublic } from "@/lib/types";
import type { WorkshopProgress } from "@/lib/workshop";
import {
  DISCOVERY_COLLECTIONS,
  EXPLORER_PROMPTS,
  LOCAL_WILDLIFE,
  OUTDOOR_SKILLS,
  PLANTS,
  PLANT_TREE_GUIDE,
  RECIPES,
  WOODLAND_ADVENTURES,
  WOODLAND_DIY,
  WORKSHOP_TABS,
  featuredExpedition,
  todaysWoodlandInspiration,
  type WorkshopTabId,
} from "@/lib/workshopContent";
import { OwnerImageAttach } from "@/components/OwnerImageAttach";
import {
  resolveVillageImage,
  villageMediaKey,
  type VillageMediaMap,
} from "@/lib/villageMediaShared";

type Props = {
  user: UserPublic;
  initialProgress: WorkshopProgress;
  initialMedia?: VillageMediaMap;
};

async function uploadPhoto(
  file: File,
  onProgress?: (percent: number) => void
) {
  const form = new FormData();
  form.append("image", file);
  const { uploadFormData } = await import("@/lib/clientUpload");
  const { ok, data } = await uploadFormData("/api/uploads", form, {
    onProgress,
  });
  if (!ok) {
    throw new Error(
      (typeof data.error === "string" && data.error) || "Upload failed"
    );
  }
  const url = typeof data.url === "string" ? data.url : "";
  if (!url) throw new Error("Upload failed");
  return url;
}

export function BramblewoodWorkshop({
  user,
  initialProgress,
  initialMedia = {},
}: Props) {
  const [tab, setTab] = useState<WorkshopTabId>("inspiration");
  const [progress, setProgress] = useState(initialProgress);
  const [media, setMedia] = useState<VillageMediaMap>(initialMedia);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [journalCraftId, setJournalCraftId] = useState("");
  const [journalTitle, setJournalTitle] = useState("");
  const [journalNote, setJournalNote] = useState("");
  const [journalPhoto, setJournalPhoto] = useState<string | null>(null);
  const [journalMarkComplete, setJournalMarkComplete] = useState(true);
  const [journalShareVillage, setJournalShareVillage] = useState(false);
  const [journalUploading, setJournalUploading] = useState(false);
  const [journalUploadPercent, setJournalUploadPercent] = useState<
    number | null
  >(null);
  const [photoUploadPercent, setPhotoUploadPercent] = useState<number | null>(
    null
  );
  const [journalPrompt, setJournalPrompt] = useState<string>(EXPLORER_PROMPTS[0]);
  const fileRef = useRef<HTMLInputElement>(null);
  const journalFileRef = useRef<HTMLInputElement>(null);
  const pendingPhotoKey = useRef<string | null>(null);
  const pendingPhotoKind = useRef<
    | "generic"
    | "diy"
    | "recipe"
    | "quest"
    | "plant"
    | "wildlife"
    | "expedition"
    | null
  >(null);
  const pendingMeta = useRef<Record<string, string | number>>({});

  const inspiration = useMemo(() => todaysWoodlandInspiration(), []);
  const expedition = useMemo(() => featuredExpedition(), []);
  const weeklyDiy = useMemo(() => WOODLAND_DIY[weekDiyIndex()], []);

  function catalogImage(kind: string, id: string, fallback: string) {
    return resolveVillageImage(
      media,
      villageMediaKey("workshop", kind, id),
      fallback
    );
  }

  const todayAnimal =
    LOCAL_WILDLIFE.find((w) => w.id === inspiration.animalId) || LOCAL_WILDLIFE[0];
  const todayPlant =
    PLANT_TREE_GUIDE.find((p) => p.id === inspiration.plantId) || PLANT_TREE_GUIDE[0];
  const todaySkill =
    OUTDOOR_SKILLS.find((s) => s.id === inspiration.skillId) || OUTDOOR_SKILLS[0];
  const todayDiy =
    WOODLAND_DIY.find((d) => d.id === inspiration.diyId) || WOODLAND_DIY[0];

  const adventureDone = WOODLAND_ADVENTURES.filter(
    (a) => progress.questChecks[a.id]
  ).length;
  const adventurePct = Math.round(
    (adventureDone / WOODLAND_ADVENTURES.length) * 100
  );

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
      const { emitChronicleUnlock } = await import("@/lib/chronicleClient");
      emitChronicleUnlock(data.chronicleUnlock);
      setStatus("Saved to your Explorer's Journal");
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
    setPhotoUploadPercent(0);
    setError(null);
    try {
      const url = await uploadPhoto(file, setPhotoUploadPercent);
      const kind = pendingPhotoKind.current;
      const key = pendingPhotoKey.current;
      const meta = pendingMeta.current;

      if (kind === "diy") {
        await postAction({
          type: "complete",
          completeKind: "diy",
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
      } else if (kind === "wildlife") {
        await postAction({
          type: "wildlife",
          wildlifeId: key,
          photoUrl: url,
        });
      } else if (kind === "expedition") {
        await postAction({
          type: "complete",
          completeKind: "expedition",
          id: key,
          photoUrl: url,
        });
      } else {
        await postAction({ type: "photo", key, photoUrl: url });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      pendingPhotoKind.current = null;
      pendingPhotoKey.current = null;
      setBusy(false);
      setPhotoUploadPercent(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onJournalPhoto(file: File | null) {
    if (!file) return;
    setJournalUploading(true);
    setJournalUploadPercent(0);
    setError(null);
    try {
      const url = await uploadPhoto(file, setJournalUploadPercent);
      setJournalPhoto(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setJournalUploading(false);
      setJournalUploadPercent(null);
      if (journalFileRef.current) journalFileRef.current.value = "";
    }
  }

  async function submitJournalEntry(e: FormEvent) {
    e.preventDefault();
    await postAction({
      type: "journalEntry",
      activityId: journalCraftId || undefined,
      activityName: journalTitle || journalPrompt,
      note: journalNote,
      photoUrl: journalPhoto || undefined,
      markCraftComplete: Boolean(journalCraftId) && journalMarkComplete,
      shareWithVillage: journalShareVillage,
    });
    setJournalNote("");
    setJournalPhoto(null);
    setJournalTitle("");
    setJournalCraftId("");
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

      <header className="bw-hero">
        <div>
          <p className="bw-eyebrow">Explorer&apos;s Guild · Bramblewood</p>
          <h1>The Woodland Workshop</h1>
          <p className="bw-quote">
            Close the laptop. Step outside. Come back with a story.
          </p>
          <p className="bw-lead">
            Welcome, {user.displayName}. Adventures for Curaçao, Suriname, and
            the Netherlands — maps, lanterns, and mossy notebooks included.
          </p>
          <div className="bw-xp-row">
            <span>
              {progress.title.emoji} {progress.title.title}
            </span>
            <span>{progress.xp} XP</span>
          </div>
          {progress.badges.length > 0 ? (
            <ul className="bw-badges">
              {progress.badges.slice(0, 8).map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="bw-hero-atelier" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/stickers/villages/bramblewood/fox-sitting.png"
            alt=""
            className="bw-hero-fox"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/stickers/villages/bramblewood/compass.png"
            alt=""
            className="bw-hero-compass"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/stickers/villages/bramblewood/maple-branch.png"
            alt=""
            className="bw-hero-maple"
          />
        </div>
      </header>

      {(status || error) && (
        <p className={error ? "bw-flash error" : "bw-flash"} role="status">
          {error || status}
        </p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={(e) => void onPickFile(e.target.files?.[0] || null)}
      />

      <nav className="bw-tabs" aria-label="Workshop sections">
        {WORKSHOP_TABS.map((t) => (
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

      <div className="bw-panel">
        {tab === "inspiration" && (
          <section className="bw-section">
            <h2>Daily Inspiration</h2>
            <p className="bw-section-lead">
              A soft rotation for today — notice one wild thing, then go outside.
            </p>
            <div className="bw-inspire-grid">
              <article className="bw-card bw-inspire">
                <h3>Today&apos;s Adventure</h3>
                <p>{inspiration.adventure}</p>
              </article>
              <article className="bw-card bw-inspire">
                <h3>Today&apos;s Animal</h3>
                <p>
                  {todayAnimal.emoji} {todayAnimal.name}
                </p>
                <p className="bw-meta">{todayAnimal.countries.join(" · ")}</p>
              </article>
              <article className="bw-card bw-inspire">
                <h3>Today&apos;s Plant</h3>
                <p>
                  {todayPlant.emoji} {todayPlant.name}
                </p>
              </article>
              <article className="bw-card bw-inspire">
                <h3>Today&apos;s Outdoor Skill</h3>
                <p>
                  {todaySkill.emoji} {todaySkill.title}
                </p>
              </article>
              <article className="bw-card bw-inspire">
                <h3>Today&apos;s DIY</h3>
                <p>{todayDiy.title}</p>
              </article>
              <article className="bw-card bw-inspire">
                <h3>Today&apos;s Journal Prompt</h3>
                <p>{inspiration.journalPrompt}</p>
              </article>
              <article className="bw-card bw-inspire quote">
                <h3>Today&apos;s Explorer Quote</h3>
                <p className="bw-handnote">{inspiration.quote}</p>
              </article>
              <article className="bw-card bw-inspire">
                <h3>Today&apos;s Nature Fact</h3>
                <p>{inspiration.natureFact}</p>
              </article>
            </div>
          </section>
        )}

        {tab === "expeditions" && (
          <section className="bw-section">
            <h2>Weekly Expeditions</h2>
            <p className="bw-section-lead">
              A fresh outdoor challenge each week — curiosity over competition.
            </p>
            <article className="bw-card bw-expedition">
              <p className="bw-eyebrow">This week</p>
              <h3>
                <span aria-hidden>{expedition.emoji}</span> {expedition.title}
              </h3>
              <p className="bw-prompt-text">{expedition.challenge}</p>
              <p>{expedition.detail}</p>
              <div className="bw-actions">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={
                    busy || progress.completed[`expedition:${expedition.id}`]
                  }
                  onClick={() =>
                    void postAction({
                      type: "complete",
                      completeKind: "expedition",
                      id: expedition.id,
                    })
                  }
                >
                  {progress.completed[`expedition:${expedition.id}`]
                    ? "Completed this week"
                    : "Mark expedition done"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() => requestPhoto("expedition", expedition.id)}
                >
                  Upload field photo
                </button>
              </div>
              {progress.photos[`expedition:${expedition.id}`] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={progress.photos[`expedition:${expedition.id}`]}
                  alt="Your expedition"
                  className="bw-upload-preview"
                />
              ) : null}
            </article>
          </section>
        )}

        {tab === "adventures" && (
          <section className="bw-section">
            <h2>Woodland Adventures</h2>
            <p className="bw-section-lead">
              Outdoor challenges for Curaçao, Suriname, and the Netherlands ·{" "}
              {adventurePct}% explored
            </p>
            <div className="bw-progress-bar" aria-hidden>
              <span style={{ width: `${adventurePct}%` }} />
            </div>
            <ul className="bw-quest-list">
              {WOODLAND_ADVENTURES.map((a) => (
                <li key={a.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={Boolean(progress.questChecks[a.id])}
                      disabled={busy}
                      onChange={(e) =>
                        void postAction({
                          type: "questToggle",
                          itemId: a.id,
                          checked: e.target.checked,
                        })
                      }
                    />
                    <span aria-hidden>{a.emoji}</span>
                    <span>
                      <strong>{a.label}</strong>
                      <em>{a.hint}</em>
                    </span>
                  </label>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={busy}
                    onClick={() => requestPhoto("quest", a.id)}
                  >
                    Photo
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === "skills" && (
          <section className="bw-section">
            <h2>Outdoor Skills</h2>
            <p className="bw-section-lead">
              Beginner-friendly lessons — rope, maps, weather, and gentle safety.
            </p>
            <div className="bw-grid">
              {OUTDOOR_SKILLS.map((skill) => {
                const done = progress.completed[`skill:${skill.id}`];
                return (
                  <article key={skill.id} className="bw-card skill-card">
                    <h3>
                      <span aria-hidden>{skill.emoji}</span> {skill.title}
                    </h3>
                    <p className="bw-meta">{skill.time}</p>
                    <p>{skill.summary}</p>
                    <ol>
                      {skill.steps.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ol>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={busy || done}
                      onClick={() =>
                        void postAction({
                          type: "complete",
                          completeKind: "skill",
                          id: skill.id,
                        })
                      }
                    >
                      {done ? "Practiced" : "Mark practiced"}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === "diy" && (
          <section className="bw-section">
            <h2>Woodland DIY</h2>
            <p className="bw-section-lead">
              Safe outdoor-inspired crafts — no dangerous tools, only gentle
              making.
            </p>
            <article className="bw-card craft-card bw-featured-diy">
              <div>
                <p className="bw-eyebrow">Featured this week</p>
                <h3>{weeklyDiy.title}</h3>
                <p className="bw-meta">
                  {weeklyDiy.difficulty} · {weeklyDiy.time}
                </p>
                <ul>
                  {weeklyDiy.materials.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
                <ol>
                  {weeklyDiy.instructions.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                <div className="bw-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={
                      busy || progress.completed[`diy:${weeklyDiy.id}`]
                    }
                    onClick={() =>
                      void postAction({
                        type: "complete",
                        completeKind: "diy",
                        id: weeklyDiy.id,
                      })
                    }
                  >
                    {progress.completed[`diy:${weeklyDiy.id}`]
                      ? "Made"
                      : "Mark Complete"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={busy}
                    onClick={() => requestPhoto("diy", weeklyDiy.id)}
                  >
                    Upload finished craft
                  </button>
                </div>
              </div>
              {weeklyDiy.image ? (
                <figure className="bw-recipe-example">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={catalogImage("diy", weeklyDiy.id, weeklyDiy.image)}
                    alt=""
                  />
                  <figcaption>Inspiration</figcaption>
                  {user.isOwner ? (
                    <OwnerImageAttach
                      mediaKey={villageMediaKey("workshop", "diy", weeklyDiy.id)}
                      hasImage={Boolean(
                        media[villageMediaKey("workshop", "diy", weeklyDiy.id)]
                      )}
                      onChanged={setMedia}
                    />
                  ) : null}
                </figure>
              ) : (
                <div className="bw-diy-plate" aria-hidden>
                  🪵
                </div>
              )}
            </article>

            <h3 className="bw-subhead">More woodland crafts</h3>
            <div className="bw-grid">
              {WOODLAND_DIY.map((diy) => {
                const done = progress.completed[`diy:${diy.id}`];
                return (
                  <article key={diy.id} className="bw-card craft-card">
                    {diy.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={catalogImage("diy", diy.id, diy.image)}
                        alt=""
                        className="bw-diy-thumb"
                      />
                    ) : (
                      <div className="bw-diy-plate small" aria-hidden>
                        🪵
                      </div>
                    )}
                    {user.isOwner && diy.image ? (
                      <OwnerImageAttach
                        mediaKey={villageMediaKey("workshop", "diy", diy.id)}
                        hasImage={Boolean(
                          media[villageMediaKey("workshop", "diy", diy.id)]
                        )}
                        onChanged={setMedia}
                      />
                    ) : null}
                    <h3>{diy.title}</h3>
                    <p className="bw-meta">
                      {diy.difficulty} · {diy.time}
                    </p>
                    <details>
                      <summary>Materials &amp; steps</summary>
                      <ul>
                        {diy.materials.map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                      <ol>
                        {diy.instructions.map((s) => (
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
                            completeKind: "diy",
                            id: diy.id,
                          })
                        }
                      >
                        {done ? "Made" : "Mark Complete"}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busy}
                        onClick={() => requestPhoto("diy", diy.id)}
                      >
                        Photo
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === "kitchen" && (
          <section className="bw-section">
            <h2>Cozy Kitchen</h2>
            <p className="bw-section-lead">
              Warm recipes for after the trail — bake, steep, and share.
            </p>
            <div className="bw-grid">
              {RECIPES.map((r) => {
                const done = progress.completed[`recipe:${r.id}`];
                return (
                  <article key={r.id} className="bw-card recipe-card">
                    <div className="bw-recipe-copy">
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
                    </div>
                    <figure className="bw-recipe-example">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={catalogImage("recipe", r.id, r.image)}
                        alt={`Example of finished dish: ${r.title}`}
                      />
                      <figcaption>Inspiration · finished dish</figcaption>
                      {user.isOwner ? (
                        <OwnerImageAttach
                          mediaKey={villageMediaKey("workshop", "recipe", r.id)}
                          hasImage={Boolean(
                            media[villageMediaKey("workshop", "recipe", r.id)]
                          )}
                          onChanged={setMedia}
                        />
                      ) : null}
                    </figure>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === "wildlife" && (
          <section className="bw-section">
            <h2>Local Wildlife</h2>
            <p className="bw-section-lead">
              A pocket field guide for animals you can meet in Curaçao, Suriname,
              or the Netherlands.
            </p>
            <div className="bw-grid birds">
              {LOCAL_WILDLIFE.map((w) => {
                const spotted = progress.birds[w.id]?.spotted;
                const photo = progress.birds[w.id]?.photoUrl;
                return (
                  <article key={w.id} className="bw-card bird-card bw-field-card">
                    <figure className="bw-bird-figure">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          photo ||
                          catalogImage("wildlife", w.id, w.image)
                        }
                        alt={photo ? `Your photo of a ${w.name}` : w.name}
                        className="bw-bird-image"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="bw-field-fallback" aria-hidden>
                        {w.emoji}
                      </div>
                      <figcaption>
                        {spotted ? "Logged in your guide" : "Field guide plate"}
                      </figcaption>
                      {user.isOwner ? (
                        <OwnerImageAttach
                          mediaKey={villageMediaKey(
                            "workshop",
                            "wildlife",
                            w.id
                          )}
                          hasImage={Boolean(
                            media[
                              villageMediaKey("workshop", "wildlife", w.id)
                            ]
                          )}
                          onChanged={setMedia}
                        />
                      ) : null}
                    </figure>
                    <h3>
                      {w.emoji} {w.name}
                    </h3>
                    <p className="bw-meta">{w.countries.join(" · ")}</p>
                    <p>
                      <strong>Habitat:</strong> {w.habitat}
                    </p>
                    <p>
                      <strong>Best time:</strong> {w.bestTime}
                    </p>
                    <ul className="bw-fact-list">
                      {w.facts.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                    <div className="bw-actions">
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={busy || spotted}
                        onClick={() =>
                          void postAction({
                            type: "wildlife",
                            wildlifeId: w.id,
                          })
                        }
                      >
                        {spotted ? "Spotted" : "Log sighting"}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busy}
                        onClick={() => requestPhoto("wildlife", w.id)}
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

        {tab === "flora" && (
          <section className="bw-section">
            <h2>Plant &amp; Tree Guide</h2>
            <p className="bw-section-lead">
              Beginner-friendly flora from Caribbean shores to Dutch woods —
              plus a quiet grow journal.
            </p>
            <div className="bw-grid birds">
              {PLANT_TREE_GUIDE.map((p) => (
                <article key={p.id} className="bw-card bird-card bw-field-card">
                  <figure className="bw-bird-figure">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={catalogImage("flora", p.id, p.image)}
                      alt={p.name}
                      className="bw-bird-image"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="bw-field-fallback" aria-hidden>
                      {p.emoji}
                    </div>
                    <figcaption>Botanical plate</figcaption>
                    {user.isOwner ? (
                      <OwnerImageAttach
                        mediaKey={villageMediaKey("workshop", "flora", p.id)}
                        hasImage={Boolean(
                          media[villageMediaKey("workshop", "flora", p.id)]
                        )}
                        onChanged={setMedia}
                      />
                    ) : null}
                  </figure>
                  <h3>
                    {p.emoji} {p.name}
                  </h3>
                  <p className="bw-meta">{p.countries.join(" · ")}</p>
                  <p>
                    <strong>Habitat:</strong> {p.habitat}
                  </p>
                  <p>
                    <strong>How to recognize:</strong> {p.recognize}
                  </p>
                  <ul className="bw-fact-list">
                    {p.facts.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <h3 className="bw-subhead">Grow Something</h3>
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
          </section>
        )}

        {tab === "collections" && (
          <section className="bw-section">
            <h2>Discovery Collections</h2>
            <p className="bw-section-lead">
              Slow collections that reward curiosity — stamp your finds one by
              one.
            </p>
            <div className="bw-grid">
              {DISCOVERY_COLLECTIONS.map((c) => {
                const count = progress.collections[c.id] || 0;
                const pct = Math.round((count / c.goal) * 100);
                return (
                  <article key={c.id} className="bw-card bw-collection-card">
                    <h3>
                      <span aria-hidden>{c.emoji}</span> {c.title}
                    </h3>
                    <p>{c.blurb}</p>
                    <div className="bw-progress-bar" aria-hidden>
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <p className="bw-meta">
                      {count} / {c.goal} noticed
                    </p>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={busy || count >= c.goal}
                      onClick={() =>
                        void postAction({
                          type: "collectionBump",
                          collectionId: c.id,
                        })
                      }
                    >
                      {count >= c.goal ? "Collection complete" : "I noticed one"}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {tab === "journal" && (
          <section className="bw-section">
            <h2>Explorer&apos;s Journal</h2>
            <p className="bw-section-lead">
              Record adventures, surprises, sounds, and what you want to explore
              next.
            </p>

            <form
              className="bw-card bw-journal-form"
              onSubmit={submitJournalEntry}
            >
              <h3>New journal page</h3>
              <label className="bw-field">
                <span>Prompt</span>
                <select
                  value={journalPrompt}
                  onChange={(e) => {
                    setJournalPrompt(e.target.value);
                    if (!journalTitle) setJournalTitle(e.target.value);
                  }}
                >
                  {EXPLORER_PROMPTS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <label className="bw-field">
                <span>Related DIY (optional)</span>
                <select
                  value={journalCraftId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setJournalCraftId(id);
                    const diy = WOODLAND_DIY.find((c) => c.id === id);
                    if (diy) setJournalTitle(diy.title);
                  }}
                >
                  <option value="">Something else / adventure note</option>
                  {WOODLAND_DIY.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="bw-field">
                <span>Title</span>
                <input
                  type="text"
                  value={journalTitle}
                  onChange={(e) => setJournalTitle(e.target.value)}
                  placeholder="e.g. Mangrove walk at dusk"
                  maxLength={120}
                  required
                />
              </label>
              <label className="bw-field">
                <span>Your adventure note</span>
                <textarea
                  value={journalNote}
                  onChange={(e) => setJournalNote(e.target.value)}
                  placeholder="Where did you go? What surprised you? What animal or sound did you notice?"
                  rows={5}
                  maxLength={2000}
                  required
                />
              </label>
              <div className="bw-photo-drop">
                <p className="bw-photo-drop-title">Field photo</p>
                <input
                  ref={journalFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="bw-photo-input"
                  onChange={(e) =>
                    void onJournalPhoto(e.target.files?.[0] || null)
                  }
                />
                {journalPhoto ? (
                  <div className="bw-photo-chosen">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={journalPhoto}
                      alt="Field photo preview"
                      className="bw-journal-form-preview"
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={busy || journalUploading}
                      onClick={() => journalFileRef.current?.click()}
                    >
                      {journalUploading
                        ? journalUploadPercent != null
                          ? `Uploading ${journalUploadPercent}%…`
                          : "Uploading…"
                        : "Change photo"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="bw-photo-pick-btn"
                    disabled={busy || journalUploading}
                    onClick={() => journalFileRef.current?.click()}
                  >
                    {journalUploading
                      ? journalUploadPercent != null
                        ? `Uploading ${journalUploadPercent}%…`
                        : "Uploading…"
                      : "📷 Choose image from your device"}
                  </button>
                )}
                {journalUploading && journalUploadPercent != null ? (
                  <div
                    className="mh-upload-meter"
                    role="progressbar"
                    aria-valuenow={journalUploadPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span style={{ width: `${journalUploadPercent}%` }} />
                  </div>
                ) : null}
                {busy && photoUploadPercent != null ? (
                  <div
                    className="mh-upload-meter"
                    role="progressbar"
                    aria-valuenow={photoUploadPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span style={{ width: `${photoUploadPercent}%` }} />
                  </div>
                ) : null}
              </div>
              {journalCraftId ? (
                <label className="bw-check">
                  <input
                    type="checkbox"
                    checked={journalMarkComplete}
                    onChange={(e) => setJournalMarkComplete(e.target.checked)}
                  />
                  Also mark this DIY complete (+XP)
                </label>
              ) : null}
              <label className="bw-check">
                <input
                  type="checkbox"
                  checked={journalShareVillage}
                  onChange={(e) => setJournalShareVillage(e.target.checked)}
                />
                Share with the village square
              </label>
              <button
                type="submit"
                className="btn-primary"
                disabled={busy || journalUploading}
              >
                Save to Explorer&apos;s Journal
              </button>
            </form>

            {progress.journal.length === 0 ? (
              <p className="muted">
                Your scrapbook is waiting for its first adventure page.
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
                        alt={`Finished: ${entry.activityName}`}
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
                    <div className="bw-journal-share-row">
                      {entry.shared ? (
                        <em className="bw-shared-tag">
                          Shared on the village square
                        </em>
                      ) : (
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={busy}
                          onClick={() =>
                            void postAction({
                              type: "shareJournal",
                              entryId: entry.id,
                            })
                          }
                        >
                          Share with village square
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function weekDiyIndex() {
  const start = Date.UTC(new Date().getUTCFullYear(), 0, 1);
  const day = Math.floor((Date.now() - start) / 86_400_000);
  return Math.floor(day / 7) % WOODLAND_DIY.length;
}
