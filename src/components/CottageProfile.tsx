"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  COTTAGE_DECOR,
  cottageFillPercent,
  isDecorUnlocked,
  nextUnlocks,
  rankProgress,
  unlockHint,
  type CottageDecorDef,
} from "@/lib/cottageDecor";
import type { FriendshipRelation } from "@/lib/letters";
import type { UserPublic } from "@/lib/types";
import type { CollectibleKind, VillageInfo } from "@/lib/villages";
import { ProfileActions } from "@/components/ProfileActions";
import { ProfileEditor } from "@/components/ProfileEditor";
import { VillageMascot } from "@/components/VillageMascot";

export function CottageProfile({
  profile,
  village,
  collectibles,
  isSelf,
  relation,
  shareVillage,
}: {
  profile: UserPublic;
  village: VillageInfo | null;
  collectibles: Record<CollectibleKind, number>;
  isSelf: boolean;
  relation: FriendshipRelation;
  shareVillage: boolean;
}) {
  const [selected, setSelected] = useState<CottageDecorDef | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showJourney, setShowJourney] = useState(false);

  const progress = useMemo(
    () => rankProgress(profile.reputation),
    [profile.reputation]
  );
  const fill = useMemo(
    () => cottageFillPercent(profile.reputation, collectibles),
    [profile.reputation, collectibles]
  );
  const upcoming = useMemo(
    () => nextUnlocks(profile.reputation, collectibles, 4),
    [profile.reputation, collectibles]
  );

  const themeClass = village
    ? `cottage-theme-${village.id}`
    : "cottage-theme-default";

  function inspect(decor: CottageDecorDef) {
    setSelected(decor);
    setShowEdit(false);
    setShowJourney(false);
  }

  return (
    <div className={`cottage-profile ${themeClass}`}>
      <div className="cottage-topbar">
        <div className="cottage-nameplate">
          <p className="cottage-kicker">
            {isSelf ? "Your cottage" : "Visiting cottage"}
          </p>
          <h1>{profile.displayName}</h1>
          <p className="cottage-handle">
            @{profile.username}
            {profile.forestName ? ` · “${profile.forestName}”` : ""}
            {profile.isOwner ? " · Owner" : ""}
          </p>
        </div>

        <div className="cottage-meter">
          <div className="cottage-meter-head">
            <span>
              {progress.current.emoji} {progress.current.label}
            </span>
            <em>{fill}% furnished</em>
          </div>
          <div
            className="cottage-meter-bar"
            role="progressbar"
            aria-valuenow={fill}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Cottage furnishings"
          >
            <span style={{ width: `${fill}%` }} />
          </div>
          <p className="cottage-meter-hint">
            {progress.next
              ? `${progress.next.minRep - profile.reputation} rep to ${progress.next.label}`
              : "Every shelf is glowing."}
          </p>
        </div>
      </div>

      <div className="cottage-stage">
        <div className="cottage-room" aria-label="Cottage interior">
          <div className="cottage-back-wall" />
          <div className="cottage-floor" />
          <div className="cottage-window-glow" aria-hidden />
          <div className="cottage-mantel-shelf" aria-hidden />

          {/* Empty ghost outlines for locked pieces sit behind unlocked ones */}
          {COTTAGE_DECOR.map((decor) => {
            const unlocked = isDecorUnlocked(
              decor,
              profile.reputation,
              collectibles
            );
            return (
              <button
                key={decor.id}
                type="button"
                className={`cottage-decor cottage-decor-${decor.size} cottage-layer-${decor.layer} ${
                  unlocked ? "is-unlocked" : "is-locked"
                } ${selected?.id === decor.id ? "is-selected" : ""}`}
                style={{ left: `${decor.x}%`, top: `${decor.y}%` }}
                onClick={() => inspect(decor)}
                aria-label={
                  unlocked
                    ? `${decor.name}, unlocked`
                    : `${decor.name}, locked — ${unlockHint(decor)}`
                }
              >
                <span className="cottage-decor-glyph" aria-hidden>
                  {unlocked ? decor.emoji : "·"}
                </span>
                {!unlocked && (
                  <span className="cottage-decor-ghost" aria-hidden>
                    {decor.emoji}
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            className="cottage-plaque"
            onClick={() => {
              setSelected(null);
              setShowJourney(false);
              if (isSelf) setShowEdit(true);
            }}
            aria-label={isSelf ? "Edit cottage plaque" : "Read cottage plaque"}
          >
            <strong>{profile.displayName}</strong>
            <span>
              {profile.bio
                ? profile.bio.length > 90
                  ? `${profile.bio.slice(0, 90)}…`
                  : profile.bio
                : isSelf
                  ? "Tap to write on your plaque"
                  : "The plaque is still blank"}
            </span>
          </button>

          {village && (
            <div className="cottage-village-badge">
              <VillageMascot village={village} size="sm" />
              <span>{village.name}</span>
            </div>
          )}
        </div>

        <aside className="cottage-sidepanel">
          {selected ? (
            <div className="cottage-inspect">
              <p className="cottage-inspect-kicker">
                {isDecorUnlocked(selected, profile.reputation, collectibles)
                  ? "On display"
                  : "Empty outline"}
              </p>
              <h2>
                <span aria-hidden>{selected.emoji}</span> {selected.name}
              </h2>
              <p>{selected.lore}</p>
              {!isDecorUnlocked(selected, profile.reputation, collectibles) && (
                <p className="cottage-unlock-tip">{unlockHint(selected)}</p>
              )}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          ) : showEdit && isSelf ? (
            <div className="cottage-inspect cottage-edit-wrap">
              <button
                type="button"
                className="cottage-panel-close"
                onClick={() => setShowEdit(false)}
              >
                ← Back to room
              </button>
              <ProfileEditor user={profile} />
            </div>
          ) : showJourney ? (
            <div className="cottage-inspect">
              <p className="cottage-inspect-kicker">Journey ledger</p>
              <h2>Still empty…</h2>
              <p>
                {isSelf
                  ? "Write letters, welcome friends, and gather keepsakes to furnish this room."
                  : "This villager is still filling their cottage."}
              </p>
              <ul className="cottage-journey-list">
                {upcoming.length === 0 ? (
                  <li>Nothing left to unlock — what a home.</li>
                ) : (
                  upcoming.map((d) => (
                    <li key={d.id}>
                      <button type="button" onClick={() => inspect(d)}>
                        <span aria-hidden>{d.emoji}</span>
                        <strong>{d.name}</strong>
                        <em>{unlockHint(d)}</em>
                      </button>
                    </li>
                  ))
                )}
              </ul>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowJourney(false)}
              >
                Close
              </button>
            </div>
          ) : (
            <div className="cottage-inspect cottage-welcome">
              <p className="cottage-inspect-kicker">Look around</p>
              <h2>
                {fill < 25
                  ? "Mostly empty walls"
                  : fill < 60
                    ? "Coming into bloom"
                    : fill < 100
                      ? "Almost cozy"
                      : "A lived-in cottage"}
              </h2>
              <p>
                Tap the dusty outlines to see what&apos;s waiting. Furnishings
                appear as this villager&apos;s journey grows.
              </p>
              {shareVillage && (
                <p className="muted">
                  You share a village — wave from the{" "}
                  <Link href="/meeting-bench">Meeting Bench</Link>, or visit
                  neighbors from the{" "}
                  <Link href="/village">Village Square</Link>.
                </p>
              )}
            </div>
          )}
        </aside>
      </div>

      <div className="cottage-toolbar" role="toolbar" aria-label="Cottage actions">
        <button
          type="button"
          className="cottage-tool"
          onClick={() => {
            setShowEdit(false);
            setSelected(null);
            setShowJourney(true);
          }}
        >
          <span aria-hidden>🗺</span>
          Journey
        </button>

        {isSelf ? (
          <>
            <button
              type="button"
              className="cottage-tool"
              onClick={() => {
                setSelected(null);
                setShowJourney(false);
                setShowEdit(true);
              }}
            >
              <span aria-hidden>🪶</span>
              Edit plaque
            </button>
            <Link href="/compose" className="cottage-tool cottage-tool-primary">
              <span aria-hidden>✉</span>
              Write
            </Link>
            <Link href="/village" className="cottage-tool">
              <span aria-hidden>{village?.mascot || "🏡"}</span>
              Village
            </Link>
          </>
        ) : (
          <>
            <div className="cottage-tool-actions">
              <ProfileActions username={profile.username} relation={relation} />
            </div>
            {village && (
              <Link href="/village" className="cottage-tool">
                <span aria-hidden>{village.mascot}</span>
                Village
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
