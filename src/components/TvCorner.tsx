"use client";

import { useEffect, useRef, useState } from "react";
import type { UserPublic } from "@/lib/types";
import type { VillageId } from "@/lib/villages";
import type { TvRoomState, TvVideo } from "@/lib/tvCorner";

type Props = {
  user: UserPublic;
  villageId: VillageId;
  villageName: string;
  mascot: string;
  mascotImage: string | null;
  initialRoom: TvRoomState;
  initialVideos: TvVideo[];
  initialFriendRooms: TvRoomState[];
  friendCount: number;
};

type ScopeTab = "village" | "friends";

const POLL_MS = 1600;
const DRIFT_MS = 900;

function estimatedPositionMs(room: {
  positionMs: number;
  isPlaying: boolean;
  positionUpdatedAt: string;
}) {
  if (!room.isPlaying) return room.positionMs;
  const started = Date.parse(room.positionUpdatedAt.replace(" ", "T") + "Z");
  if (Number.isNaN(started)) return room.positionMs;
  return room.positionMs + Math.max(0, Date.now() - started);
}

const DECOR: Record<
  VillageId,
  { left: string; right: string; shelf: string; idle: string }
> = {
  mosshollow: {
    left: "/stickers/villages/mosshollow/pack/moth.png",
    right: "/stickers/villages/mosshollow/pack/books-stack.png",
    shelf: "/stickers/villages/mosshollow/pack/ink-bottle.png",
    idle: "Quiet library hour — pressed ferns and soft owl dreams.",
  },
  clovermeadow: {
    left: "/stickers/villages/clovermeadow/butterfly-iridescent.png",
    right: "/stickers/villages/clovermeadow/mushrooms-pink.png",
    shelf: "/stickers/villages/clovermeadow/cherries-gingham.png",
    idle: "Meadow cartoons — bees humming between the frames.",
  },
  moonmere: {
    left: "/stickers/villages/moonmere/luna-moth.png",
    right: "/stickers/villages/moonmere/moon-crescent.png",
    shelf: "/stickers/villages/moonmere/lantern-star.png",
    idle: "Midnight reels — moths circling the soft blue glow.",
  },
  bramblewood: {
    left: "/stickers/fox-seated.png",
    right: "/stickers/leafy-branch.png",
    shelf: "/stickers/candle-jar.png",
    idle: "Autumn shorts — foxes curled by the warm wood set.",
  },
  hearthwick: {
    left: "/villages/hearthwick/mascot.png",
    right: "/stickers/jam-jar.png",
    shelf: "/stickers/honey-jar.png",
    idle: "Hearthside reels — cinnamon steam and slow potions.",
  },
};

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TvCorner({
  user,
  villageId,
  villageName,
  mascot,
  mascotImage,
  initialRoom,
  initialVideos,
  initialFriendRooms,
  friendCount,
}: Props) {
  const [scope, setScope] = useState<ScopeTab>("village");
  const [room, setRoom] = useState<TvRoomState>(initialRoom);
  const [videos, setVideos] = useState<TvVideo[]>(initialVideos);
  const [friendRooms, setFriendRooms] = useState<TvRoomState[]>(
    initialFriendRooms
  );
  const [titleDraft, setTitleDraft] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [powerOn, setPowerOn] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const suppressUntil = useRef(0);
  const roomIdRef = useRef(room.id);
  const applyingRemote = useRef(false);

  useEffect(() => {
    roomIdRef.current = room.id;
  }, [room.id]);

  async function fetchScope(nextScope: ScopeTab, roomId?: string) {
    setBusy(true);
    setError(null);
    try {
      const params = new URLSearchParams({ scope: nextScope });
      if (roomId) params.set("roomId", roomId);
      const res = await fetch(`/api/tv/room?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not open the lounge");
      setScope(nextScope);
      setFriendRooms(data.friendRooms || []);
      setVideos(data.videos || []);
      if (data.room) {
        setRoom(data.room);
      } else {
        setRoom((prev) => ({
          ...prev,
          id: "",
          scope: "friends",
          currentVideo: null,
          currentVideoId: null,
          isPlaying: false,
          watchers: [],
          title: "Friends couch",
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lounge is quiet right now");
    } finally {
      setBusy(false);
    }
  }

  async function startFriendsCouch() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tv/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "friends",
          title: titleDraft.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start a couch");
      setScope("friends");
      setRoom(data.room);
      setFriendRooms(data.friendRooms || []);
      setVideos(data.videos || []);
      setTitleDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start a couch");
    } finally {
      setBusy(false);
    }
  }

  async function patchRoom(patch: {
    videoId?: string | null;
    isPlaying?: boolean;
    positionMs?: number;
    title?: string;
  }) {
    if (!room.id) return;
    suppressUntil.current = Date.now() + 2200;
    const res = await fetch(`/api/tv/room/${room.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not change the channel");
      return;
    }
    setRoom(data.room);
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("video", file);
      if (uploadTitle.trim()) form.append("title", uploadTitle.trim());
      const res = await fetch("/api/tv/videos", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setVideos((prev) => [data.video, ...prev.filter((v) => v.id !== data.video.id)]);
      setUploadTitle("");
      if (room.id) {
        await patchRoom({
          videoId: data.video.id,
          isPlaying: true,
          positionMs: 0,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeVideo(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tv/videos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove clip");
      setVideos((prev) => prev.filter((v) => v.id !== id));
      if (room.currentVideoId === id) {
        await patchRoom({ videoId: null, isPlaying: false, positionMs: 0 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove clip");
    } finally {
      setBusy(false);
    }
  }

  // Poll room state for watch-together sync
  useEffect(() => {
    if (!room.id) return;
    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      if (Date.now() < suppressUntil.current) return;
      try {
        const res = await fetch(`/api/tv/room/${roomIdRef.current}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data.room) return;
        if (data.room.id !== roomIdRef.current) return;
        setRoom(data.room);
      } catch {
        // ignore transient poll errors
      }
    }

    const timer = window.setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [room.id]);

  // Apply remote playback to the local video element
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !room.currentVideo) return;
    if (Date.now() < suppressUntil.current) return;

    const targetSec = estimatedPositionMs(room) / 1000;
    const drift = Math.abs(el.currentTime - targetSec) * 1000;

    applyingRemote.current = true;
    if (drift > DRIFT_MS) {
      el.currentTime = Math.max(0, targetSec);
    }
    if (room.isPlaying && el.paused && powerOn) {
      void el.play().catch(() => undefined);
    } else if (!room.isPlaying && !el.paused) {
      el.pause();
    }
    queueMicrotask(() => {
      applyingRemote.current = false;
    });
  }, [room, powerOn]);

  const decor = DECOR[villageId];
  const watchers = room.watchers || [];

  return (
    <div className={`tv-nook tv-nook-${villageId}`}>
      <div className="tv-nook-atmosphere" aria-hidden>
        <span className="tv-mote" />
        <span className="tv-mote" />
        <span className="tv-mote" />
        <span className="tv-mote" />
        <span className="tv-mote" />
        <span className="tv-leaf" />
        <span className="tv-leaf" />
        <span className="tv-leaf" />
      </div>

      <header className="tv-nook-header">
        <div className="tv-nook-title-block">
          <p className="tv-eyebrow">{villageName} evenings</p>
          <h1>TV Corner</h1>
          <p>
            A shared vintage set for your village and friends. Upload cozy
            cottage clips and watch them together in sync.
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/stickers/villages/moonmere/pack/tv-vintage.png"
          alt=""
          className="tv-nook-crest"
          draggable={false}
        />
      </header>

      <div className="tv-scope-tabs" role="tablist" aria-label="Lounge">
        <button
          type="button"
          role="tab"
          aria-selected={scope === "village"}
          className={scope === "village" ? "active" : ""}
          onClick={() => fetchScope("village")}
          disabled={busy}
        >
          Village lounge
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={scope === "friends"}
          className={scope === "friends" ? "active" : ""}
          onClick={() => fetchScope("friends")}
          disabled={busy}
        >
          Friends couch
        </button>
      </div>

      {error ? <p className="tv-error">{error}</p> : null}

      <div className="tv-nook-layout">
        <section className="tv-stage" aria-label="Vintage television">
          <div className="tv-cabinet">
            <div className="tv-antenna" aria-hidden>
              <span />
              <span />
            </div>
            <div className="tv-bezel">
              <div className={`tv-screen ${powerOn ? "on" : "off"}`}>
                {powerOn && room.currentVideo ? (
                  <video
                    ref={videoRef}
                    key={room.currentVideo.id}
                    className="tv-video"
                    src={room.currentVideo.url}
                    playsInline
                    onPlay={() => {
                      if (applyingRemote.current) return;
                      void patchRoom({
                        isPlaying: true,
                        positionMs: Math.floor(
                          (videoRef.current?.currentTime || 0) * 1000
                        ),
                      });
                    }}
                    onPause={() => {
                      if (applyingRemote.current) return;
                      void patchRoom({
                        isPlaying: false,
                        positionMs: Math.floor(
                          (videoRef.current?.currentTime || 0) * 1000
                        ),
                      });
                    }}
                    onSeeked={() => {
                      if (applyingRemote.current) return;
                      void patchRoom({
                        positionMs: Math.floor(
                          (videoRef.current?.currentTime || 0) * 1000
                        ),
                        isPlaying: !(videoRef.current?.paused ?? true),
                      });
                    }}
                    onEnded={() => {
                      void patchRoom({ isPlaying: false, positionMs: 0 });
                    }}
                    controls
                  />
                ) : (
                  <div className="tv-idle">
                    <div className="tv-idle-glow" />
                    <p className="tv-idle-channel">CH · 03</p>
                    <p>{powerOn ? decor.idle : "The set is sleeping."}</p>
                  </div>
                )}
                <div className="tv-scanlines" aria-hidden />
                <div className="tv-vignette" aria-hidden />
              </div>
            </div>
            <div className="tv-controls-bar">
              <button
                type="button"
                className="tv-knob"
                onClick={() => setPowerOn((v) => !v)}
                aria-label={powerOn ? "Turn television off" : "Turn television on"}
              >
                <span />
                Power
              </button>
              <div className="tv-speaker" aria-hidden>
                <i />
                <i />
                <i />
                <i />
              </div>
              <button
                type="button"
                className="tv-knob"
                onClick={() => {
                  const el = videoRef.current;
                  if (!el) return;
                  if (el.paused) void el.play();
                  else el.pause();
                }}
                disabled={!room.currentVideo || !powerOn}
              >
                <span />
                Channel
              </button>
            </div>
          </div>

          <div className="tv-watchers" aria-live="polite">
            <p className="tv-watchers-label">
              {room.id
                ? room.scope === "village"
                  ? `On the ${villageName} set`
                  : room.title
                : "No friends couch yet"}
            </p>
            <ul>
              {watchers.length === 0 ? (
                <li className="tv-watcher alone">Just you and the glow for now</li>
              ) : (
                watchers.map((w) => (
                  <li key={w.user.id} className="tv-watcher">
                    <span aria-hidden>
                      {w.user.id === user.id ? "★" : mascot}
                    </span>
                    {w.user.displayName}
                    {w.user.id === user.id ? " (you)" : ""}
                  </li>
                ))
              )}
            </ul>
          </div>

          {scope === "friends" ? (
            <div className="tv-friends-panel">
              {friendCount === 0 ? (
                <p className="muted">
                  Add a penpal on the Friends page, then open a couch together.
                </p>
              ) : (
                <>
                  <div className="tv-friends-start">
                    <input
                      type="text"
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      placeholder="Name your couch (optional)"
                      maxLength={60}
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={startFriendsCouch}
                      disabled={busy}
                    >
                      Start watch party
                    </button>
                  </div>
                  {friendRooms.length > 0 ? (
                    <ul className="tv-friend-rooms">
                      {friendRooms.map((r) => (
                        <li key={r.id}>
                          <button
                            type="button"
                            className={r.id === room.id ? "active" : ""}
                            onClick={() => fetchScope("friends", r.id)}
                          >
                            <strong>{r.title}</strong>
                            <span>
                              {r.currentVideo?.title || "Waiting for a reel"}
                              {r.isPlaying ? " · playing" : ""}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">No open couches yet — start one above.</p>
                  )}
                </>
              )}
            </div>
          ) : null}
        </section>

        <aside className="tv-shelf" aria-label="Clip shelf">
          <div className="tv-shelf-mascot" aria-hidden>
            {mascotImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mascotImage} alt="" draggable={false} />
            ) : (
              <span className="tv-shelf-emoji">{mascot}</span>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={decor.shelf} alt="" className="tv-shelf-trinket" />
          </div>

          <h2>Clip shelf</h2>
          <p className="tv-shelf-copy">
            Upload vintage cottage animations — MP4, WebM, or MOV up to 80MB.
          </p>

          <label className="tv-upload">
            <span>Title</span>
            <input
              type="text"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="Moon garden loop"
              maxLength={80}
            />
          </label>
          <label className="tv-upload-file btn-primary">
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              hidden
              disabled={busy || !room.id}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                e.target.value = "";
                void onUpload(file);
              }}
            />
            {busy ? "Tucking away…" : "Upload a clip"}
          </label>

          <ul className="tv-video-list">
            {videos.length === 0 ? (
              <li className="muted">The shelf is empty — upload the first reel.</li>
            ) : (
              videos.map((video) => {
                const active = room.currentVideoId === video.id;
                const canDelete =
                  user.isOwner || video.uploaderId === user.id;
                return (
                  <li key={video.id} className={active ? "active" : ""}>
                    <button
                      type="button"
                      className="tv-video-pick"
                      disabled={!room.id || busy}
                      onClick={() =>
                        patchRoom({
                          videoId: video.id,
                          isPlaying: true,
                          positionMs: 0,
                        })
                      }
                    >
                      <strong>{video.title}</strong>
                      <span>
                        {video.uploaderName} · {formatSize(video.sizeBytes)}
                      </span>
                    </button>
                    {canDelete ? (
                      <button
                        type="button"
                        className="tv-video-remove"
                        onClick={() => removeVideo(video.id)}
                        aria-label={`Remove ${video.title}`}
                      >
                        ×
                      </button>
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>

          <div className="tv-shelf-decor" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={decor.left} alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={decor.right} alt="" />
          </div>
        </aside>
      </div>
    </div>
  );
}
