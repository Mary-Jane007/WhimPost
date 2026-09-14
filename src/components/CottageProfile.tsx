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
import { CollectibleIcon } from "@/components/CollectibleIcon";
import { CottageRoomEditor } from "@/components/CottageRoomEditor";
import { ProfileActions } from "@/components/ProfileActions";

type ShelfBook = {
  id: string;
  title: string;
  author: string;
  status: "none" | "reading" | "finished" | "wishlist";
};

type HomeTab = "home" | "journey" | "collectables" | "goals" | "customize";

const TABS: Array<{ id: HomeTab; label: string }> = [
  { id: "home", label: "Home" },
  { id: "journey", label: "Journey" },
  { id: "collectables", label: "Collectables" },
  { id: "goals", label: "Goals" },
  { id: "customize", label: "Customize" },
];

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function deriveRecentActivity(input: {
  letterCount: number;
  collectibleCount: number;
  memoryCount: number;
  cottageName: string;
  themeLabel: string;
}) {
  const items: Array<{ emoji: string; title: string; detail: string }> = [];
  if (input.letterCount > 0) {
    items.push({
      emoji: "✉️",
      title: "Letters sent from the cottage",
      detail: `${input.letterCount} letter${input.letterCount === 1 ? "" : "s"} so far`,
    });
  }
  if (input.collectibleCount > 0) {
    items.push({
      emoji: "🧺",
      title: "Keepsakes brought home",
      detail: `${input.collectibleCount} discovery${input.collectibleCount === 1 ? "" : "ies"} on the shelves`,
    });
  }
  if (input.memoryCount > 0) {
    items.push({
      emoji: "💌",
      title: "Memories on the wall",
      detail: `${input.memoryCount} pinned moment${input.memoryCount === 1 ? "" : "s"}`,
    });
  }
  items.push({
    emoji: "🏡",
    title: input.cottageName || "Personal cottage",
    detail: `Settled in ${input.themeLabel}`,
  });
  return items.slice(0, 5);
}

export function CottageProfile({
  profile,
  village,
  visitingVillage = null,
  collectibles,
  isSelf,
  relation,
  shareVillage,
  initialCottage,
  shelfBooks = [],
  letterCount: letterCountProp,
  activityCount = 0,
  tvCount = 0,
}: {
  profile: UserPublic;
  village: VillageInfo | null;
  visitingVillage?: VillageInfo | null;
  collectibles: Record<CollectibleKind, number>;
  isSelf: boolean;
  relation: FriendshipRelation;
  shareVillage: boolean;
  initialCottage: CottageView;
  shelfBooks?: ShelfBook[];
  letterCount?: number;
  activityCount?: number;
  tvCount?: number;
}) {
  const [tab, setTab] = useState<HomeTab>("home");
  const theme = getVillagerHomeTheme(village?.id);
  const letterCount = letterCountProp ?? initialCottage.letterCount ?? 0;
  const collectibleCount = useMemo(
    () =>
      (Object.values(collectibles) as number[]).reduce(
        (sum, n) => sum + (n > 0 ? n : 0),
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

  const recent = deriveRecentActivity({
    letterCount,
    collectibleCount,
    memoryCount,
    cottageName,
    themeLabel: theme.label,
  });

  const cssVars = {
    ["--vh-accent" as string]: theme.accent,
    ["--vh-soft" as string]: theme.soft,
    ["--vh-deep" as string]: theme.deep,
    ["--vh-cream" as string]: theme.cream,
    ["--vh-ink" as string]: theme.ink,
    ["--vh-gold" as string]: theme.gold,
  };

  const editorProps = {
    profile,
    village,
    visitingVillage,
    collectibles,
    isSelf,
    relation,
    shareVillage,
    initialCottage,
    shelfBooks,
  };

  return (
    <div
      className={`villager-home village-${theme.id}`}
      style={cssVars}
      data-village={theme.id}
    >
      <header className="vh-header-card">
        <div className="vh-avatar" aria-hidden>
          {theme.mascotImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={theme.mascotImage}
              alt=""
              className="vh-avatar-mascot"
              draggable={false}
            />
          ) : (
            <span className="vh-avatar-fallback">
              {initialsFor(profile.displayName)}
            </span>
          )}
        </div>
        <div className="vh-header-copy">
          <p className="vh-kicker">
            {isSelf ? "Your Personal Cottage" : "Visiting a villager"}
          </p>
          <h1 className="vh-display-name">{profile.displayName}</h1>
          <p className="vh-handle">
            @{profile.username}
            {profile.forestName ? ` · “${profile.forestName}”` : ""}
          </p>
          <div className="vh-badges">
            <span className="vh-village-badge">
              <span aria-hidden>{theme.emoji}</span> {theme.label}
            </span>
            <span className="vh-title-badge">{title}</span>
            {visitingVillage ? (
              <span className="vh-visiting-badge">
                Visiting {visitingVillage.name}
              </span>
            ) : null}
          </div>
          <div className="vh-xp-block">
            <div className="vh-xp-head">
              <strong>Level {xp.level}</strong>
              <em>
                {xp.current} / {xp.needed} XP
              </em>
            </div>
            <div
              className="vh-xp-bar"
              role="progressbar"
              aria-valuenow={xp.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Villager experience"
            >
              <span style={{ width: `${xp.percent}%` }} />
            </div>
          </div>
        </div>
        <div className="vh-header-actions">
          {!isSelf ? (
            <ProfileActions username={profile.username} relation={relation} />
          ) : (
            <Link href="/compose" className="vh-write-btn">
              Write a letter
            </Link>
          )}
        </div>
      </header>

      <section className="vh-cottage-hero" aria-label="Personal cottage">
        <div className="vh-hero-atmosphere" aria-hidden />
        <div className="vh-hero-glow" aria-hidden />
        <div className="vh-hero-floor" aria-hidden />
        <div className="vh-hero-stickers" aria-hidden>
          {theme.heroStickers.slice(0, 5).map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              className={`vh-sticker vh-sticker-${i + 1}`}
              draggable={false}
            />
          ))}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={theme.mascotImage}
          alt={theme.mascot}
          className="vh-hero-mascot"
          draggable={false}
        />
        <div className="vh-hero-copy">
          <p className="vh-hero-eyebrow">Personal Cottage</p>
          <h2>{cottageName}</h2>
          <p className="vh-hero-message">{theme.cottageMessage}</p>
          {initialCottage.signText ? (
            <p className="vh-hero-sign">“{initialCottage.signText}”</p>
          ) : null}
        </div>
      </section>

      <nav className="vh-tabs" aria-label="Cottage sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`vh-tab ${tab === t.id ? "is-active" : ""}`}
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "customize" ? (
        <div className="vh-customize-wrap">
          <CottageRoomEditor {...editorProps} embedded />
        </div>
      ) : (
        <div className="vh-body">
          {(tab === "home" || tab === "journey") && (
            <section className="vh-panel vh-journey" aria-labelledby="vh-journey-h">
              <div className="vh-panel-head">
                <h3 id="vh-journey-h">{theme.journeyLabel}</h3>
                <p>{theme.welcome}</p>
              </div>
              <ol className="vh-journey-list">
                {journey.map((m) => (
                  <li
                    key={m.id}
                    className={`vh-journey-item ${m.done ? "is-done" : "is-waiting"}`}
                  >
                    <span className="vh-journey-emoji" aria-hidden>
                      {m.emoji}
                    </span>
                    <div>
                      <strong>{m.title}</strong>
                      <p>{m.description}</p>
                      <em>{m.dateLabel}</em>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {(tab === "home" || tab === "goals") && currentGoal ? (
            <section className="vh-panel vh-goal" aria-labelledby="vh-goal-h">
              <div className="vh-panel-head">
                <h3 id="vh-goal-h">{theme.goalLabel}</h3>
                <p>{theme.progressLabel}</p>
              </div>
              {(tab === "goals" ? theme.goals : [currentGoal]).map((goal) => {
                const value = goalProgressValue(goal.metric, goalStats);
                const pct = Math.min(
                  100,
                  Math.round((value / Math.max(1, goal.target)) * 100)
                );
                return (
                  <div key={goal.id} className="vh-goal-card">
                    <div className="vh-goal-icon" aria-hidden>
                      {goal.emoji}
                    </div>
                    <div className="vh-goal-copy">
                      <strong>{goal.title}</strong>
                      <p>{goal.description}</p>
                      <div className="vh-goal-meter">
                        <span>
                          {Math.min(value, goal.target)} / {goal.target}
                        </span>
                        <div
                          className="vh-xp-bar vh-goal-bar"
                          role="progressbar"
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <span style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          ) : null}

          {tab === "home" ? (
            <section
              className="vh-progress-strip"
              aria-label={theme.progressLabel}
            >
              <div className="vh-stat">
                <span aria-hidden>✉️</span>
                <strong>{letterCount}</strong>
                <em>Letters</em>
              </div>
              <div className="vh-stat">
                <span aria-hidden>🧺</span>
                <strong>{collectibleCount}</strong>
                <em>Collectables</em>
              </div>
              <div className="vh-stat">
                <span aria-hidden>🌿</span>
                <strong>{activityCount}</strong>
                <em>Activities</em>
              </div>
              <div className="vh-stat">
                <span aria-hidden>📺</span>
                <strong>{tvCount}</strong>
                <em>TV Corner</em>
              </div>
              <div className="vh-stat">
                <span aria-hidden>⭐</span>
                <strong>
                  {achievements.filter((a) => a.unlocked).length}
                </strong>
                <em>Achievements</em>
              </div>
            </section>
          ) : null}

          {(tab === "home" || tab === "collectables") && (
            <section
              className="vh-panel vh-collectables"
              aria-labelledby="vh-coll-h"
            >
              <div className="vh-panel-head">
                <h3 id="vh-coll-h">{theme.collectablesLabel}</h3>
                <p>Keepsakes that found their way home.</p>
              </div>
              <ul className="vh-collect-grid">
                {showcase.map(({ kind, count }) => (
                  <li
                    key={kind}
                    className={`vh-collect-item ${count > 0 ? "is-owned" : "is-locked"}`}
                  >
                    {collectibleImage(kind) ? (
                      <CollectibleIcon kind={kind} size="lg" />
                    ) : (
                      <span className="vh-collect-emoji" aria-hidden>
                        {collectibleEmoji(kind)}
                      </span>
                    )}
                    <strong>{collectibleLabel(kind)}</strong>
                    <em>{count > 0 ? `×${count}` : "Waiting"}</em>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(tab === "home" || tab === "collectables") && (
            <section
              className="vh-panel vh-achievements"
              aria-labelledby="vh-ach-h"
            >
              <div className="vh-panel-head">
                <h3 id="vh-ach-h">Achievements</h3>
                <p>Little badges earned along the way.</p>
              </div>
              <ul className="vh-achieve-grid">
                {achievements.map((a) => (
                  <li
                    key={a.id}
                    className={`vh-achieve-item ${a.unlocked ? "is-unlocked" : "is-locked"}`}
                  >
                    <span aria-hidden>{a.emoji}</span>
                    <strong>{a.title}</strong>
                    <em>{a.unlocked ? "Unlocked" : "Still ahead"}</em>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tab === "home" ? (
            <section
              className="vh-panel vh-recent"
              aria-labelledby="vh-recent-h"
            >
              <div className="vh-panel-head">
                <h3 id="vh-recent-h">Recent activity</h3>
                <p>Soft footsteps around the cottage.</p>
              </div>
              <ul className="vh-recent-list">
                {recent.map((item, i) => (
                  <li key={`${item.title}-${i}`}>
                    <span aria-hidden>{item.emoji}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {tab === "home" ? (
            <section
              className="vh-panel vh-memory-wall"
              aria-labelledby="vh-mem-h"
            >
              <div className="vh-panel-head">
                <h3 id="vh-mem-h">Memory wall</h3>
                <p>Moments pinned beside the window.</p>
              </div>
              {initialCottage.memories && initialCottage.memories.length > 0 ? (
                <ul className="vh-memory-grid">
                  {initialCottage.memories.slice(0, 8).map((m) => (
                    <li key={m.id} className="vh-memory-card">
                      <span aria-hidden>{m.emoji}</span>
                      <strong>{m.title}</strong>
                      <p>{m.description}</p>
                      <em>{m.dateLabel}</em>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="vh-empty">
                  The wall is quiet for now — memories will gather here as
                  village life unfolds.
                </p>
              )}
            </section>
          ) : null}

          {tab === "home" ? (
            <footer className="vh-quote">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={theme.mascotImage}
                alt=""
                className="vh-quote-mascot"
                draggable={false}
              />
              <blockquote>
                <p>“{theme.quote}”</p>
                <cite>— {theme.quoteAuthor}</cite>
              </blockquote>
            </footer>
          ) : null}

          {tab === "goals" && !currentGoal ? (
            <p className="vh-empty">No goals yet — explore your village first.</p>
          ) : null}
        </div>
      )}

      {shareVillage && tab === "home" ? (
        <p className="vh-share-note">
          You share a village — wave from the{" "}
          <Link href="/meeting-bench">Meeting Bench</Link>.
        </p>
      ) : null}
    </div>
  );
}
