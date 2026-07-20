import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, mapUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  getUserVillageStats,
  getVillageMemberCount,
  getVillageReputation,
  villageUnlockLevel,
} from "@/lib/villageProgress";
import {
  COLLECTIBLE_META,
  collectiblesForVillage,
  getVillage,
  RANK_LADDER,
  SEASONAL_EVENTS,
  SHARED_FEATURES,
  type VillageId,
} from "@/lib/villages";
import { VillageJoinPicker } from "@/components/VillageJoinPicker";
import { VillageChangePanel } from "@/components/VillageChangePanel";
import { NoticeBoard } from "@/components/NoticeBoard";
import { PageCrest } from "@/components/PageCrest";
import { WelcomeLetterModal } from "@/components/WelcomeLetterModal";
import { VillageMascot } from "@/components/VillageMascot";
import {
  deliverWelcomeLetter,
  getUnreadWelcomeLetter,
} from "@/lib/welcomeLetters";

export default async function VillagePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  const stats = getUserVillageStats(db, user.id);

  if (!stats.villageId) {
    return (
      <main className="app-main forest-panel">
        <VillageJoinPicker />
      </main>
    );
  }

  const village = getVillage(stats.villageId)!;
  deliverWelcomeLetter(db, user.id, stats.villageId);
  const welcomeLetter = getUnreadWelcomeLetter(db, user.id, stats.villageId);
  const villageRep = getVillageReputation(db, stats.villageId);
  const members = getVillageMemberCount(db, stats.villageId);
  const unlock = villageUnlockLevel(villageRep);
  const nextRank =
    RANK_LADDER.find((r) => r.minRep > stats.reputation) || null;

  const neighbors = db
    .prepare(
      `SELECT id, username, display_name, bio, forest_name, created_at, is_owner,
              village_id, reputation
       FROM users
       WHERE village_id = ? AND id != ?
       ORDER BY reputation DESC, display_name COLLATE NOCASE
       LIMIT 12`
    )
    .all(stats.villageId, user.id) as Array<{
    id: string;
    username: string;
    display_name: string;
    bio: string;
    forest_name: string;
    created_at: string;
    is_owner: number;
    village_id: string | null;
    reputation: number;
  }>;

  const noteRows = db
    .prepare(
      `SELECT n.id, n.body, n.anonymous, n.created_at,
              u.id as uid, u.username, u.display_name, u.bio, u.forest_name,
              u.created_at as ucreated, u.is_owner, u.village_id, u.reputation
       FROM village_notes n
       JOIN users u ON u.id = n.author_id
       WHERE n.village_id = ?
       ORDER BY n.created_at DESC
       LIMIT 30`
    )
    .all(stats.villageId) as Array<{
    id: string;
    body: string;
    anonymous: number;
    created_at: string;
    uid: string;
    username: string;
    display_name: string;
    bio: string;
    forest_name: string;
    ucreated: string;
    is_owner: number;
    village_id: string | null;
    reputation: number;
  }>;

  const notes = noteRows.map((r) => ({
    id: r.id,
    body: r.body,
    anonymous: Boolean(r.anonymous),
    createdAt: r.created_at,
    author: r.anonymous
      ? null
      : {
          displayName: r.display_name,
          username: r.username,
        },
  }));

  const unlockLabels = [
    "Lantern path lit",
    "Seasonal bunting",
    "Visiting wildlife",
    "Special building glow",
  ];

  return (
    <main
      className="app-main forest-panel village-page"
      style={
        {
          "--village-color": village.color,
          "--village-soft": village.colorSoft,
        } as React.CSSProperties
      }
    >
      <PageCrest
        kinds={
          village.id === "clovermeadow"
            ? ["butterfly-green", "gingham-bow", "sunflower"]
            : village.id === "mosshollow"
              ? ["mushroom-amanita", "leafy-branch", "skeleton-key"]
              : ["fox-seated", "mushroom-amanita", "moon-full"]
        }
        villageStickers={
          village.id === "clovermeadow"
            ? ["bow-pink", "butterfly-iridescent", "cherries-gingham"]
            : undefined
        }
      />
      {welcomeLetter ? <WelcomeLetterModal letter={welcomeLetter} /> : null}

      <header className="village-hero">
        <VillageMascot village={village} size="lg" />
        <div>
          <p className="hero-postmark">{village.mascotName} watches over you</p>
          <h1>
            {village.name}
          </h1>
          <p className="village-motto">“{village.motto}”</p>
          <p>{village.theme}</p>
        </div>
      </header>

      <div className="village-stats">
        <div>
          <strong>
            {stats.rank.emoji} {stats.rank.label}
          </strong>
          <span>Your forest rank · {stats.reputation} personal reputation</span>
          {nextRank && (
            <em>
              {nextRank.minRep - stats.reputation} more to become {nextRank.label}
            </em>
          )}
        </div>
        <div>
          <strong>⭐ Village reputation {villageRep}</strong>
          <span>
            {members} villager{members === 1 ? "" : "s"} tending {village.name}
          </span>
          <em>Collaborative — every letter helps the whole village</em>
        </div>
      </div>

      <section className="village-panel">
        <h2>
          {village.buildingEmoji} {village.building}
        </h2>
        <p className="section-lead">Your village&apos;s special heart.</p>
        <div className="village-features">
          {SHARED_FEATURES.map((f) => (
            <div key={f.name} className="feature-chip">
              <span aria-hidden>{f.emoji}</span>
              {f.name}
            </div>
          ))}
        </div>
        <div className="unlock-row">
          {unlockLabels.map((label, i) => (
            <span
              key={label}
              className={`unlock-pill ${unlock > i ? "unlocked" : ""}`}
            >
              {unlock > i ? "✦" : "·"} {label}
            </span>
          ))}
        </div>
      </section>

      <section className="village-panel">
        <h2>Who belongs here</h2>
        <ul className="belong-list">
          {village.belongs.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <h3>Village tasks</h3>
        <ul className="task-list">
          {village.tasks.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="muted">
          Send letters (+3), welcome friends (+5), write long letters (+2 &amp;
          collectibles).
        </p>
        <Link href="/compose" className="btn-primary">
          Write a village letter
        </Link>
      </section>

      <section className="village-panel">
        <h2>Hidden collectibles</h2>
        <p className="section-lead">
          Keepsakes unique to {village.name} — gather them as you write letters
          and welcome friends.
        </p>
        <div className="collectible-grid">
          {collectiblesForVillage(village.id).map((key) => {
            const meta = COLLECTIBLE_META[key];
            const have = stats.collectibles[key] || 0;
            return (
              <div key={key} className="collectible-chip">
                <span className="collectible-emoji" aria-hidden>
                  {meta.emoji}
                </span>
                <strong>{meta.name}</strong>
                <em>
                  {have}/{meta.max}
                </em>
                <div className="collect-bar">
                  <span style={{ width: `${(have / meta.max) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <NoticeBoard initialNotes={notes} />

      <section className="village-panel">
        <h2>🪑 Meeting Bench</h2>
        <p className="section-lead">Neighbors in {village.name}</p>
        {neighbors.length === 0 ? (
          <p className="muted">
            You&apos;re the first here for now. Invite friends — when they join{" "}
            {village.name}, they&apos;ll appear on this bench.
          </p>
        ) : (
          <ul className="user-list">
            {neighbors.map((n) => {
              const neighbor = mapUser(n);
              return (
                <li key={neighbor.id}>
                  <div>
                    <strong>{neighbor.displayName}</strong>
                    <span>@{neighbor.username}</span>
                    <em>{neighbor.reputation} rep</em>
                  </div>
                  <Link
                    className="btn-secondary"
                    href={`/compose?to=${neighbor.username}`}
                  >
                    Write
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="village-panel">
        <h2>Seasonal spirit</h2>
        <div className="season-list">
          {SEASONAL_EVENTS.map((e) => (
            <span key={e}>{e}</span>
          ))}
        </div>
      </section>

      <VillageChangePanel
        currentVillageId={stats.villageId as VillageId}
        currentVillageName={village.name}
      />
    </main>
  );
}
