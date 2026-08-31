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
  SHARED_FEATURES,
  VILLAGE_WORKSHOPS,
  type VillageId,
} from "@/lib/villages";
import { VillageJoinPicker } from "@/components/VillageJoinPicker";
import { VillageChangePanel } from "@/components/VillageChangePanel";
import { BelongingRetakePanel } from "@/components/BelongingRetakePanel";
import { NoticeBoard } from "@/components/NoticeBoard";
import { CollectibleIcon } from "@/components/CollectibleIcon";
import { PageCrest } from "@/components/PageCrest";
import { WelcomeLetterEditor } from "@/components/WelcomeLetterEditor";
import { WelcomeLetterModal } from "@/components/WelcomeLetterModal";
import { LostChronicles } from "@/components/LostChronicles";
import { ChronicleAdminEditor } from "@/components/ChronicleAdminEditor";
import { VillageTasksAdminEditor } from "@/components/VillageTasksAdminEditor";
import { LibraryAdminEditor } from "@/components/LibraryAdminEditor";
import { MeetingBenchTeaser } from "@/components/MeetingBenchTeaser";
import { VillageMascot } from "@/components/VillageMascot";
import {
  deliverWelcomeLetter,
  getUnreadWelcomeLetter,
} from "@/lib/welcomeLetters";
import { markUnlocksSeen } from "@/lib/notifications";
import { getChronicleProgress } from "@/lib/chronicle";
import { getMeetingBenchTeaser } from "@/lib/meetingBench";
import {
  getBookClubRotation,
  listClubBooks,
  listReadingListBooks,
} from "@/lib/libraryBooks";
import { villageSkyAlertEvents } from "@/lib/moonContent";
import { MoonmereSkyEventPopup } from "@/components/MoonmereSkyEventPopup";

export default async function VillagePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = getDb();
  markUnlocksSeen(db, user.id);
  const stats = getUserVillageStats(db, user.id);

  if (!stats.villageId) {
    return (
      <main className="app-main forest-panel">
        <VillageJoinPicker />
      </main>
    );
  }

  const village = getVillage(stats.villageId)!;
  const homeVillageId = (stats.homeVillageId || stats.villageId) as VillageId;
  const homeVillage = getVillage(homeVillageId)!;
  const isAway = homeVillageId !== stats.villageId;
  deliverWelcomeLetter(db, user.id, stats.villageId);
  // Re-read after welcome gifts so collectibles (and cottage unlocks) are current.
  const liveStats = getUserVillageStats(db, user.id);
  const welcomeLetter = getUnreadWelcomeLetter(db, user.id, stats.villageId);
  const villageRep = getVillageReputation(db, stats.villageId);
  const members = getVillageMemberCount(db, stats.villageId);
  const unlock = villageUnlockLevel(villageRep);
  const nextRank =
    RANK_LADDER.find((r) => r.minRep > liveStats.reputation) || null;
  const chronicleProgress = getChronicleProgress(
    user.id,
    stats.villageId as VillageId
  );
  const meetingBenchTeaser = getMeetingBenchTeaser(village.id);

  const neighbors = db
    .prepare(
      `SELECT id, username, display_name, bio, forest_name, created_at, is_owner,
              village_id, home_village_id, reputation
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
    home_village_id: string | null;
    reputation: number;
  }>;

  const noteRows = db
    .prepare(
      `SELECT n.id, n.body, n.anonymous, n.image_url, n.created_at,
              u.id as uid, u.username, u.display_name, u.bio, u.forest_name,
              u.created_at as ucreated, u.is_owner, u.village_id, u.reputation
       FROM village_notes n
       JOIN users u ON u.id = n.author_id
       WHERE n.village_id = ?
       ORDER BY n.created_at DESC
       LIMIT 40`
    )
    .all(stats.villageId) as Array<{
    id: string;
    body: string;
    anonymous: number;
    image_url: string | null;
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
    imageUrl: r.image_url || null,
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
    "Village bunting",
    "Visiting wildlife",
    "Special building glow",
  ];

  const moonmereSkyAlerts =
    village.id === "moonmere" && homeVillageId === "moonmere" && !welcomeLetter
      ? villageSkyAlertEvents()
      : [];

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
              : village.id === "moonmere"
                ? ["moon-full", "moon-crescent", "butterfly-green"]
                : village.id === "bramblewood"
                  ? ["fox-seated", "pinecone", "candle-jar"]
                  : village.id === "hearthwick"
                    ? ["candle-jar", "jam-jar", "leafy-branch"]
                    : ["fox-seated", "mushroom-amanita", "moon-full"]
        }
        villageStickers={
          village.id === "clovermeadow"
            ? ["bow-pink", "butterfly-iridescent", "cherries-gingham"]
            : village.id === "moonmere"
              ? [
                  { village: "moonmere", id: "moon-full" },
                  { village: "moonmere", id: "luna-moth" },
                  { village: "moonmere", id: "fairy-moon" },
                ]
              : village.id === "bramblewood"
                ? [
                    { village: "bramblewood", id: "fox-face" },
                    { village: "bramblewood", id: "monarch" },
                    { village: "bramblewood", id: "maple-branch" },
                  ]
                : village.id === "hearthwick"
                  ? [
                      { village: "hearthwick", id: "hedgehog" },
                      { village: "hearthwick", id: "potion-bottles" },
                      { village: "hearthwick", id: "lavender-bouquet" },
                    ]
                  : undefined
        }
      />
      {welcomeLetter ? <WelcomeLetterModal letter={welcomeLetter} /> : null}
      {moonmereSkyAlerts.length ? (
        <MoonmereSkyEventPopup events={moonmereSkyAlerts} />
      ) : null}

      <header className="village-hero">
        <VillageMascot village={village} size="lg" />
        <div>
          <p className="hero-postmark">
            {isAway
              ? `Visiting · home is ${homeVillage.name}`
              : `${village.mascotName} watches over your home`}
          </p>
          <h1>{village.name}</h1>
          <p className="village-home-badge-row" aria-label="Belonging">
            {isAway ? (
              <>
                <span className="village-status-chip visiting">Visiting</span>
                <span className="village-status-chip home">
                  Home · {homeVillage.name}
                </span>
              </>
            ) : (
              <span className="village-status-chip home">Your home village</span>
            )}
          </p>
          <p className="village-motto">“{village.motto}”</p>
          <p>{village.theme}</p>
        </div>
      </header>

      <div className="village-stats">
        <div>
          <strong>
            {liveStats.rank.emoji} {liveStats.rank.label}
          </strong>
          <span>Your forest rank · {liveStats.reputation} personal reputation</span>
          {nextRank && (
            <em>
              {nextRank.minRep - liveStats.reputation} more to become {nextRank.label}
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
          {SHARED_FEATURES.map((f) =>
            f.href ? (
              <Link key={f.name} href={f.href} className="feature-chip">
                <span aria-hidden>{f.emoji}</span>
                {f.name}
              </Link>
            ) : (
              <div key={f.name} className="feature-chip">
                <span aria-hidden>{f.emoji}</span>
                {f.name}
              </div>
            )
          )}
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
        {(() => {
          const workshop = VILLAGE_WORKSHOPS[village.id];
          const isHomeHere = homeVillageId === village.id;
          const canEnter = isHomeHere || user.isOwner;
          if (canEnter) {
            return (
              <p className="muted" style={{ marginTop: "0.85rem" }}>
                <Link href={workshop.href} className="btn-primary">
                  {workshop.enterLabel}
                </Link>
              </p>
            );
          }
          return (
            <p className="muted" style={{ marginTop: "0.85rem" }}>
              {workshop.buildingName} belongs only to {village.name} — it stays
              with this village and is never relocated.
            </p>
          );
        })()}
      </section>

      <LostChronicles
        villageId={village.id}
        initialProgress={chronicleProgress}
      />

      <section className="village-panel">
        <h2>Who belongs here</h2>
        <ul className="belong-list">
          {village.belongs.map((b) => (
            <li key={b}>{b}</li>
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
          Keepsakes unique to {village.name} — your welcome satchel starts the
          shelf; write letters and welcome friends to gather more.
        </p>
        <div className="collectible-grid">
          {collectiblesForVillage(village.id).map((key) => {
            const meta = COLLECTIBLE_META[key];
            const have = liveStats.collectibles[key] || 0;
            return (
              <div key={key} className="collectible-chip">
                <CollectibleIcon kind={key} />
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

      <MeetingBenchTeaser teaser={meetingBenchTeaser} isOwner={user.isOwner} />

      <section className="village-panel">
        <h2>Neighbors on the path</h2>
        <p className="section-lead">Villagers sharing {village.name} with you</p>
        {neighbors.length === 0 ? (
          <p className="muted">
            You&apos;re the first here for now. Invite friends — when they join{" "}
            {village.name}, they&apos;ll appear here.
          </p>
        ) : (
          <ul className="user-list">
            {neighbors.map((n) => {
              const neighbor = mapUser(n);
              return (
                <li key={neighbor.id}>
                  <div>
                    <Link
                      href={`/profile/${neighbor.username}`}
                      className="user-link"
                    >
                      <strong>{neighbor.displayName}</strong>
                    </Link>
                    <span>@{neighbor.username}</span>
                    <em>{neighbor.reputation} rep</em>
                  </div>
                  <div className="row-actions">
                    <Link
                      className="btn-secondary"
                      href={`/profile/${neighbor.username}`}
                    >
                      Profile
                    </Link>
                    <Link
                      className="btn-secondary"
                      href={`/compose?to=${neighbor.username}`}
                    >
                      Write
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {user.isOwner ? (
        <>
          <section className="oa-owner-launch forest-cardish" aria-label="Owner analytics">
            <h2>🏡 Owner Analytics</h2>
            <p>
              Private control room for WhimPost — users, villages, letters, TV Corner,
              health, and what to improve next.
            </p>
            <Link className="btn-primary" href="/admin/analytics">
              Open owner analytics
            </Link>
          </section>
          <WelcomeLetterEditor
            initialVillageId={stats.villageId as VillageId}
          />
          <div style={{ marginTop: "0.75rem" }}>
            <VillageTasksAdminEditor
              initialVillageId={stats.villageId as VillageId}
            />
          </div>
          <div style={{ marginTop: "0.75rem" }}>
            <ChronicleAdminEditor
              initialVillageId={stats.villageId as VillageId}
            />
          </div>
          {/* Library tools stay in Mosshollow only — never on other village squares. */}
          {village.id === "mosshollow" ? (
            <div style={{ marginTop: "0.75rem" }}>
              <LibraryAdminEditor
                clubBooks={listClubBooks()}
                readingList={listReadingListBooks()}
                daysUntilShuffle={getBookClubRotation().daysUntilShuffle}
                returnTo="/village"
              />
            </div>
          ) : null}
        </>
      ) : null}

      <VillageChangePanel
        currentVillageId={stats.villageId as VillageId}
        homeVillageId={homeVillageId}
        currentVillageName={village.name}
        homeVillageName={homeVillage.name}
        isAway={isAway}
      />
      <BelongingRetakePanel homeVillageName={homeVillage.name} />
    </main>
  );
}
