"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { UserPublic } from "@/lib/types";
import type { VillageId } from "@/lib/villages";
import type { TvChannel, TvRoomState, TvVideo } from "@/lib/tvCorner";

type Props = {
  user: UserPublic;
  villageId: VillageId;
  villageName: string;
  mascot: string;
  mascotImage: string | null;
  initialRoom: TvRoomState;
  initialChannels: TvChannel[];
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

function formatGuideTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
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
  initialChannels,
  initialFriendRooms,
  friendCount,
}: Props) {
  const [scope, setScope] = useState<ScopeTab>("village");
  const [room, setRoom] = useState<TvRoomState>(initialRoom);
  const [channels, setChannels] = useState<TvChannel[]>(initialChannels);
  const [friendRooms, setFriendRooms] = useState<TvRoomState[]>(
    initialFriendRooms
  );
  const [titleDraft, setTitleDraft] = useState("");
  const [channelTitle, setChannelTitle] = useState("");
  const [channelGlobal, setChannelGlobal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadChannelId, setUploadChannelId] = useState(
    initialChannels[0]?.id || ""
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [powerOn, setPowerOn] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const suppressUntil = useRef(0);
  const roomIdRef = useRef(room.id);
  const applyingRemote = useRef(false);
  const joinedClipKey = useRef("");

  useEffect(() => {
    setHydrated(true);
  }, []);

  const activeChannel = useMemo(
    () => channels.find((c) => c.id === room.currentChannelId) || null,
    [channels, room.currentChannelId]
  );

  const shelfVideos: TvVideo[] = useMemo(() => {
    if (activeChannel) return activeChannel.videos;
    return channels.flatMap((c) => c.videos);
  }, [activeChannel, channels]);

  useEffect(() => {
    roomIdRef.current = room.id;
  }, [room.id]);

  // Auto-tune the first channel when the village lounge has none selected.
  useEffect(() => {
    if (scope !== "village" || !room.id) return;
    if (room.currentChannelId) return;
    if (!channels[0]?.id) return;
    void patchRoom({ channelId: channels[0].id });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time tune when empty
  }, [scope, room.id, room.currentChannelId, channels]);

  useEffect(() => {
    if (!uploadChannelId && channels[0]?.id) {
      setUploadChannelId(channels[0].id);
    }
  }, [channels, uploadChannelId]);

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
      setChannels(data.channels || []);
      if (data.room) {
        setRoom(data.room);
      } else {
        setRoom((prev) => ({
          ...prev,
          id: "",
          scope: "friends",
          currentVideo: null,
          currentVideoId: null,
          currentChannelId: null,
          isPlaying: false,
          watchers: [],
          schedule: [],
          airStartsAt: null,
          broadcastMode: "interactive",
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
      setChannels(data.channels || []);
      setTitleDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start a couch");
    } finally {
      setBusy(false);
    }
  }

  async function patchRoom(patch: {
    channelId?: string | null;
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
    if (data.channels) setChannels(data.channels);
  }

  async function createChannel(titleFromForm?: string) {
    if (!user.isOwner) return;
    const title = (titleFromForm ?? channelTitle).trim();
    if (!title) {
      setError("Give the channel a name");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tv/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          villageId,
          isGlobal: channelGlobal,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not make channel");
      setChannels(data.channels || []);
      if (data.channel?.id) setUploadChannelId(data.channel.id);
      setChannelTitle("");
      setChannelGlobal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not make channel");
    } finally {
      setBusy(false);
    }
  }

  async function removeChannel(id: string) {
    if (!user.isOwner) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tv/channels", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove channel");
      setChannels(data.channels || []);
      if (room.currentChannelId === id) {
        await patchRoom({ channelId: null, videoId: null, isPlaying: false });
      }
      if (uploadChannelId === id) {
        setUploadChannelId(data.channels?.[0]?.id || "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove channel");
    } finally {
      setBusy(false);
    }
  }

  async function onUpload(file: File | null) {
    if (!file || !user.isOwner) return;
    if (!uploadChannelId) {
      setError("Make a channel first, then upload into it");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("video", file);
      form.append("channelId", uploadChannelId);
      if (uploadTitle.trim()) form.append("title", uploadTitle.trim());
      const res = await fetch("/api/tv/videos", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setChannels(data.channels || []);
      setUploadTitle("");
      // Village set: tune to that channel so the new shuffle is live.
      if (room.id && scope === "village") {
        await patchRoom({ channelId: uploadChannelId });
      } else if (room.id && data.video) {
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
      setChannels(data.channels || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove clip");
    } finally {
      setBusy(false);
    }
  }

  // Poll room / schedule
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
        if (data.channels) setChannels(data.channels);
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

  // Apply remote / schedule playback to the local video element
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !room.currentVideo || !powerOn) return;

    const scheduleMode = room.broadcastMode === "schedule";
    const clipKey = `${room.currentVideo.id}:${room.airStartsAt || ""}`;

    applyingRemote.current = true;

    if (scheduleMode) {
      // Join mid-show from wall clock — seek once per airing.
      if (joinedClipKey.current !== clipKey) {
        const targetSec = Math.max(0, (room.positionMs || 0) / 1000);
        el.currentTime = targetSec;
        joinedClipKey.current = clipKey;
      } else {
        const liveSec = estimatedPositionMs(room) / 1000;
        if (Math.abs(el.currentTime - liveSec) * 1000 > DRIFT_MS * 4) {
          el.currentTime = Math.max(0, liveSec);
        }
      }
      if (el.paused) void el.play().catch(() => undefined);
    } else {
      if (Date.now() < suppressUntil.current) {
        applyingRemote.current = false;
        return;
      }
      const targetSec = estimatedPositionMs(room) / 1000;
      const drift = Math.abs(el.currentTime - targetSec) * 1000;
      if (drift > DRIFT_MS) {
        el.currentTime = Math.max(0, targetSec);
      }
      if (room.isPlaying && el.paused) {
        void el.play().catch(() => undefined);
      } else if (!room.isPlaying && !el.paused) {
        el.pause();
      }
    }

    queueMicrotask(() => {
      applyingRemote.current = false;
    });
  }, [room, powerOn]);

  const decor = DECOR[villageId];
  const watchers = room.watchers || [];
  const scheduleMode = scope === "village" && room.broadcastMode === "schedule";

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
            Owner channels shuffle every clip into one cozy broadcast. Tune in
            anytime — the set is already mid-show.
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
                    controls={!scheduleMode}
                    onPlay={() => {
                      if (applyingRemote.current || scheduleMode) return;
                      void patchRoom({
                        isPlaying: true,
                        positionMs: Math.floor(
                          (videoRef.current?.currentTime || 0) * 1000
                        ),
                      });
                    }}
                    onPause={() => {
                      if (applyingRemote.current || scheduleMode) return;
                      void patchRoom({
                        isPlaying: false,
                        positionMs: Math.floor(
                          (videoRef.current?.currentTime || 0) * 1000
                        ),
                      });
                    }}
                    onSeeked={() => {
                      if (applyingRemote.current || scheduleMode) return;
                      void patchRoom({
                        positionMs: Math.floor(
                          (videoRef.current?.currentTime || 0) * 1000
                        ),
                        isPlaying: !(videoRef.current?.paused ?? true),
                      });
                    }}
                    onEnded={() => {
                      if (scheduleMode) return;
                      void patchRoom({ isPlaying: false, positionMs: 0 });
                    }}
                  />
                ) : (
                  <div className="tv-idle">
                    <div className="tv-idle-glow" />
                    <p className="tv-idle-channel">CH · 03</p>
                    <p>
                      {powerOn
                        ? activeChannel
                          ? `${activeChannel.title} is between reels — upload another clip.`
                          : decor.idle
                        : "The set is sleeping."}
                    </p>
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
                  if (!channels.length) return;
                  const idx = Math.max(
                    0,
                    channels.findIndex((c) => c.id === room.currentChannelId)
                  );
                  const next = channels[(idx + 1) % channels.length];
                  void patchRoom({ channelId: next.id });
                }}
                disabled={!powerOn || channels.length === 0 || !room.id}
              >
                <span />
                Channel
              </button>
            </div>
          </div>

          <div className="tv-channel-dial" aria-label="Channels">
            {channels.length === 0 ? (
              <p className="muted">
                {user.isOwner
                  ? "Make the first channel on the shelf — then upload clips into the shuffle."
                  : "No channels yet — the owner will tune the first one."}
              </p>
            ) : (
              <ul className="tv-channel-list">
                {channels.map((ch) => (
                  <li key={ch.id}>
                    <button
                      type="button"
                      className={
                        room.currentChannelId === ch.id ? "active" : ""
                      }
                      disabled={!room.id || busy}
                      onClick={() => patchRoom({ channelId: ch.id })}
                    >
                      <strong>{ch.title}</strong>
                      <span>
                        {ch.isGlobal ? "Every village" : "This village"} ·{" "}
                        {ch.videos.length} clip
                        {ch.videos.length === 1 ? "" : "s"}
                      </span>
                    </button>
                    {user.isOwner ? (
                      <button
                        type="button"
                        className="tv-video-remove"
                        onClick={() => removeChannel(ch.id)}
                        aria-label={`Remove ${ch.title}`}
                      >
                        ×
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {scheduleMode && room.schedule.length > 0 ? (
            <div className="tv-guide" aria-label="Tonight's shuffle">
              <div className="tv-guide-header">
                <p className="tv-guide-eyebrow">Tonight&apos;s shuffle</p>
                <h2>{activeChannel?.title || "Channel guide"}</h2>
                <p>Every clip plays in shuffled order — join mid-show anytime.</p>
              </div>
              <ul className="tv-guide-list">
                {room.schedule.slice(0, 8).map((slot) => (
                  <li
                    key={`${slot.videoId}-${slot.startsAt}`}
                    className={slot.isCurrent ? "now" : ""}
                  >
                    <time dateTime={slot.startsAt}>
                      {formatGuideTime(slot.startsAt)}
                    </time>
                    <strong>{slot.title}</strong>
                    <span>{slot.isCurrent ? "Now playing" : "Up next"}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

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

        <aside className="tv-shelf" aria-label="Channel shelf">
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

          <h2>Channel shelf</h2>
          <p className="tv-shelf-copy">
            {user.isOwner
              ? "Make channels and upload clips — every video joins that channel’s shuffle schedule."
              : "Tune a channel on the set. The owner keeps the shelf stocked."}
          </p>

          {user.isOwner ? (
            <>
              <form
                className="tv-owner-create"
                method="post"
                action="/api/tv/channels"
                onSubmit={(e) => {
                  if (!hydrated) return;
                  e.preventDefault();
                  const form = e.currentTarget;
                  const fd = new FormData(form);
                  const title = String(fd.get("channelTitle") || "");
                  const global = fd.get("channelGlobal") === "on";
                  setChannelGlobal(global);
                  void createChannel(title);
                }}
              >
                <input type="hidden" name="next" value="/tv-corner" />
                <input type="hidden" name="villageId" value={villageId} />
                <label className="tv-upload">
                  <span>New channel</span>
                  <input
                    type="text"
                    name="channelTitle"
                    value={channelTitle}
                    onChange={(e) => setChannelTitle(e.target.value)}
                    placeholder="Cottage Cartoons"
                    maxLength={80}
                    required
                  />
                </label>
                <label className="tv-global-check">
                  <input
                    type="checkbox"
                    name="channelGlobal"
                    checked={channelGlobal}
                    onChange={(e) => setChannelGlobal(e.target.checked)}
                  />
                  Share with every village
                </label>
                <button type="submit" className="btn-secondary" disabled={busy}>
                  Make channel
                </button>
              </form>

              <form
                id="tv-upload-form"
                className="tv-upload-form"
                method="post"
                action="/api/tv/videos"
                encType="multipart/form-data"
                onSubmit={(e) => {
                  if (!hydrated) return;
                  e.preventDefault();
                  const input = e.currentTarget.querySelector(
                    'input[name="video"]'
                  ) as HTMLInputElement | null;
                  const file = input?.files?.[0] || null;
                  void onUpload(file);
                }}
              >
                <input type="hidden" name="next" value="/tv-corner" />
                <label className="tv-upload">
                  <span>Upload into</span>
                  <select
                    name="channelId"
                    value={uploadChannelId}
                    onChange={(e) => setUploadChannelId(e.target.value)}
                    disabled={channels.length === 0}
                    required
                  >
                    {channels.length === 0 ? (
                      <option value="">Make a channel first</option>
                    ) : (
                      channels.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.title}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                <label className="tv-upload">
                  <span>Title</span>
                  <input
                    type="text"
                    name="title"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Moon garden loop"
                    maxLength={80}
                  />
                </label>
                <label className="tv-upload">
                  <span>Clip file</span>
                  <input
                    type="file"
                    name="video"
                    accept="video/mp4,video/webm,video/quicktime"
                    disabled={busy || !uploadChannelId}
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={busy || !uploadChannelId}
                >
                  {busy ? "Tucking away…" : "Upload a clip"}
                </button>
              </form>
            </>
          ) : null}

          <ul className="tv-video-list">
            {shelfVideos.length === 0 ? (
              <li className="muted">
                {activeChannel
                  ? "This channel’s shelf is empty."
                  : "No clips yet — the shuffle is waiting."}
              </li>
            ) : (
              shelfVideos.map((video) => {
                const active = room.currentVideoId === video.id;
                const canDelete = user.isOwner || video.uploaderId === user.id;
                return (
                  <li key={video.id} className={active ? "active" : ""}>
                    <button
                      type="button"
                      className="tv-video-pick"
                      disabled={!room.id || busy || scheduleMode}
                      onClick={() => {
                        if (scheduleMode) return;
                        void patchRoom({
                          videoId: video.id,
                          isPlaying: true,
                          positionMs: 0,
                        });
                      }}
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
