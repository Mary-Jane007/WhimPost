"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { UserPublic } from "@/lib/types";
import type { VillageId } from "@/lib/villages";
import type { TvChannel, TvRoomState, TvVideo } from "@/lib/tvCorner";

type VillageOption = { id: VillageId; name: string };

type Props = {
  user: UserPublic;
  villageId: VillageId;
  villageName: string;
  mascot: string;
  mascotImage: string | null;
  villageOptions: VillageOption[];
  initialRoom: TvRoomState;
  initialChannels: TvChannel[];
  initialFriendRooms: TvRoomState[];
  friendCount: number;
};

type ScopeTab = "village" | "friends";

const POLL_MS = 2000;
const DRIFT_MS = 2500;
const LOCAL_SUPPRESS_MS = 4000;
const PROGRESS_HEARTBEAT_MS = 5000;

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

function channelLabel(index: number) {
  return String(index + 1).padStart(2, "0");
}

export function TvCorner({
  user,
  villageId,
  villageName,
  mascot,
  mascotImage,
  villageOptions,
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
  const [channelVillageId, setChannelVillageId] =
    useState<VillageId>(villageId);
  const [channelGlobal, setChannelGlobal] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string>(
    initialChannels[0]?.id || ""
  );
  const [clipTitle, setClipTitle] = useState("");
  const [chatDraft, setChatDraft] = useState("");
  const [showChannels, setShowChannels] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [chatBusy, setChatBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [powerOn, setPowerOn] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const suppressUntil = useRef(0);
  const roomIdRef = useRef(room.id);
  const applyingRemote = useRef(false);
  const lastAppliedSyncKey = useRef("");
  const lastProgressPush = useRef(0);
  const localControlRef = useRef(false);

  const effectiveChannelId = channels.some((c) => c.id === selectedChannelId)
    ? selectedChannelId
    : channels[0]?.id || "";

  useEffect(() => {
    roomIdRef.current = room.id;
  }, [room.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [room.messages?.length, room.id]);

  function markLocalControl(ms = LOCAL_SUPPRESS_MS) {
    localControlRef.current = true;
    // eslint-disable-next-line react-hooks/purity -- event-driven sync guard
    suppressUntil.current = Date.now() + ms;
  }

  async function patchRoom(
    patch: {
      channelId?: string | null;
      videoId?: string | null;
      isPlaying?: boolean;
      positionMs?: number;
      title?: string;
    },
    opts?: { silent?: boolean }
  ) {
    if (!room.id) return;
    if (!opts?.silent) markLocalControl();
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
    if (opts?.silent) {
      // Keep playing locally; only refresh server snapshot fields we need.
      setRoom((prev) => ({
        ...prev,
        ...data.room,
        messages: prev.messages,
        watchers: data.room.watchers || prev.watchers,
      }));
    } else {
      setRoom(data.room);
    }
    if (data.channels) setChannels(data.channels);
  }

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
          messages: [],
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

  async function createChannel() {
    if (!user.isOwner) return;
    const title = channelTitle.trim();
    if (!title) {
      setError("Give your channel a name first");
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
          villageId: channelVillageId,
          isGlobal: channelGlobal,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create channel");
      setChannelTitle("");
      setChannelGlobal(false);
      if (
        data.channel.isGlobal ||
        channelVillageId === (room.villageId || villageId)
      ) {
        setChannels((prev) => {
          if (prev.some((c) => c.id === data.channel.id)) return prev;
          return [...prev, data.channel];
        });
      }
      setSelectedChannelId(data.channel.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create channel");
    } finally {
      setBusy(false);
    }
  }

  function mergeChannel(next: TvChannel) {
    setChannels((prev) => {
      const exists = prev.some((c) => c.id === next.id);
      if (!exists) return [...prev, next];
      return prev.map((c) => (c.id === next.id ? next : c));
    });
    setSelectedChannelId(next.id);
  }

  async function uploadOneToChannel(
    file: File,
    channelId: string,
    title?: string
  ) {
    if (file.size > 5 * 1024 * 1024 * 1024) {
      throw new Error(`${file.name} is over 5GB`);
    }
    const form = new FormData();
    form.append("video", file);
    form.append("channelId", channelId);
    const clipName =
      (title || "").trim() ||
      file.name.replace(/\.[^.]+$/, "").slice(0, 80) ||
      "Untitled clip";
    form.append("title", clipName);
    const res = await fetch("/api/tv/videos", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Could not upload ${file.name}`);
    if (data.channel) mergeChannel(data.channel);
    return data.video as TvVideo;
  }

  async function onUploadClips(
    files: FileList | File[] | null,
    channelId?: string
  ) {
    if (!user.isOwner || !files || files.length === 0) return;
    const targetChannelId = channelId || effectiveChannelId;
    if (!targetChannelId) {
      setError("Create a channel first, then upload videos to it");
      return;
    }
    const list = Array.from(files);
    setBusy(true);
    setError(null);
    let uploaded = 0;
    try {
      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        setUploadProgress(
          `Uploading ${i + 1} of ${list.length}: ${file.name}`
        );
        // Only apply the typed title to the first file in a batch.
        await uploadOneToChannel(
          file,
          targetChannelId,
          i === 0 ? clipTitle : undefined
        );
        uploaded += 1;
      }
      setClipTitle("");
      if (uploaded > 1) {
        setError(null);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? uploaded
            ? `${uploaded} uploaded, then: ${err.message}`
            : err.message
          : "Upload failed"
      );
    } finally {
      setUploadProgress(null);
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
      setChannels((prev) => prev.filter((c) => c.id !== id));
      if (room.currentChannelId === id) {
        await patchRoom({
          channelId: null,
          videoId: null,
          isPlaying: false,
          positionMs: 0,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove channel");
    } finally {
      setBusy(false);
    }
  }

  async function removeVideo(id: string) {
    if (!user.isOwner) return;
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
      setChannels((prev) =>
        prev.map((channel) => ({
          ...channel,
          videos: channel.videos.filter((v) => v.id !== id),
        }))
      );
      if (room.currentVideoId === id) {
        await patchRoom({ videoId: null, isPlaying: false, positionMs: 0 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove clip");
    } finally {
      setBusy(false);
    }
  }

  async function sendChat(e?: FormEvent) {
    e?.preventDefault();
    if (!room.id || !chatDraft.trim() || chatBusy) return;
    setChatBusy(true);
    setError(null);
    const body = chatDraft.trim();
    setChatDraft("");
    try {
      const res = await fetch(`/api/tv/room/${room.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send chat");
      setRoom(data.room);
    } catch (err) {
      setChatDraft(body);
      setError(err instanceof Error ? err.message : "Could not send chat");
    } finally {
      setChatBusy(false);
    }
  }

  function tuneToChannel(channel: TvChannel) {
    if (!channel.videos.length) {
      setError("This channel has no videos yet");
      setSelectedChannelId(channel.id);
      return;
    }
    void patchRoom({
      channelId: channel.id,
      videoId: channel.videos[0].id,
      isPlaying: true,
      positionMs: 0,
    });
    setSelectedChannelId(channel.id);
    setShowChannels(false);
  }

  function tuneToVideo(video: TvVideo) {
    void patchRoom({
      channelId: video.channelId,
      videoId: video.id,
      isPlaying: true,
      positionMs: 0,
    });
    if (video.channelId) setSelectedChannelId(video.channelId);
    setShowChannels(false);
  }

  function playNextInChannel() {
    const channel = channels.find((c) => c.id === room.currentChannelId);
    if (!channel || !room.currentVideoId) return;
    const idx = channel.videos.findIndex((v) => v.id === room.currentVideoId);
    const next = channel.videos[idx + 1];
    if (next) {
      void patchRoom({
        channelId: channel.id,
        videoId: next.id,
        isPlaying: true,
        positionMs: 0,
      });
    } else {
      void patchRoom({ isPlaying: false, positionMs: 0 });
    }
  }

  // Poll chat / presence / remote channel changes without yanking local playback.
  useEffect(() => {
    if (!room.id) return;
    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/tv/room/${roomIdRef.current}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data.room) return;
        if (data.room.id !== roomIdRef.current) return;

        const remote = data.room as TvRoomState;
        const now = Date.now();
        const suppressing = now < suppressUntil.current;

        setRoom((prev) => {
          // Always refresh chat + watchers.
          if (suppressing || localControlRef.current) {
            return {
              ...prev,
              messages: remote.messages,
              watchers: remote.watchers,
              title: remote.title,
              // Allow remote channel/video switches even while chatting.
              currentChannelId:
                remote.currentChannelId !== prev.currentChannelId
                  ? remote.currentChannelId
                  : prev.currentChannelId,
              currentVideoId:
                remote.currentVideoId !== prev.currentVideoId
                  ? remote.currentVideoId
                  : prev.currentVideoId,
              currentVideo:
                remote.currentVideoId !== prev.currentVideoId
                  ? remote.currentVideo
                  : prev.currentVideo,
            };
          }
          return remote;
        });
        if (data.channels) setChannels(data.channels);

        if (suppressing) return;

        // Followers only: if someone else changed playback, clear local-control flag.
        if (localControlRef.current) {
          // Keep local control until suppress window ends.
          if (now >= suppressUntil.current) {
            localControlRef.current = false;
          }
        }
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

  // Apply remote playback only when the sync key changes (channel/video/play/seek).
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !room.currentVideo) return;

    const syncKey = [
      room.currentVideoId,
      room.isPlaying ? "1" : "0",
      room.positionUpdatedAt,
    ].join("|");

    const now = Date.now();
    if (now < suppressUntil.current && localControlRef.current) {
      // Still own the dial — don't yank the playhead.
      lastAppliedSyncKey.current = syncKey;
      return;
    }

    const isNewSync = syncKey !== lastAppliedSyncKey.current;
    const targetSec =
      estimatedPositionMs({
        positionMs: room.positionMs,
        isPlaying: room.isPlaying,
        positionUpdatedAt: room.positionUpdatedAt,
      }) / 1000;
    const drift = Math.abs(el.currentTime - targetSec) * 1000;

    applyingRemote.current = true;
    if (isNewSync && drift > DRIFT_MS) {
      try {
        el.currentTime = Math.max(0, targetSec);
      } catch {
        // ignore seek errors while buffering
      }
    }

    if (room.isPlaying && el.paused && powerOn) {
      void el.play().catch(() => undefined);
    } else if (!room.isPlaying && !el.paused) {
      el.pause();
    }

    lastAppliedSyncKey.current = syncKey;
    window.setTimeout(() => {
      applyingRemote.current = false;
    }, 120);
  }, [
    room.currentVideo,
    room.currentVideoId,
    room.isPlaying,
    room.positionMs,
    room.positionUpdatedAt,
    powerOn,
  ]);

  // Soft progress heartbeat so friends stay roughly aligned without seeking ourselves.
  useEffect(() => {
    if (!room.id || !room.currentVideo || !powerOn) return;
    const timer = window.setInterval(() => {
      const el = videoRef.current;
      if (!el || el.paused || applyingRemote.current) return;
      const now = Date.now();
      if (now - lastProgressPush.current < PROGRESS_HEARTBEAT_MS) return;
      lastProgressPush.current = now;
      void patchRoom(
        {
          isPlaying: true,
          positionMs: Math.floor(el.currentTime * 1000),
        },
        { silent: true }
      );
    }, PROGRESS_HEARTBEAT_MS);
    return () => window.clearInterval(timer);
  // Avoid re-binding the heartbeat every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id, room.currentVideo, powerOn]);

  const decor = DECOR[villageId];
  const watchers = room.watchers || [];
  const messages = room.messages || [];
  const activeChannelIndex = channels.findIndex(
    (c) => c.id === room.currentChannelId
  );
  const tunableChannels = channels.filter((c) => c.videos.length > 0);
  const chatLabel =
    room.scope === "friends"
      ? "Friends-only chat — just this couch"
      : `${villageName} village chat`;

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
            Gather round the vintage set. Switch channels from the village
            lineup, and chat with neighbors — or keep it private on a friends
            couch.
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
                    preload="auto"
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
                      // Ignore programmatic seeks and tiny scrub noise from sync.
                      if (applyingRemote.current || localControlRef.current) return;
                      if (Date.now() < suppressUntil.current) return;
                      void patchRoom({
                        positionMs: Math.floor(
                          (videoRef.current?.currentTime || 0) * 1000
                        ),
                        isPlaying: !(videoRef.current?.paused ?? true),
                      });
                    }}
                    onEnded={() => {
                      playNextInChannel();
                    }}
                    controls
                  />
                ) : (
                  <div className="tv-idle">
                    <div className="tv-idle-glow" />
                    <p className="tv-idle-channel">
                      CH ·{" "}
                      {activeChannelIndex >= 0
                        ? channelLabel(activeChannelIndex)
                        : "—"}
                    </p>
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
                onClick={() => setShowChannels((v) => !v)}
                disabled={!room.id || !powerOn || tunableChannels.length === 0}
                aria-expanded={showChannels}
                aria-controls="tv-channel-dial"
              >
                <span />
                Channel
              </button>
            </div>
          </div>

          {showChannels ? (
            <div
              id="tv-channel-dial"
              className="tv-channel-dial"
              role="listbox"
              aria-label="Village channels"
            >
              <p className="tv-channel-dial-label">
                Choose a channel from the {villageName} lineup
              </p>
              <ul>
                {tunableChannels.map((channel, index) => {
                  const active = room.currentChannelId === channel.id;
                  return (
                    <li key={channel.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={active ? "active" : ""}
                        onClick={() => tuneToChannel(channel)}
                      >
                        <em>CH {channelLabel(index)}</em>
                        <strong>
                          {channel.title}
                          <span className="tv-channel-meta">
                            {" "}
                            · {channel.videos.length} clip
                            {channel.videos.length === 1 ? "" : "s"}
                            {channel.isGlobal ? " · every village" : ""}
                          </span>
                        </strong>
                      </button>
                    </li>
                  );
                })}
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
              {room.currentVideo
                ? ` · ${
                    channels.find((c) => c.id === room.currentChannelId)
                      ?.title || "Channel"
                  } — ${room.currentVideo.title}`
                : ""}
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

          <div className="tv-chat" aria-label={chatLabel}>
            <div className="tv-chat-header">
              <h2>Chat</h2>
              <p>{chatLabel}</p>
            </div>
            <div className="tv-chat-log" role="log" aria-live="polite">
              {!room.id ? (
                <p className="muted">Open a lounge to start chatting.</p>
              ) : messages.length === 0 ? (
                <p className="muted">No whispers yet — say hello by the set.</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={
                      msg.author.id === user.id
                        ? "tv-chat-bubble mine"
                        : "tv-chat-bubble"
                    }
                  >
                    <span className="tv-chat-author">
                      {msg.author.displayName}
                    </span>
                    <p>{msg.body}</p>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            <form className="tv-chat-compose" onSubmit={sendChat}>
              <input
                type="text"
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                placeholder={
                  room.scope === "friends"
                    ? "Message this couch…"
                    : "Message the village…"
                }
                maxLength={280}
                disabled={!room.id || chatBusy}
                aria-label="Chat message"
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={!room.id || chatBusy || !chatDraft.trim()}
              >
                Send
              </button>
            </form>
          </div>
        </section>

        <aside className="tv-shelf" aria-label="Channel dial">
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

          <h2>Channels</h2>
          <p className="tv-shelf-copy">
            Create a channel first, then upload videos into it. Turning the
            Channel knob tunes the whole lounge to that lineup.
          </p>

          {user.isOwner ? (
            <div className="tv-owner-upload">
              <p className="tv-shelf-copy">
                <strong>1.</strong> Make a channel
              </p>
              <label className="tv-upload">
                <span>Village</span>
                <select
                  value={channelVillageId}
                  onChange={(e) =>
                    setChannelVillageId(e.target.value as VillageId)
                  }
                >
                  {villageOptions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="tv-upload">
                <span>Channel name</span>
                <input
                  type="text"
                  value={channelTitle}
                  onChange={(e) => {
                    const next = e.target.value;
                    setChannelTitle(next);
                    if (
                      next.trim().toLowerCase() === "cottage cartoons"
                    ) {
                      setChannelGlobal(true);
                    }
                  }}
                  placeholder="Cottage Cartoons"
                  maxLength={80}
                />
              </label>
              <label className="tv-upload tv-upload-check">
                <input
                  type="checkbox"
                  checked={channelGlobal}
                  onChange={(e) => setChannelGlobal(e.target.checked)}
                />
                <span>Show in every village (shared lineup)</span>
              </label>
              <p className="tv-shelf-copy tv-shelf-hint">
                Cottage Cartoons is always shared across every village with the
                same videos.
              </p>
              <button
                type="button"
                className="btn-primary tv-upload-file"
                onClick={createChannel}
                disabled={busy || !channelTitle.trim()}
              >
                {busy ? "Saving…" : "Create channel"}
              </button>

              <p className="tv-shelf-copy" style={{ marginTop: "1rem" }}>
                <strong>2.</strong> Add as many videos as you like to a channel
                — shorts or full movies (MP4, WebM, MOV, M4V, AVI, MPEG, or MKV
                · up to 5GB each). You can select multiple files at once.
              </p>
              <label className="tv-upload">
                <span>Channel</span>
                <select
                  value={effectiveChannelId}
                  onChange={(e) => setSelectedChannelId(e.target.value)}
                  disabled={channels.length === 0}
                >
                  {channels.length === 0 ? (
                    <option value="">Create a channel first</option>
                  ) : (
                    channels.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.videos.length})
                      </option>
                    ))
                  )}
                </select>
              </label>
              <label className="tv-upload">
                <span>Title for first file (optional)</span>
                <input
                  type="text"
                  value={clipTitle}
                  onChange={(e) => setClipTitle(e.target.value)}
                  placeholder="Leaves the filename if blank"
                  maxLength={80}
                  disabled={!effectiveChannelId}
                />
              </label>
              {uploadProgress ? (
                <p className="tv-shelf-copy tv-upload-status">{uploadProgress}</p>
              ) : null}
              <label
                className={`tv-upload-file btn-primary${
                  !effectiveChannelId ? " is-disabled" : ""
                }`}
              >
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/x-msvideo,video/avi,video/mpeg,video/x-matroska,.mp4,.webm,.mov,.m4v,.avi,.mpg,.mpeg,.mkv"
                  hidden
                  multiple
                  disabled={busy || !effectiveChannelId}
                  onChange={(e) => {
                    const files = e.target.files;
                    e.target.value = "";
                    void onUploadClips(files);
                  }}
                />
                {busy
                  ? uploadProgress || "Uploading…"
                  : "Add videos to channel"}
              </label>
            </div>
          ) : (
            <p className="tv-shelf-copy tv-shelf-hint">
              Only the site owner can create channels and upload videos.
            </p>
          )}

          <ul className="tv-channel-list">
            {channels.length === 0 ? (
              <li className="muted">
                No channels yet
                {user.isOwner ? " — create the first one above." : "."}
              </li>
            ) : (
              channels.map((channel, index) => {
                const active = room.currentChannelId === channel.id;
                return (
                  <li
                    key={channel.id}
                    className={active ? "tv-channel-card active" : "tv-channel-card"}
                  >
                    <div className="tv-channel-card-head">
                      <button
                        type="button"
                        className="tv-video-pick"
                        disabled={!room.id || busy || channel.videos.length === 0}
                        onClick={() => tuneToChannel(channel)}
                      >
                        <strong>
                          <span className="tv-ch-num">
                            CH {channelLabel(index)}
                          </span>{" "}
                          {channel.title}
                          {channel.isGlobal ? (
                            <span className="tv-global-tag"> every village</span>
                          ) : null}
                        </strong>
                        <span>
                          {channel.videos.length} clip
                          {channel.videos.length === 1 ? "" : "s"}
                          {channel.videos.length === 0
                            ? " · empty"
                            : ""}
                          {channel.isGlobal ? " · shared" : ""}
                        </span>
                      </button>
                      {user.isOwner ? (
                        <button
                          type="button"
                          className="tv-video-remove"
                          onClick={() => removeChannel(channel.id)}
                          aria-label={`Remove ${channel.title}`}
                        >
                          ×
                        </button>
                      ) : null}
                    </div>
                    {channel.videos.length > 0 ? (
                      <ul className="tv-channel-clips">
                        {channel.videos.map((video) => {
                          const clipActive = room.currentVideoId === video.id;
                          return (
                            <li key={video.id} className={clipActive ? "active" : ""}>
                              <button
                                type="button"
                                disabled={!room.id || busy}
                                onClick={() => tuneToVideo(video)}
                              >
                                {video.title}
                              </button>
                              {user.isOwner ? (
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
                        })}
                      </ul>
                    ) : (
                      <p className="muted tv-channel-empty">No videos yet.</p>
                    )}
                    {user.isOwner ? (
                      <label className="tv-channel-add btn-primary">
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/x-msvideo,video/avi,video/mpeg,video/x-matroska,.mp4,.webm,.mov,.m4v,.avi,.mpg,.mpeg,.mkv"
                          hidden
                          multiple
                          disabled={busy}
                          onChange={(e) => {
                            const files = e.target.files;
                            e.target.value = "";
                            setSelectedChannelId(channel.id);
                            void onUploadClips(files, channel.id);
                          }}
                        />
                        {busy && effectiveChannelId === channel.id
                          ? uploadProgress || "Uploading…"
                          : "Add more videos"}
                      </label>
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
