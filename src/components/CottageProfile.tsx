"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CottageView } from "@/lib/cottageState";
import type { FriendshipRelation } from "@/lib/letters";
import type { UserPublic } from "@/lib/types";
import type { CollectibleKind, VillageInfo } from "@/lib/villages";
import {
  buildJourneyMilestones,
  buildVillagerAchievements,
  collectibleEmoji,
  collectibleImage,
  collectibleLabel,
  getVillagerHomeTheme,
  goalProgressValue,
  showcaseCollectibles,
  villagerTitleFor,
  villagerXpProgress,
} from "@/lib/villagerHome";
import { ProfileActions } from "@/components/ProfileActions";
import { CharacterPortrait } from "@/components/CharacterPortrait";
import {
  characterLabel,
  parseVillagerCharacter,
} from "@/lib/villageCharacters";
import type { VillageId } from "@/lib/villages";

type HomeTab = "home" | "journey" | "collectables" | "goals";

const TABS: Array<{ id: HomeTab; label: string }> = [
  { id: "home", label: "Home" },
  { id: "journey", label: "Journey" },
  { id: "collectables", label: "Collectables" },
  { id: "goals", label: "Goals" },
];

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function ringStyle(pct: number, color: string): Record<string, string> {
  const p = Math.max(0, Math.min(100, pct));
  return {
    background: `conic-gradient(${color} ${p * 3.6}deg, rgba(120, 100, 70, 0.18) 0deg)`,
  };
}

export function CottageProfile({
  profile,
  village,
  collectibles,
  isSelf,
  relation,
  initialCottage,
  letterCount: letterCountProp,
  activityCount = 0,
  tvCount = 0,
}: {
  profile: UserPublic;
  village: VillageInfo | null;
  collectibles: Record<CollectibleKind, number>;
  isSelf: boolean;
  relation: FriendshipRelation;
  initialCottage: CottageView;
  letterCount?: number;
  activityCount?: number;
  tvCount?: number;
}) {
  const [tab, setTab] = useState<HomeTab>("home");
  const theme = getVillagerHomeTheme(village?.id);
  const character = parseVillagerCharacter(
    profile.characterJson,
    (profile.homeVillageId || profile.villageId || village?.id || null) as
      | VillageId
      | null
  );
  const charMeta = character ? characterLabel(character) : null;
  const letterCount = letterCountProp ?? initialCottage.letterCount ?? 0;
  const collectibleCount = useMemo(
    () =>
      (Object.values(collectibles) as number[]).reduce(
        (sum, n) => sum + (n > 0 ? 1 : 0),
        0
      ),
    [collectibles]
  );
  const memoryCount = initialCottage.memories?.length || 0;
  const xp = villagerXpProgress(profile.reputation);
  const title = villagerTitleFor(theme, profile.reputation);
  const cottageName =
    initialCottage.cottageName || `${profile.displayName}'s Cottage`;

  const journey = useMemo(
    () =>
      buildJourneyMilestones({
        theme,
        createdAt: profile.createdAt,
        letterCount,
        collectibleCount,
        reputation: profile.reputation,
        cottageNamed: Boolean(initialCottage.cottageName),
        memoryCount,
      }),
    [
      theme,
      profile.createdAt,
      letterCount,
      collectibleCount,
      profile.reputation,
      initialCottage.cottageName,
      memoryCount,
    ]
  );

  const achievements = useMemo(
    () =>
      buildVillagerAchievements({
        theme,
        letterCount,
        collectibleCount,
        reputation: profile.reputation,
        tvWatched: tvCount,
      }),
    [theme, letterCount, collectibleCount, profile.reputation, tvCount]
  );

  const showcase = useMemo(
    () => showcaseCollectibles(theme.id, collectibles, 5),
    [theme.id, collectibles]
  );

  const goalStats = {
    letterCount,
    collectibleCount,
    activityCount,
    tvCount,
    reputation: profile.reputation,
  };
  const currentGoal = theme.goals[0];
  const goalValue = currentGoal
    ? goalProgressValue(currentGoal.metric, goalStats)
    : 0;
  const goalPct = currentGoal
    ? Math.min(100, Math.round((goalValue / Math.max(1, currentGoal.target)) * 100))
    : 0;

  const progressItems = [
    {
      key: "activities",
      label: "Activities",
      emoji: "🌿",
      value: activityCount,
      total: 20,
    },
    {
      key: "letters",
      label: "Letters",
      emoji: "✉️",
      value: letterCount,
      total: 20,
    },
    {
      key: "shows",
      label: "Shows",
      emoji: "📺",
      value: tvCount,
      total: 15,
    },
    {
      key: "collectables",
      label: "Collectables",
      emoji: "🧺",
      value: collectibleCount,
      total: Math.max(5, showcase.length + collectibleCount),
    },
  ];

  const cssVars = {
    ["--pc-accent" as string]: theme.accent,
    ["--pc-soft" as string]: theme.soft,
    ["--pc-deep" as string]: theme.deep,
    ["--pc-cream" as string]: theme.cream,
    ["--pc-ink" as string]: theme.ink,
    ["--pc-gold" as string]: theme.gold,
  };

  const doneJourney = journey.filter((m) => m.done);
  const journeyList = (tab === "journey" ? journey : doneJourney.slice(0, 5))
    .length
    ? tab === "journey"
      ? journey
      : doneJourney.slice(0, 5)
    : journey.slice(0, 4);

  return (
    <div className={`pc-home village-${theme.id}`} style={cssVars}>
      <div className="pc-shell">
        <div className="pc-toolbar">
          <Link href={village ? `/village` : "/"} className="pc-back">
            ← Back to Village
          </Link>
        </div>

        <section className="pc-hero" aria-label={`${theme.label} personal cottage`}>
          <div className="pc-hero-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={theme.heroImage}
              alt={`${theme.label} cottage — ${cottageName}`}
              className="pc-hero-art"
              draggable={false}
            />
            <div className="pc-hero-vignette" aria-hidden />
            <div className="pc-hero-label" aria-hidden>
              <span>{theme.emoji}</span> {cottageName}
            </div>
            <div className="pc-hero-hotspots" aria-hidden>
              <button type="button" className="pc-hotspot pc-hotspot-a" title="Bookshelf — View your books">
                <span>📚</span>
                <em>Bookshelf</em>
              </button>
              <button type="button" className="pc-hotspot pc-hotspot-b" title="Mailbox — Letters">
                <span>📮</span>
                <em>Mailbox</em>
              </button>
              <button type="button" className="pc-hotspot pc-hotspot-c" title="Favorite corner">
                <span>{theme.emoji}</span>
                <em>Corner</em>
              </button>
            </div>
          </div>

          <div className="pc-identity">
            <div className="pc-avatar-wrap">
              {character ? (
                <CharacterPortrait
                  character={character}
                  size="md"
                  className="pc-avatar-character"
                  decorative
                />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={theme.mascotImage}
                    alt=""
                    className="pc-avatar"
                    draggable={false}
                  />
                  <span className="pc-avatar-fallback" aria-hidden>
                    {initialsFor(profile.displayName)}
                  </span>
                </>
              )}
            </div>
            <div className="pc-identity-copy">
              <h1 className="pc-name">{profile.displayName}</h1>
              <p className="pc-village-line">
                <span aria-hidden>{theme.emoji}</span> {theme.label}
                {charMeta ? (
                  <>
                    {" "}
                    · {charMeta.emoji} {charMeta.speciesName}
                  </>
                ) : null}{" "}
                · {title}
              </p>
              <div className="pc-level-row">
                <strong>Level {xp.level}</strong>
                <div
                  className="pc-xp-bar"
                  role="progressbar"
                  aria-valuenow={xp.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${xp.current} of ${xp.needed} XP`}
                >
                  <span style={{ width: `${xp.percent}%` }} />
                </div>
                <em>
                  {xp.current} / {xp.needed} XP
                </em>
              </div>
              {isSelf ? (
                <p className="pc-character-link">
                  <Link href="/character">Customize character</Link>
                </p>
              ) : null}
            </div>
            {isSelf ? null : (
              <div className="pc-identity-actions">
                <ProfileActions username={profile.username} relation={relation} />
              </div>
            )}
          </div>
        </section>

        <nav className="pc-tabs" aria-label="Cottage sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`pc-tab ${tab === t.id ? "is-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="pc-body">
          {(tab === "home" || tab === "journey" || tab === "goals") && (
            <div
              className={`pc-split ${
                tab === "home" ? "" : "is-solo"
              }`.trim()}
            >
              {(tab === "home" || tab === "journey") && (
                <section className="pc-card pc-journey" aria-labelledby="pc-journey-h">
                  <h2 id="pc-journey-h">My Journey</h2>
                  <ul className="pc-journey-list">
                    {journeyList.map((m) => (
                      <li
                        key={m.id}
                        className={m.done ? "is-done" : "is-waiting"}
                      >
                        <span className="pc-check" aria-hidden>
                          {m.done ? "✓" : "○"}
                        </span>
                        <div>
                          <strong>{m.title}</strong>
                          <p>{m.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {tab === "home" ? (
                    <button
                      type="button"
                      className="pc-text-link"
                      onClick={() => setTab("journey")}
                    >
                      View full journey →
                    </button>
                  ) : null}
                </section>
              )}

              {(tab === "home" || tab === "goals") && currentGoal ? (
                <section className="pc-card pc-goal" aria-labelledby="pc-goal-h">
                  <h2 id="pc-goal-h">Current Goal</h2>
                  <div className="pc-goal-body">
                    <div className="pc-goal-copy">
                      <h3>
                        <span aria-hidden>{currentGoal.emoji}</span>{" "}
                        {currentGoal.title}
                      </h3>
                      <p>{currentGoal.description}</p>
                      <div className="pc-goal-meter">
                        <div
                          className="pc-xp-bar pc-goal-bar"
                          role="progressbar"
                          aria-valuenow={goalPct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <span style={{ width: `${goalPct}%` }} />
                        </div>
                        <em>
                          {Math.min(goalValue, currentGoal.target)} /{" "}
                          {currentGoal.target}
                        </em>
                      </div>
                      <button
                        type="button"
                        className="pc-goal-btn"
                        onClick={() => setTab("goals")}
                      >
                        View Goal
                      </button>
                    </div>
                    <div className="pc-goal-art" aria-hidden>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={theme.mascotImage} alt="" draggable={false} />
                    </div>
                  </div>
                  {tab === "goals"
                    ? theme.goals.slice(1).map((goal) => {
                        const value = goalProgressValue(goal.metric, goalStats);
                        const pct = Math.min(
                          100,
                          Math.round((value / Math.max(1, goal.target)) * 100)
                        );
                        return (
                          <div key={goal.id} className="pc-goal-extra">
                            <strong>
                              {goal.emoji} {goal.title}
                            </strong>
                            <p>{goal.description}</p>
                            <div className="pc-xp-bar pc-goal-bar">
                              <span style={{ width: `${pct}%` }} />
                            </div>
                            <em>
                              {Math.min(value, goal.target)} / {goal.target}
                            </em>
                          </div>
                        );
                      })
                    : null}
                </section>
              ) : null}
            </div>
          )}

          {(tab === "home" || tab === "collectables") && (
            <section className="pc-card pc-collectables" aria-labelledby="pc-col-h">
              <div className="pc-section-head">
                <h2 id="pc-col-h">My Collectables</h2>
                <Link href="/village" className="pc-text-link">
                  See all →
                </Link>
              </div>
              <div className="pc-shelf" role="list">
                {showcase.map(({ kind, count }) => (
                  <div
                    key={kind}
                    className={`pc-collectable ${count > 0 ? "is-found" : "is-mystery"}`}
                    role="listitem"
                    title={
                      count > 0
                        ? collectibleLabel(kind)
                        : "Something is waiting to be discovered."
                    }
                  >
                    <div className="pc-collectable-disc">
                      {count > 0 ? (
                        collectibleImage(kind) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={collectibleImage(kind)}
                            alt=""
                            draggable={false}
                          />
                        ) : (
                          <span aria-hidden>{collectibleEmoji(kind)}</span>
                        )
                      ) : (
                        <span aria-hidden>🔒</span>
                      )}
                    </div>
                    <em>
                      {count > 0 ? collectibleLabel(kind) : "Mystery"}
                    </em>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === "home" ? (
            <section className="pc-card pc-progress" aria-labelledby="pc-prog-h">
              <h2 id="pc-prog-h">My Progress</h2>
              <div className="pc-progress-row">
                {progressItems.map((item) => {
                  const pct = Math.min(
                    100,
                    Math.round((item.value / Math.max(1, item.total)) * 100)
                  );
                  return (
                    <div key={item.key} className="pc-progress-item">
                      <div
                        className="pc-ring"
                        style={ringStyle(pct, theme.accent)}
                        aria-hidden
                      >
                        <span className="pc-ring-inner">{item.emoji}</span>
                      </div>
                      <strong>
                        {item.value}/{item.total}
                      </strong>
                      <em>{item.label}</em>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {(tab === "home" || tab === "journey") && (
            <section className="pc-card pc-achievements" aria-label="Achievements">
              <div className="pc-section-head">
                <h2>Achievements</h2>
              </div>
              <div className="pc-badge-row">
                {achievements.map((a) => (
                  <div
                    key={a.id}
                    className={`pc-badge ${a.unlocked ? "is-unlocked" : "is-locked"}`}
                    title={a.title}
                  >
                    <span aria-hidden>{a.unlocked ? a.emoji : "🔒"}</span>
                    <em>{a.unlocked ? a.title : "Soon"}</em>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === "home" ? (
            <section className="pc-card pc-recent" aria-label="Recent activity">
              <h2>Recent Activity</h2>
              <ul className="pc-recent-list">
                {doneJourney.slice(0, 4).map((m) => (
                  <li key={`act-${m.id}`}>
                    <span aria-hidden>{m.emoji}</span>
                    <strong>{m.title}</strong>
                    <em>{m.dateLabel}</em>
                  </li>
                ))}
                {doneJourney.length === 0 ? (
                  <li className="pc-muted">Your cottage story is just beginning.</li>
                ) : null}
              </ul>
            </section>
          ) : null}

          {tab === "home" ? (
            <section className="pc-card pc-memories" aria-label="Memory wall">
              <h2>Memory Wall</h2>
              <div className="pc-memory-board">
                {(initialCottage.memories?.length
                  ? initialCottage.memories.slice(0, 4)
                  : [
                      {
                        id: "welcome-memory",
                        emoji: theme.firstGift.emoji,
                        title: "First gift",
                        description: `${theme.firstGift.name} waiting on the shelf.`,
                        dateLabel: "Welcome",
                        memoryType: "gift",
                        pinned: true,
                      },
                    ]
                ).map((m) => (
                  <article key={m.id} className="pc-memory-pin">
                    <span aria-hidden>{m.emoji || "💌"}</span>
                    <strong>{m.title}</strong>
                    <p>{m.description}</p>
                    <em>{m.dateLabel}</em>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {tab === "home" ? (
            <footer className="pc-quote">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={theme.mascotImage}
                alt=""
                className="pc-quote-mascot"
                draggable={false}
              />
              <blockquote>
                <p>“{theme.quote}”</p>
                <cite>— {theme.quoteAuthor}</cite>
              </blockquote>
            </footer>
          ) : null}
        </div>
      </div>
    </div>
  );
}
