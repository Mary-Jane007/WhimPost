"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  catalogForVillage,
  cottageCatalogFillPercent,
  MASCOT_LINES,
  nextCatalogUnlocks,
  STORAGE_CATEGORIES,
  TV_LOUNGE_COPY,
  type CottageCatalogItem,
  type CottageTimeOfDay,
  type CottageWeather,
} from "@/lib/cottageCatalog";
import {
  isDecorUnlocked,
  rankProgress,
  unlockHint,
} from "@/lib/cottageDecor";
import type {
  CottageMemory,
  CottagePlacement,
  CottageView,
} from "@/lib/cottageState";
import type { FriendshipRelation } from "@/lib/letters";
import type { UserPublic } from "@/lib/types";
import type { CollectibleKind, VillageInfo } from "@/lib/villages";
import { COLLECTIBLE_META } from "@/lib/villages";
import { CollectibleCottageGlyph, CottageGlyph } from "@/components/CottageGlyph";
import { ProfileActions } from "@/components/ProfileActions";
import { ProfileEditor } from "@/components/ProfileEditor";
import { VillageMascot } from "@/components/VillageMascot";

type Panel =
  | null
  | "inspect"
  | "edit"
  | "journey"
  | "customize"
  | "storage"
  | "memories"
  | "bookshelf"
  | "tv"
  | "welcome";

type ShelfBook = {
  id: string;
  title: string;
  author: string;
  status: "none" | "reading" | "finished" | "wishlist";
};

type DragState = {
  itemId: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
};

function snap(n: number) {
  return Math.min(95, Math.max(5, Math.round(n / 2) * 2));
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
}) {
  const [cottage, setCottage] = useState(initialCottage);
  const [placements, setPlacements] = useState<CottagePlacement[]>(
    initialCottage.placements
  );
  const [selected, setSelected] = useState<CottageCatalogItem | null>(null);
  const [selectedCollectible, setSelectedCollectible] =
    useState<CollectibleKind | null>(null);
  const [panel, setPanel] = useState<Panel>(
    isSelf && !initialCottage.welcomed ? "welcome" : null
  );
  const [customize, setCustomize] = useState(false);
  const [storageCat, setStorageCat] = useState("furniture");
  const [secretNote, setSecretNote] = useState<string | null>(null);
  const [mascotLine, setMascotLine] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);
  const roomRef = useRef<HTMLDivElement | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const villageId = village?.id || cottage.villageId;
  const catalog = useMemo(
    () => catalogForVillage(villageId),
    [villageId]
  );
  const progress = useMemo(
    () => rankProgress(profile.reputation),
    [profile.reputation]
  );
  const fill = useMemo(
    () => cottageCatalogFillPercent(villageId, profile.reputation, collectibles),
    [villageId, profile.reputation, collectibles]
  );
  const upcoming = useMemo(
    () => nextCatalogUnlocks(villageId, profile.reputation, collectibles, 4),
    [villageId, profile.reputation, collectibles]
  );

  const ownedCollectibles = useMemo(
    () =>
      (Object.entries(collectibles) as [CollectibleKind, number][]).filter(
        ([, n]) => n > 0
      ),
    [collectibles]
  );

  const time = cottage.effectiveTime;
  const weather = cottage.effectiveWeather;
  const themeClass = village
    ? `cottage-theme-${village.id}`
    : "cottage-theme-default";

  const persist = useCallback(
    async (patch: Record<string, unknown>) => {
      if (!isSelf) return;
      setSaving(true);
      try {
        const res = await fetch("/api/cottage", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await res.json();
        if (data.cottage) {
          setCottage(data.cottage);
          if (data.cottage.placements) setPlacements(data.cottage.placements);
        }
      } finally {
        setSaving(false);
      }
    },
    [isSelf]
  );

  const scheduleSavePlacements = useCallback(
    (next: CottagePlacement[]) => {
      setPlacements(next);
      if (!isSelf) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void persist({ placements: next });
      }, 450);
    },
    [isSelf, persist]
  );

  function openPanel(next: Panel) {
    setPanel(next);
    if (next !== "inspect") {
      setSelected(null);
      setSelectedCollectible(null);
    }
  }

  function inspectItem(item: CottageCatalogItem) {
    setSelected(item);
    setSelectedCollectible(null);
    setPanel("inspect");
    if (!customize && item.interactive) {
      handleInteractive(item);
    }
  }

  function handleInteractive(item: CottageCatalogItem) {
    if (item.interactive === "bookshelf") {
      setPanel("bookshelf");
      return;
    }
    if (item.interactive === "tv") {
      setPanel("tv");
      return;
    }
    if (item.interactive === "window") {
      setSecretNote(
        time === "night"
          ? "🌙 The moon looks unusually bright tonight."
          : weather === "rain"
            ? "🌧️ Soft rain stitches the glass."
            : "☀️ The path outside looks inviting."
      );
      return;
    }
    if (item.interactive === "chest") {
      setSecretNote(
        profile.reputation >= 160
          ? "A folded note: keep looking behind quiet things."
          : "🔒 Locked. Something waits for a later chapter."
      );
      return;
    }
    if (item.interactive === "hearth") {
      setSecretNote("🔥 The hearth murmurs like an old friend.");
      return;
    }
    if (item.interactive === "mascot" && villageId) {
      const lines = MASCOT_LINES[villageId];
      setMascotLine(lines[Math.floor(Math.random() * lines.length)]);
    }
  }

  function placementFor(itemId: string) {
    return placements.find((p) => p.itemId === itemId);
  }

  function isPlaced(item: CottageCatalogItem) {
    const p = placementFor(item.id);
    if (p) return p.placed;
    return item.unlock.type === "always";
  }

  function onPointerDown(
    e: React.PointerEvent,
    item: CottageCatalogItem,
    unlocked: boolean
  ) {
    if (!customize || !isSelf || !unlocked) return;
    const p = placementFor(item.id);
    if (!p?.placed) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({
      itemId: item.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: p.x,
      origY: p.y,
    });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag || !roomRef.current) return;
    const rect = roomRef.current.getBoundingClientRect();
    const dx = ((e.clientX - drag.startX) / rect.width) * 100;
    const dy = ((e.clientY - drag.startY) / rect.height) * 100;
    const x = snap(drag.origX + dx);
    const y = snap(drag.origY + dy);
    setPlacements((prev) =>
      prev.map((p) => (p.itemId === drag.itemId ? { ...p, x, y } : p))
    );
  }

  function onPointerUp() {
    if (!drag) return;
    setDrag(null);
    setPlacements((latest) => {
      if (isSelf) {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          void persist({ placements: latest });
        }, 200);
      }
      return latest;
    });
  }

  function storeItem(itemId: string) {
    const next = placements.map((p) =>
      p.itemId === itemId ? { ...p, placed: false } : p
    );
    scheduleSavePlacements(next);
  }

  function placeItem(itemId: string) {
    const def = catalog.find((c) => c.id === itemId);
    const next = placements.map((p) =>
      p.itemId === itemId
        ? { ...p, placed: true, x: p.x || def?.x || 50, y: p.y || def?.y || 50 }
        : p
    );
    scheduleSavePlacements(next);
  }

  function rotateItem(itemId: string) {
    const next = placements.map((p) =>
      p.itemId === itemId
        ? { ...p, rotation: (p.rotation + 15) % 360 }
        : p
    );
    scheduleSavePlacements(next);
  }

  function toggleMemoryPin(id: string) {
    const memories = cottage.memories.map((m) =>
      m.id === id ? { ...m, pinned: !m.pinned } : m
    );
    setCottage((c) => ({ ...c, memories }));
    void persist({ memories });
  }

  async function finishWelcome() {
    setPanel(null);
    await persist({ welcomed: true });
    // Gift: ensure wooden lantern / porch lantern is placed if unlocked
    const lantern = placements.find((p) => p.itemId === "lantern");
    if (lantern && !lantern.placed && profile.reputation >= 0) {
      // Place welcome mat emphasis + fern if available
      const next = placements.map((p) =>
        p.itemId === "welcome-mat" || p.itemId === "potted-fern"
          ? { ...p, placed: true }
          : p
      );
      scheduleSavePlacements(next);
    }
    setSecretNote("You received: a warmer welcome mat and a windowsill fern outline.");
  }

  const pinnedMemories = cottage.memories.filter((m) => m.pinned).slice(0, 4);

  return (
    <div
      className={`cottage-profile personal-cottage ${themeClass} time-${time} weather-${weather} ${
        customize ? "is-customizing" : ""
      }`}
    >
      <div className="cottage-topbar">
        <div className="cottage-nameplate">
          <p className="cottage-kicker">
            {isSelf ? "🏡 Personal Cottage" : "Visiting cottage"}
          </p>
          <h1>{cottage.cottageName || profile.displayName}</h1>
          <p className="cottage-handle">
            @{profile.username}
            {profile.forestName ? ` · “${profile.forestName}”` : ""}
            {profile.isOwner ? " · Owner" : ""}
          </p>
          {cottage.signText ? (
            <p className="cottage-sign">“{cottage.signText}”</p>
          ) : null}
        </div>

        <div className="cottage-meter">
          <div className="cottage-meter-head">
            <span>
              {progress.current.emoji} {cottage.stage.label}
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
          <p className="cottage-meter-hint">{cottage.stage.blurb}</p>
        </div>
      </div>

      <div className="cottage-stats-row" aria-label="Cottage stats">
        <span>📨 {cottage.letterCount} letters</span>
        <span>⭐ {cottage.discoveryCount} discoveries</span>
        <span>
          {time === "day" ? "☀️" : time === "evening" ? "🌇" : "🌙"} {time}
        </span>
        <span>
          {weather === "sunny"
            ? "☀️"
            : weather === "rain"
              ? "🌧️"
              : weather === "snow"
                ? "❄️"
                : weather === "fog"
                  ? "🌫️"
                  : weather === "wind"
                    ? "🌬️"
                    : "☁️"}{" "}
          {weather}
        </span>
        {saving ? <em className="cottage-saving">Saving…</em> : null}
      </div>

      <div className="cottage-stage">
        <div
          className="cottage-room"
          aria-label="Cottage interior"
          ref={roomRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="cottage-back-wall" />
          <div className="cottage-floor" />
          <div className="cottage-window-pane" aria-hidden>
            <div className="cottage-sky" />
            <div className="cottage-weather-fx" />
            <div className="cottage-window-glow" />
          </div>
          <div className="cottage-mantel-shelf" aria-hidden />
          {time !== "day" ? <div className="cottage-lamp-glow" aria-hidden /> : null}
          {time === "night" ? <div className="cottage-starfield" aria-hidden /> : null}

          {/* Memory wall cards */}
          <div className="cottage-memory-wall" aria-label="Memory wall">
            {pinnedMemories.map((m) => (
              <button
                key={m.id}
                type="button"
                className="cottage-memory-card"
                onClick={() => openPanel("memories")}
              >
                <span aria-hidden>{m.emoji}</span>
                <strong>{m.title}</strong>
                <em>{m.dateLabel}</em>
              </button>
            ))}
          </div>

          {/* Collectible shelf strip */}
          <div className="cottage-keepsake-shelf" aria-label="Keepsake shelf">
            {ownedCollectibles.slice(0, 8).map(([kind]) => (
              <button
                key={kind}
                type="button"
                className="cottage-keepsake-btn"
                onClick={() => {
                  setSelectedCollectible(kind);
                  setSelected(null);
                  setPanel("inspect");
                }}
                aria-label={COLLECTIBLE_META[kind].name}
              >
                <CollectibleCottageGlyph kind={kind} size="sm" />
              </button>
            ))}
          </div>

          {catalog.map((item) => {
            const unlocked = isDecorUnlocked(
              item,
              profile.reputation,
              collectibles
            );
            const p = placementFor(item.id);
            const placed = unlocked && (p?.placed ?? item.unlock.type === "always");
            if (!placed && !(customize && unlocked)) {
              // Show locked ghosts only in customize / always show locked outlines lightly
              if (!unlocked) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`cottage-decor cottage-decor-${item.size} cottage-layer-${item.layer} is-locked`}
                    style={{ left: `${item.x}%`, top: `${item.y}%` }}
                    onClick={() => inspectItem(item)}
                    aria-label={`${item.name}, locked — ${unlockHint(item)}`}
                  >
                    <CottageGlyph
                      emoji={item.emoji}
                      image={item.image}
                      size={item.size === "lg" ? "lg" : item.size === "sm" ? "sm" : "md"}
                      locked
                    />
                  </button>
                );
              }
              return null;
            }
            if (!placed && customize && unlocked) return null;

            const x = p?.x ?? item.x;
            const y = p?.y ?? item.y;
            const rot = p?.rotation ?? 0;
            const fav =
              cottage.favoriteItemId === item.id || Boolean(p?.favorite);

            return (
              <button
                key={item.id}
                type="button"
                className={`cottage-decor cottage-decor-${item.size} cottage-layer-${item.layer} is-unlocked ${
                  selected?.id === item.id ? "is-selected" : ""
                } ${fav ? "is-favorite-decor" : ""} ${
                  item.interactive === "hearth" ? "cottage-hearth-live" : ""
                }`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, -50%) rotate(${rot}deg)`,
                }}
                onClick={() => inspectItem(item)}
                onPointerDown={(e) => onPointerDown(e, item, unlocked)}
                aria-label={`${item.name}, unlocked`}
              >
                <CottageGlyph
                  emoji={item.emoji}
                  image={item.image}
                  label={item.name}
                  size={item.size === "lg" ? "lg" : item.size === "sm" ? "sm" : "md"}
                  favorite={fav}
                />
              </button>
            );
          })}

          <button
            type="button"
            className="cottage-plaque"
            onClick={() => {
              if (isSelf) openPanel("edit");
            }}
            aria-label={isSelf ? "Edit cottage plaque" : "Read cottage plaque"}
          >
            <strong>{profile.displayName}</strong>
            <span>
              {cottage.description
                ? cottage.description.length > 100
                  ? `${cottage.description.slice(0, 100)}…`
                  : cottage.description
                : profile.bio
                  ? profile.bio.length > 90
                    ? `${profile.bio.slice(0, 90)}…`
                    : profile.bio
                  : isSelf
                    ? "Tap to describe your cottage"
                    : "The plaque is still blank"}
            </span>
          </button>

          {village && (
            <button
              type="button"
              className="cottage-village-badge cottage-mascot-hotspot"
              title="Home village mascot"
              onClick={() => {
                const lines = MASCOT_LINES[village.id];
                setMascotLine(lines[Math.floor(Math.random() * lines.length)]);
              }}
            >
              <VillageMascot village={village} size="sm" />
              <span>
                Home · {village.name}
                {visitingVillage ? ` · visiting ${visitingVillage.name}` : ""}
              </span>
            </button>
          )}

          {mascotLine && village ? (
            <div className="cottage-mascot-bubble" role="status">
              <VillageMascot village={village} size="sm" />
              <p>{mascotLine}</p>
              <button type="button" onClick={() => setMascotLine(null)}>
                ✕
              </button>
            </div>
          ) : null}

          {secretNote ? (
            <div className="cottage-secret-note" role="status">
              <p>{secretNote}</p>
              <button type="button" onClick={() => setSecretNote(null)}>
                Close
              </button>
            </div>
          ) : null}
        </div>

        <aside className="cottage-sidepanel">
          {panel === "welcome" && isSelf ? (
            <div className="cottage-inspect cottage-welcome-onboard">
              <p className="cottage-inspect-kicker">Welcome home</p>
              <h2>🏡 Your cottage is waiting</h2>
              <p>
                Every villager deserves a little place to call their own. This
                room will gather your letters, discoveries, and quiet memories.
              </p>
              {village ? (
                <p className="cottage-mascot-intro">
                  <VillageMascot village={village} size="md" />
                  <span>
                    {MASCOT_LINES[village.id][0]}
                  </span>
                </p>
              ) : null}
              <p className="muted">You received: Wooden welcome warmth</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => void finishWelcome()}
              >
                Explore My Cottage
              </button>
            </div>
          ) : panel === "inspect" && selectedCollectible ? (
            <div className="cottage-inspect">
              <p className="cottage-inspect-kicker">Keepsake</p>
              <h2>
                <CollectibleCottageGlyph
                  kind={selectedCollectible}
                  size="lg"
                />{" "}
                {COLLECTIBLE_META[selectedCollectible].name}
              </h2>
              <p>
                Found along the WhimPost path
                {village ? ` in ${village.name}` : ""}.
              </p>
              <p className="muted">
                You hold {collectibles[selectedCollectible]} · max{" "}
                {COLLECTIBLE_META[selectedCollectible].max}
              </p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSelectedCollectible(null);
                  setPanel(null);
                }}
              >
                Close
              </button>
            </div>
          ) : panel === "inspect" && selected ? (
            <div className="cottage-inspect">
              <p className="cottage-inspect-kicker">
                {isDecorUnlocked(selected, profile.reputation, collectibles)
                  ? "On display"
                  : "Empty outline"}
              </p>
              <h2>
                <CottageGlyph
                  emoji={selected.emoji}
                  image={selected.image}
                  size="lg"
                  locked={
                    !isDecorUnlocked(selected, profile.reputation, collectibles)
                  }
                />{" "}
                {selected.name}
              </h2>
              <p>{selected.lore}</p>
              {!isDecorUnlocked(selected, profile.reputation, collectibles) && (
                <p className="cottage-unlock-tip">{unlockHint(selected)}</p>
              )}
              {isSelf &&
              isDecorUnlocked(selected, profile.reputation, collectibles) ? (
                <div className="cottage-inspect-actions">
                  {isPlaced(selected) ? (
                    <>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => storeItem(selected.id)}
                      >
                        Store
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => rotateItem(selected.id)}
                      >
                        Rotate
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() =>
                          void persist({ favoriteItemId: selected.id })
                        }
                      >
                        Favorite
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => placeItem(selected.id)}
                    >
                      Place in room
                    </button>
                  )}
                </div>
              ) : null}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSelected(null);
                  setPanel(null);
                }}
              >
                Close
              </button>
            </div>
          ) : panel === "edit" && isSelf ? (
            <div className="cottage-inspect cottage-edit-wrap">
              <button
                type="button"
                className="cottage-panel-close"
                onClick={() => setPanel(null)}
              >
                ← Back to room
              </button>
              <CottageIdentityEditor
                cottage={cottage}
                onSave={async (patch) => {
                  await persist(patch);
                  setPanel(null);
                }}
              />
              <ProfileEditor user={profile} />
            </div>
          ) : panel === "journey" ? (
            <div className="cottage-inspect">
              <p className="cottage-inspect-kicker">Journey ledger</p>
              <h2>Still growing…</h2>
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
                      <button type="button" onClick={() => inspectItem(d)}>
                        <CottageGlyph emoji={d.emoji} image={d.image} size="sm" />
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
                onClick={() => setPanel(null)}
              >
                Close
              </button>
            </div>
          ) : panel === "storage" && isSelf ? (
            <CottageStoragePanel
              catalog={catalog}
              placements={placements}
              reputation={profile.reputation}
              collectibles={collectibles}
              category={storageCat}
              onCategory={setStorageCat}
              onPlace={placeItem}
              onClose={() => setPanel(null)}
            />
          ) : panel === "memories" ? (
            <div className="cottage-inspect">
              <p className="cottage-inspect-kicker">Memory wall</p>
              <h2>Pinned moments</h2>
              <ul className="cottage-memory-list">
                {cottage.memories.map((m: CottageMemory) => (
                  <li key={m.id} className={m.pinned ? "is-pinned" : ""}>
                    <span aria-hidden>{m.emoji}</span>
                    <div>
                      <strong>{m.title}</strong>
                      <p>{m.description}</p>
                      <em>{m.dateLabel}</em>
                    </div>
                    {isSelf ? (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => toggleMemoryPin(m.id)}
                      >
                        {m.pinned ? "Unpin" : "Pin"}
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPanel(null)}
              >
                Close
              </button>
            </div>
          ) : panel === "bookshelf" ? (
            <div className="cottage-inspect">
              <p className="cottage-inspect-kicker">My Bookshelf</p>
              <h2>Pages at home</h2>
              {shelfBooks.length === 0 ? (
                <p>
                  {villageId === "mosshollow"
                    ? "Visit the Library reading list to fill this shelf."
                    : "Books you love can rest here — Mosshollow's Library holds the widest shelf."}
                </p>
              ) : (
                <ul className="cottage-book-list">
                  {shelfBooks.map((b) => (
                    <li key={b.id}>
                      <strong>{b.title}</strong>
                      <span>{b.author}</span>
                      <em>{b.status}</em>
                    </li>
                  ))}
                </ul>
              )}
              {villageId === "mosshollow" || profile.isOwner ? (
                <Link href="/library?tab=readinglist" className="btn-primary">
                  Open Library shelf
                </Link>
              ) : null}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPanel(null)}
              >
                Close
              </button>
            </div>
          ) : panel === "tv" && villageId ? (
            <div className="cottage-inspect">
              <p className="cottage-inspect-kicker">Cottage television</p>
              <h2>{TV_LOUNGE_COPY[villageId].title}</h2>
              <p>Now playing: {TV_LOUNGE_COPY[villageId].nowPlaying}</p>
              <p className="muted">
                Opens WhimPost TV Corner for your village lounge.
              </p>
              <Link href="/tv-corner" className="btn-primary">
                Watch in TV Corner
              </Link>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPanel(null)}
              >
                Close
              </button>
            </div>
          ) : panel === "customize" && isSelf ? (
            <CottageCustomizePanel
              cottage={cottage}
              onTime={(mode) => void persist({ timeMode: mode })}
              onWeather={(mode) => void persist({ weatherMode: mode })}
              onDone={() => {
                setCustomize(false);
                setPanel(null);
              }}
            />
          ) : (
            <div className="cottage-inspect cottage-welcome">
              <p className="cottage-inspect-kicker">Look around</p>
              <h2>
                {fill < 25
                  ? "A little cottage beginning"
                  : fill < 60
                    ? "Coming into bloom"
                    : fill < 100
                      ? "Almost cozy"
                      : "A lived-in home"}
              </h2>
              <p>
                Tap furniture and keepsakes to learn their stories. Customize to
                rearrange your room — this is your place in WhimPost.
              </p>
              {shareVillage && (
                <p className="muted">
                  You share a village — wave from the{" "}
                  <Link href="/meeting-bench">Meeting Bench</Link>.
                </p>
              )}
            </div>
          )}
        </aside>
      </div>

      <div className="cottage-toolbar" role="toolbar" aria-label="Cottage actions">
        {isSelf ? (
          <>
            <button
              type="button"
              className={`cottage-tool ${customize ? "is-active" : ""}`}
              onClick={() => {
                const next = !customize;
                setCustomize(next);
                openPanel(next ? "customize" : null);
              }}
            >
              <span aria-hidden>🎨</span>
              Customize
            </button>
            <button
              type="button"
              className="cottage-tool"
              onClick={() => {
                setCustomize(false);
                openPanel("storage");
              }}
            >
              <span aria-hidden>🎒</span>
              Storage
            </button>
            <button
              type="button"
              className="cottage-tool"
              onClick={() => openPanel("memories")}
            >
              <span aria-hidden>💌</span>
              Memories
            </button>
            <button
              type="button"
              className="cottage-tool"
              onClick={() => openPanel("journey")}
            >
              <span aria-hidden>🗺</span>
              Journey
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
            <button
              type="button"
              className="cottage-tool"
              onClick={() => openPanel("memories")}
            >
              <span aria-hidden>💌</span>
              Memories
            </button>
            <button
              type="button"
              className="cottage-tool"
              onClick={() => openPanel("journey")}
            >
              <span aria-hidden>🗺</span>
              Journey
            </button>
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

function CottageIdentityEditor({
  cottage,
  onSave,
}: {
  cottage: CottageView;
  onSave: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const [name, setName] = useState(cottage.cottageName);
  const [sign, setSign] = useState(cottage.signText);
  const [desc, setDesc] = useState(cottage.description);
  return (
    <form
      className="cottage-identity-form"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave({
          cottageName: name,
          signText: sign,
          description: desc,
        });
      }}
    >
      <p className="cottage-inspect-kicker">Cottage identity</p>
      <label>
        Cottage name
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={64} />
      </label>
      <label>
        Door sign
        <input value={sign} onChange={(e) => setSign(e.target.value)} maxLength={80} />
      </label>
      <label>
        Description
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          maxLength={280}
          rows={3}
        />
      </label>
      <button type="submit" className="btn-primary">
        Save cottage
      </button>
    </form>
  );
}

function CottageStoragePanel({
  catalog,
  placements,
  reputation,
  collectibles,
  category,
  onCategory,
  onPlace,
  onClose,
}: {
  catalog: CottageCatalogItem[];
  placements: CottagePlacement[];
  reputation: number;
  collectibles: Record<CollectibleKind, number>;
  category: string;
  onCategory: (c: string) => void;
  onPlace: (id: string) => void;
  onClose: () => void;
}) {
  const stored = catalog.filter((item) => {
    if (item.category !== category) return false;
    const unlocked = isDecorUnlocked(item, reputation, collectibles);
    const p = placements.find((x) => x.itemId === item.id);
    return unlocked && p && !p.placed;
  });
  const locked = catalog.filter(
    (item) =>
      item.category === category &&
      !isDecorUnlocked(item, reputation, collectibles)
  );

  return (
    <div className="cottage-inspect cottage-storage-panel">
      <p className="cottage-inspect-kicker">🎒 Cottage Storage</p>
      <h2>Kept for later</h2>
      <div className="cottage-storage-cats">
        {STORAGE_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={category === c.id ? "is-active" : ""}
            onClick={() => onCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <ul className="cottage-storage-list">
        {stored.map((item) => (
          <li key={item.id}>
            <CottageGlyph emoji={item.emoji} image={item.image} size="sm" />
            <div>
              <strong>{item.name}</strong>
              <p>{item.lore}</p>
            </div>
            <button type="button" className="btn-primary" onClick={() => onPlace(item.id)}>
              Place
            </button>
          </li>
        ))}
        {locked.slice(0, 6).map((item) => (
          <li key={item.id} className="is-locked-row">
            <CottageGlyph emoji={item.emoji} locked size="sm" />
            <div>
              <strong>🔒 {item.name}</strong>
              <p className="muted">{unlockHint(item)}</p>
            </div>
          </li>
        ))}
        {stored.length === 0 && locked.length === 0 ? (
          <li>Nothing stored in this drawer.</li>
        ) : null}
      </ul>
      <button type="button" className="btn-secondary" onClick={onClose}>
        Close
      </button>
    </div>
  );
}

function CottageCustomizePanel({
  cottage,
  onTime,
  onWeather,
  onDone,
}: {
  cottage: CottageView;
  onTime: (mode: "auto" | CottageTimeOfDay) => void;
  onWeather: (mode: "auto" | CottageWeather) => void;
  onDone: () => void;
}) {
  return (
    <div className="cottage-inspect">
      <p className="cottage-inspect-kicker">Customize</p>
      <h2>Arrange your home</h2>
      <p>Drag unlocked furniture in the room. Snap gently to the floorboards.</p>
      <div className="cottage-env-controls">
        <p>Light</p>
        <div className="cottage-chip-row">
          {(["auto", "day", "evening", "night"] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={cottage.timeMode === t ? "is-active" : ""}
              onClick={() => onTime(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <p>Weather</p>
        <div className="cottage-chip-row">
          {(
            ["auto", "sunny", "rain", "cloudy", "fog", "snow", "wind"] as const
          ).map((w) => (
            <button
              key={w}
              type="button"
              className={cottage.weatherMode === w ? "is-active" : ""}
              onClick={() => onWeather(w)}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
      <button type="button" className="btn-primary" onClick={onDone}>
        Done arranging
      </button>
    </div>
  );
}
