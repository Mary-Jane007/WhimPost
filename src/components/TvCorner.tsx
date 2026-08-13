"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import type { UserPublic } from "@/lib/types";
import type { VillageId } from "@/lib/villages";
import type { TvChannel, TvRoomState, TvScheduleSlot, TvVideo } from "@/lib/tvCorner";
import { TvRemoveForm } from "@/components/TvRemoveForm";
type VillageOption = { id: VillageId; name: string };

type ScopeTab = "village" | "friends";

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
  initialScope?: ScopeTab;
};

const POLL_MS = 2000;
/** Seek threshold when the program (clip / play state / airing) changes. */
const PROGRAM_SEEK_MS = 400;
/** Village join: treat playhead as on-air within this window. */
const VILLAGE_JOIN_CLOSE_MS = 2000;
const LOCAL_SUPPRESS_MS = 4000;
const PROGRESS_HEARTBEAT_MS = 5000;

function airingKey(
  videoId: string | null | undefined,
  airStartsAt: string | null | undefined
) {
  return `${videoId || ""}|${airStartsAt || ""}`;
}

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

/** Village air time from the stable wall-clock slot start (preferred). */
function villagePositionMs(room: {
  airStartsAt: string | null;
  positionMs: number;
  isPlaying: boolean;
  positionUpdatedAt: string;
  currentVideo?: { durationMs?: number } | null;
}) {
  const airStart = Date.parse(room.airStartsAt || "");
  if (Number.isFinite(airStart)) {
    const raw = Math.max(0, Date.now() - airStart);
    const dur = Number(room.currentVideo?.durationMs) || 0;
    if (dur > 0) return Math.min(raw, Math.max(0, dur - 250));
    return raw;
  }
  return estimatedPositionMs(room);
}

/**
 * Stable file URL for the village tube. Do NOT append #t= fragments — changing
 * the fragment remounts/reloads the media and looks like a restart. Mid-show
 * join is done only via seek in joinVillageBroadcast.
 */
function villageMediaSrc(
  room: Pick<TvRoomState, "scope" | "broadcastMode" | "currentVideo">
) {
  return room.currentVideo?.url || "";
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

/**
 * Format an air time in the viewer's local (laptop) timezone.
 * SSR may render the server zone; GuideClock + /tv-guide-local.js rewrite to
 * local time without a hydration crash (suppressHydrationWarning).
 */
function formatGuideClockLocal(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return d.toLocaleTimeString();
  }
}

function GuideClock({ iso }: { iso: string }) {
  const [label, setLabel] = useState(() => formatGuideClockLocal(iso));
  useEffect(() => {
    // Local timezone label after hydrate (SSR may differ).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional post-hydrate sync
    setLabel(formatGuideClockLocal(iso));
  }, [iso]);
  return (
    <time dateTime={iso} data-tv-guide-time="" suppressHydrationWarning>
      {label}
    </time>
  );
}

function formatDurationShort(ms: number) {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h ${rm}m`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function isVillageBroadcast(room: Pick<TvRoomState, "scope" | "broadcastMode">) {
  return room.scope === "village" || room.broadcastMode === "schedule";
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
  initialScope = "village",
}: Props) {
  const [scope, setScope] = useState<ScopeTab>(initialScope);
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
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDurationMinutes, setLinkDurationMinutes] = useState("");
  const [addingLink, setAddingLink] = useState(false);
  const [renamingVideoId, setRenamingVideoId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [chatDraft, setChatDraft] = useState("");
  const [showChannels, setShowChannels] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [chatBusy, setChatBusy] = useState(false);
  const [showSoundCue, setShowSoundCue] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    kind: "error" | "success" | "info";
    message: string;
  } | null>(null);
  const [powerOn, setPowerOn] = useState(true);
  /** Airing id that failed to decode (missing LFS bytes, etc.). */
  const [failedAiringId, setFailedAiringId] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const soundRef = useRef<HTMLAudioElement | null>(null);
  // State twin of the video node so sync effects re-run when the element mounts
  // (refs alone do not trigger renders — that left the set stuck at t=0).
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const suppressUntil = useRef(0);
  const roomIdRef = useRef(room.id);
  const applyingRemote = useRef(false);
  const lastAppliedSyncKey = useRef("");
  /** One successful mid-show join per airing — polls must not rewind the set. */
  const villageJoinedAiringRef = useRef("");
  /** After a clip ends, block play()-from-0 until the schedule advances. */
  const villageEndedAiringRef = useRef("");
  const lastProgressPush = useRef(0);
  const localControlRef = useRef(false);
  const uploadCancelRef = useRef(false);
  const activeXhrRef = useRef<XMLHttpRequest | null>(null);
  const lastDurationReport = useRef<{ id: string; ms: number; at: number }>({
    id: "",
    ms: 0,
    at: 0,
  });

  function villageAiringId() {
    return airingKey(room.currentVideoId, room.airStartsAt);
  }

  const videoFailed =
    Boolean(room.currentVideoId) && failedAiringId === villageAiringId();

  function villageTargetSec() {
    return (
      villagePositionMs({
        airStartsAt: room.airStartsAt,
        positionMs: room.positionMs,
        isPlaying: room.isPlaying,
        positionUpdatedAt: room.positionUpdatedAt,
        currentVideo: room.currentVideo,
      }) / 1000
    );
  }

  function tryPlayVillage(el: HTMLVideoElement) {
    if (!powerOn || !room.isPlaying) return;
    if (!isVillageBroadcast(room)) return;
    const airing = villageAiringId();
    if (el.ended || villageEndedAiringRef.current === airing) return;
    el.muted = false;
    el.defaultMuted = false;
    try {
      el.volume = 1;
    } catch {
      // ignore
    }
    void el.play().catch(() => undefined);
  }

  const unlockVideoAudio = useCallback(() => {
    const el = videoRef.current;
    if (el) {
      el.muted = false;
      el.defaultMuted = false;
      try {
        el.volume = 1;
      } catch {
        // ignore
      }
      // Only resume if already mid-show — never play() from 0 here.
      if (
        (room.isPlaying || isVillageBroadcast(room)) &&
        el.currentTime > 0.5
      ) {
        void el.play().catch(() => undefined);
      }
    }

    const sound = soundRef.current;
    if (sound) {
      sound.muted = false;
      sound.volume = 0.7;
      if (sound.currentTime > 0.05 || sound.paused) {
        void sound.play().catch(() => undefined);
      }
    }
  }, [room]);

  /**
   * Join the live wall-clock slot mid-show (like walking into a room with the
   * TV already on). Never reload/remount the file from 0 while the same clip
   * is still the schedule airing. Polls must not rewind a healthy playhead.
   */
  function joinVillageBroadcast(el: HTMLVideoElement, force = false) {
    if (!isVillageBroadcast(room) || !room.currentVideo) return;
    const airing = villageAiringId();
    const videoId = room.currentVideoId || "";
    if (el.ended || villageEndedAiringRef.current === airing) return;

    if (
      villageEndedAiringRef.current &&
      villageEndedAiringRef.current !== airing
    ) {
      villageEndedAiringRef.current = "";
    }

    const targetSec = villageTargetSec();

    // Schedule is past the real file length (stand-in / short encode) — sit at
    // the end. Never load()/play() from 0 for the rest of this airing.
    if (Number.isFinite(el.duration) && el.duration > 0 && targetSec >= el.duration - 0.35) {
      villageEndedAiringRef.current = airing;
      villageJoinedAiringRef.current = airing;
      if (!el.ended && el.currentTime < el.duration - 0.2) {
        try {
          el.currentTime = Math.max(0, el.duration - 0.05);
        } catch {
          // ignore
        }
      }
      el.pause();
      return;
    }

    const stuckAtStart =
      el.readyState >= 1 && targetSec > 5 && el.currentTime < 3;

    const prevAiring = villageJoinedAiringRef.current;
    const airingChanged = Boolean(prevAiring) && prevAiring !== airing;
    // Same file still rolling — do not reseek for poll/duration identity churn.
    // Exception: airtime wrapped to a new loop (schedule back near 0).
    const newLoopOfSameClip = airingChanged && targetSec < 5;
    if (
      !stuckAtStart &&
      !newLoopOfSameClip &&
      videoId &&
      el.readyState >= 1 &&
      el.currentTime > 3 &&
      !el.paused &&
      !el.ended &&
      prevAiring.startsWith(`${videoId}|`)
    ) {
      villageJoinedAiringRef.current = airing;
      lastAppliedSyncKey.current = [
        room.currentVideoId,
        room.isPlaying ? "1" : "0",
        room.airStartsAt || "",
      ].join("|");
      return;
    }

    if (!force && villageJoinedAiringRef.current === airing && !stuckAtStart) {
      if (room.isPlaying && el.paused) tryPlayVillage(el);
      return;
    }

    if (el.readyState < 1) return;

    let seekTo = targetSec;
    if (Number.isFinite(el.duration) && el.duration > 0) {
      seekTo = Math.min(seekTo, Math.max(0, el.duration - 0.25));
    }

    const driftMs = Math.abs(el.currentTime - seekTo) * 1000;
    if (driftMs > VILLAGE_JOIN_CLOSE_MS) {
      if (el.seeking) return;
      applyingRemote.current = true;
      try {
        el.currentTime = seekTo;
      } catch {
        applyingRemote.current = false;
        return;
      }
      window.setTimeout(() => {
        applyingRemote.current = false;
      }, 250);
      villageJoinedAiringRef.current = airing;
      lastAppliedSyncKey.current = [
        room.currentVideoId,
        room.isPlaying ? "1" : "0",
        room.airStartsAt || "",
      ].join("|");
      // Do not play() until seek lands — avoids a flash of the opening credits.
      return;
    }

    villageJoinedAiringRef.current = airing;
    lastAppliedSyncKey.current = [
      room.currentVideoId,
      room.isPlaying ? "1" : "0",
      room.airStartsAt || "",
    ].join("|");
    if (room.isPlaying) tryPlayVillage(el);
  }

  async function refreshVillageRoom() {
    if (!room.id || !isVillageBroadcast(room)) return;
    try {
      const res = await fetch(`/api/tv/room/${room.id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data.room || data.room.id !== roomIdRef.current) return;
      setRoom(data.room as TvRoomState);
      if (data.channels) setChannels(data.channels);
    } catch {
      // ignore
    }
  }

  // Stable URL only — seek handles mid-show; never change src for clock ticks.
  const villageVideoSrc = useMemo(
    () => villageMediaSrc(room),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [room.currentVideoId, room.currentVideo?.url, room.scope, room.broadcastMode]
  );

  // Keep a state handle for the <video> node so sync re-runs after mount.
  useLayoutEffect(() => {
    const el = videoRef.current;
    setVideoEl((prev) => (prev === el ? prev : el));
    if (el && isVillageBroadcast(room) && room.currentVideo) {
      joinVillageBroadcast(el, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [powerOn, room.currentVideoId, room.currentVideo?.url, villageVideoSrc]);

  // Fresh schedule on enter — cached SSR must not leave us at t=0.
  useEffect(() => {
    if (!room.id || !isVillageBroadcast(room)) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/tv/room/${room.id}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled || !data.room || data.room.id !== room.id) return;
        const next = data.room as TvRoomState;
        // Only reset the join latch when the airing clip actually changed.
        // Clearing it on every enter refetch remounted seeks and looked like
        // a restart when airStartsAt identity churned.
        const nextAiring = airingKey(next.currentVideoId, next.airStartsAt);
        if (villageJoinedAiringRef.current !== nextAiring) {
          villageJoinedAiringRef.current = "";
        }
        setRoom(next);
        if (data.channels) setChannels(data.channels);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id]);

  // Recover only when stuck on the opening credits while the schedule is mid-show.
  useEffect(() => {
    if (!powerOn || !isVillageBroadcast(room) || !room.currentVideo) return;
    if (room.currentVideo.sourceKind === "youtube") return;
    const timer = window.setInterval(() => {
      const el = videoRef.current;
      if (!el || el.readyState < 1 || el.seeking || el.ended) return;
      const airing = villageAiringId();
      if (villageEndedAiringRef.current === airing) return;
      const targetSec = villageTargetSec();
      // Past real media — do not try to play from 0.
      if (
        Number.isFinite(el.duration) &&
        el.duration > 0 &&
        targetSec >= el.duration - 0.35
      ) {
        villageEndedAiringRef.current = airing;
        el.pause();
        return;
      }
      if (targetSec > 5 && el.currentTime < 3) {
        villageJoinedAiringRef.current = "";
        joinVillageBroadcast(el, true);
        return;
      }
      if (
        Math.abs(el.currentTime - targetSec) * 1000 <= VILLAGE_JOIN_CLOSE_MS &&
        villageJoinedAiringRef.current !== airing
      ) {
        villageJoinedAiringRef.current = airing;
        if (room.isPlaying) tryPlayVillage(el);
        return;
      }
      if (
        room.isPlaying &&
        el.paused &&
        villageJoinedAiringRef.current === airing
      ) {
        tryPlayVillage(el);
      }
    }, 1000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    powerOn,
    room.id,
    room.currentVideoId,
    room.airStartsAt,
    room.scope,
    room.broadcastMode,
  ]);

  /** Tell the server the real clip length so air times can flex when it ends early. */
  function reportActualDuration(
    actualMs: number,
    positionMs?: number,
    force = false
  ) {
    const video = room.currentVideo;
    if (!video || video.sourceKind === "youtube") return;
    const durationMs = Math.max(1000, Math.floor(actualMs));
    if (!Number.isFinite(durationMs)) return;
    const stored = Number(video.durationMs) || 0;
    if (!force && stored > 0 && Math.abs(stored - durationMs) < 1500) return;

    // Never let ~12s LFS stand-in title cards rewrite a real episode runtime —
    // that collapsed the schedule and remounted the clip from the start forever.
    if (stored > 60_000 && durationMs < 30_000) return;

    // eslint-disable-next-line react-hooks/purity -- throttle stamp for duplicate reports
    const now = Date.now();
    const prev = lastDurationReport.current;
    if (
      !force &&
      prev.id === video.id &&
      Math.abs(prev.ms - durationMs) < 1500 &&
      now - prev.at < 8000
    ) {
      return;
    }
    lastDurationReport.current = { id: video.id, ms: durationMs, at: now };

    void fetch("/api/tv/videos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: video.id,
        durationMs,
        currentPositionMs:
          positionMs != null ? Math.max(0, Math.floor(positionMs)) : undefined,
        force,
      }),
    }).catch(() => undefined);
  }

  const effectiveChannelId = channels.some((c) => c.id === selectedChannelId)
    ? selectedChannelId
    : channels[0]?.id || "";

  useEffect(() => {
    roomIdRef.current = room.id;
  }, [room.id]);

  // Scroll chat only when a new message arrives — never on enter / room mount
  // (that yanked the page down away from the TV).
  const chatCountSeenRef = useRef<number | null>(null);
  useEffect(() => {
    chatCountSeenRef.current = null;
  }, [room.id]);
  useEffect(() => {
    const n = room.messages?.length ?? 0;
    if (chatCountSeenRef.current === null) {
      chatCountSeenRef.current = n;
      return;
    }
    if (n > chatCountSeenRef.current) {
      chatEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
    chatCountSeenRef.current = n;
  }, [room.messages?.length]);

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

  function formatBytesShort(bytes: number) {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  function notifyIssue(message: string) {
    setError(message);
    setToast({ kind: "error", message });
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          new Notification("WhimPost TV Corner", {
            body: message,
            silent: false,
          });
        } catch {
          // ignore notification failures
        }
      } else if (Notification.permission === "default") {
        void Notification.requestPermission().then((perm) => {
          if (perm === "granted") {
            try {
              new Notification("WhimPost TV Corner", { body: message });
            } catch {
              // ignore
            }
          }
        });
      }
    }
  }

  function notifySuccess(message: string) {
    setToast({ kind: "success", message });
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification("WhimPost TV Corner", { body: message });
      } catch {
        // ignore
      }
    }
  }

  function reportUploadProgress(msg: string, percent: number | null) {
    setUploadProgress(msg);
    setUploadPercent(percent);
  }

  function displayFileName(name: string) {
    return (
      name.replace(/\\/g, "/").split("/").pop()?.trim() || name || "video"
    );
  }

  function cancelActiveUpload() {
    uploadCancelRef.current = true;
    activeXhrRef.current?.abort();
    activeXhrRef.current = null;
  }

  function putChunk(
    uploadId: string,
    index: number,
    blob: Blob,
    attempts = 3
  ): Promise<void> {
    const tryOnce = () =>
      new Promise<void>((resolve, reject) => {
        if (uploadCancelRef.current) {
          reject(new Error("Upload cancelled"));
          return;
        }
        const xhr = new XMLHttpRequest();
        activeXhrRef.current = xhr;
        xhr.open(
          "PUT",
          `/api/tv/upload/${encodeURIComponent(uploadId)}/chunk?index=${index}`
        );
        // Large 1080p downloads need patience per piece, but must not hang forever.
        xhr.timeout = 180_000;
        xhr.responseType = "text";
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
        xhr.onload = () => {
          if (activeXhrRef.current === xhr) activeXhrRef.current = null;
          let data: { error?: string } | null = null;
          try {
            data = JSON.parse(xhr.responseText || "{}");
          } catch {
            reject(
              new Error(
                xhr.responseText?.slice(0, 140) ||
                  `Chunk ${index + 1} failed (${xhr.status || "network"})`
              )
            );
            return;
          }
          if (xhr.status < 200 || xhr.status >= 300) {
            reject(new Error(data?.error || `Chunk ${index + 1} failed`));
            return;
          }
          resolve();
        };
        xhr.onerror = () => {
          if (activeXhrRef.current === xhr) activeXhrRef.current = null;
          reject(
            new Error(
              `Network error on chunk ${index + 1} — keep this tab open and retry`
            )
          );
        };
        xhr.ontimeout = () => {
          if (activeXhrRef.current === xhr) activeXhrRef.current = null;
          reject(new Error(`Chunk ${index + 1} timed out`));
        };
        xhr.onabort = () => {
          if (activeXhrRef.current === xhr) activeXhrRef.current = null;
          reject(new Error("Upload cancelled"));
        };
        xhr.send(blob);
      });

    const run = async () => {
      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= attempts; attempt++) {
        if (uploadCancelRef.current) throw new Error("Upload cancelled");
        try {
          await tryOnce();
          return;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error("Chunk failed");
          if (lastError.message === "Upload cancelled") throw lastError;
          if (attempt < attempts) {
            await new Promise((r) => setTimeout(r, 400 * attempt));
          }
        }
      }
      throw lastError || new Error(`Chunk ${index + 1} failed`);
    };

    return run();
  }

  async function uploadOneToChannel(
    file: File,
    channelId: string,
    title: string | undefined,
    onProgress: (msg: string, percent: number | null) => void
  ) {
    const shortName = displayFileName(file.name);

    if (file.size <= 0) {
      throw new Error(
        `${shortName} looks empty — wait for the download to finish, then try again`
      );
    }
    if (file.size > 5 * 1024 * 1024 * 1024) {
      throw new Error(`${shortName} is over 5GB`);
    }

    const clipName =
      (title || "").trim() ||
      shortName.replace(/\.[^.]+$/, "").slice(0, 80) ||
      "Untitled clip";

    // Smaller clips: one FormData request (simple + reliable).
    if (file.size <= 32 * 1024 * 1024) {
      onProgress(
        `Uploading ${shortName} (${formatBytesShort(file.size)})…`,
        0
      );
      const form = new FormData();
      form.append("video", file, shortName);
      form.append("channelId", channelId);
      form.append("title", clipName);
      const video = await new Promise<TvVideo>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        activeXhrRef.current = xhr;
        xhr.open("POST", "/api/tv/videos");
        xhr.timeout = 600_000;
        xhr.responseType = "text";
        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable || event.total <= 0) return;
          const pct = Math.min(
            99,
            Math.round((event.loaded / event.total) * 100)
          );
          onProgress(
            `Uploading ${shortName} — ${pct}% (${formatBytesShort(event.loaded)} of ${formatBytesShort(event.total)})`,
            pct
          );
        };
        xhr.onload = () => {
          if (activeXhrRef.current === xhr) activeXhrRef.current = null;
          let data: {
            error?: string;
            video?: TvVideo;
            channel?: TvChannel;
          } | null = null;
          try {
            data = JSON.parse(xhr.responseText || "{}");
          } catch {
            reject(
              new Error(
                xhr.responseText?.slice(0, 140) ||
                  `Upload failed (${xhr.status || "network"})`
              )
            );
            return;
          }
          if (xhr.status < 200 || xhr.status >= 300) {
            reject(new Error(data?.error || `Could not upload ${shortName}`));
            return;
          }
          if (data?.channel) mergeChannel(data.channel);
          if (!data?.video) {
            reject(new Error(`Upload finished but no clip was saved for ${shortName}`));
            return;
          }
          onProgress(`Saved ${shortName}`, 100);
          resolve(data.video);
        };
        xhr.onerror = () => {
          if (activeXhrRef.current === xhr) activeXhrRef.current = null;
          reject(new Error(`Network error while uploading ${shortName}`));
        };
        xhr.ontimeout = () => {
          if (activeXhrRef.current === xhr) activeXhrRef.current = null;
          reject(new Error(`Upload timed out for ${shortName}`));
        };
        xhr.onabort = () => {
          if (activeXhrRef.current === xhr) activeXhrRef.current = null;
          reject(new Error("Upload cancelled"));
        };
        if (uploadCancelRef.current) {
          reject(new Error("Upload cancelled"));
          return;
        }
        xhr.send(form);
      });
      return video;
    }

    onProgress(
      `Preparing ${shortName} (${formatBytesShort(file.size)})…`,
      0
    );

    const initRes = await fetch("/api/tv/upload/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channelId,
        title: clipName,
        filename: shortName,
        mime: file.type || "application/octet-stream",
        size: file.size,
      }),
    });
    const initData = await initRes.json().catch(() => ({}));
    if (!initRes.ok) {
      throw new Error(
        initData.error || `Could not start upload for ${shortName}`
      );
    }

    const uploadId = String(initData.uploadId || "");
    const chunkSize = Number(initData.chunkSize) || 2 * 1024 * 1024;
    const chunkCount =
      Number(initData.chunkCount) ||
      Math.max(1, Math.ceil(file.size / chunkSize));
    if (!uploadId) throw new Error("Upload session missing id");

    // One piece at a time — parallel uploads break on many preview proxies.
    for (let i = 0; i < chunkCount; i++) {
      if (uploadCancelRef.current) throw new Error("Upload cancelled");
      const start = i * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      const blob = file.slice(start, end);
      await putChunk(uploadId, i, blob);
      const pct = Math.min(99, Math.round(((i + 1) / chunkCount) * 100));
      onProgress(
        `Uploading ${shortName} — ${pct}% (${formatBytesShort(end)} of ${formatBytesShort(file.size)}) · piece ${i + 1}/${chunkCount}`,
        pct
      );
    }

    if (uploadCancelRef.current) throw new Error("Upload cancelled");

    onProgress(`Finishing ${shortName}…`, 99);
    const doneRes = await fetch(
      `/api/tv/upload/${encodeURIComponent(uploadId)}/complete`,
      { method: "POST" }
    );
    const doneData = await doneRes.json().catch(() => ({}));
    if (!doneRes.ok) {
      throw new Error(doneData.error || `Could not finish ${shortName}`);
    }
    if (doneData.channel) mergeChannel(doneData.channel);
    if (!doneData.video) {
      throw new Error(`Upload finished but no clip was saved for ${shortName}`);
    }
    onProgress(`Saved ${shortName}`, 100);
    return doneData.video as TvVideo;
  }

  async function onAddLink(channelId?: string) {
    if (!user.isOwner) {
      notifyIssue("Only the site owner can add channel videos");
      return;
    }
    const targetChannelId = channelId || effectiveChannelId;
    if (!targetChannelId) {
      notifyIssue("Create a channel first, then add a link to it");
      return;
    }
    const url = linkUrl.trim();
    if (!url) {
      notifyIssue("Paste a direct .mp4 / .webm link, or upload a file");
      return;
    }
    setAddingLink(true);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tv/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: targetChannelId,
          sourceUrl: url,
          title: linkTitle.trim() || undefined,
          durationMinutes: linkDurationMinutes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not add that link");
      }
      if (data.channel) mergeChannel(data.channel);
      setLinkUrl("");
      setLinkTitle("");
      setLinkDurationMinutes("");
      setSelectedChannelId(targetChannelId);
      setToast({
        kind: "success",
        message: "Video link saved to the durable shelf",
      });
    } catch (err) {
      notifyIssue(
        err instanceof Error ? err.message : "Could not add that link"
      );
    } finally {
      setAddingLink(false);
      setBusy(false);
    }
  }

  async function onUploadClips(
    files: FileList | File[] | null,
    channelId?: string
  ) {
    if (!user.isOwner) {
      notifyIssue("Only the site owner can upload channel videos");
      return;
    }
    const list = !files
      ? []
      : Array.isArray(files)
        ? files
        : Array.from(files);
    if (list.length === 0) {
      notifyIssue("No video file was chosen");
      return;
    }
    const targetChannelId = channelId || effectiveChannelId;
    if (!targetChannelId) {
      notifyIssue("Create a channel first, then upload videos to it");
      return;
    }
    uploadCancelRef.current = false;
    setUploading(true);
    setBusy(true);
    setError(null);
    reportUploadProgress(
      `Preparing ${list.length} video${list.length === 1 ? "" : "s"}…`,
      0
    );
    let uploaded = 0;
    const failures: string[] = [];
    try {
      for (let i = 0; i < list.length; i++) {
        if (uploadCancelRef.current) {
          failures.push("Upload cancelled");
          break;
        }
        const file = list[i];
        const prefix =
          list.length > 1 ? `Video ${i + 1} of ${list.length}: ` : "";
        try {
          await uploadOneToChannel(
            file,
            targetChannelId,
            i === 0 ? clipTitle : undefined,
            (msg, percent) => reportUploadProgress(`${prefix}${msg}`, percent)
          );
          uploaded += 1;
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : `Could not upload ${displayFileName(file.name)}`;
          failures.push(`${displayFileName(file.name)}: ${message}`);
          // Keep going so the rest of a multi-select can still land.
          if (message === "Upload cancelled") break;
        }
      }
      setClipTitle("");
      if (uploaded > 0 && failures.length === 0) {
        const successMsg =
          uploaded === 1
            ? "Upload complete — saved so it won’t be lost on reset"
            : `${uploaded} videos saved so they won’t be lost on reset`;
        reportUploadProgress(successMsg, 100);
        notifySuccess(successMsg);
        window.setTimeout(() => {
          setUploadProgress(null);
          setUploadPercent(null);
        }, 5000);
      } else if (uploaded > 0 && failures.length > 0) {
        const msg = `${uploaded} uploaded, ${failures.length} failed. ${failures[0]}`;
        reportUploadProgress(msg, null);
        notifyIssue(msg);
      } else {
        setUploadProgress(null);
        setUploadPercent(null);
        notifyIssue(failures[0] || "Upload failed");
      }
    } finally {
      activeXhrRef.current = null;
      setUploading(false);
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
      if (renamingVideoId === id) {
        setRenamingVideoId(null);
        setRenameDraft("");
      }
      if (room.currentVideoId === id) {
        await patchRoom({ videoId: null, isPlaying: false, positionMs: 0 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove clip");
    } finally {
      setBusy(false);
    }
  }

  function startRenameVideo(video: TvVideo) {
    if (!user.isOwner) return;
    setRenamingVideoId(video.id);
    setRenameDraft(video.title);
    setError(null);
  }

  function cancelRenameVideo() {
    setRenamingVideoId(null);
    setRenameDraft("");
  }

  async function saveRenameVideo(videoId: string) {
    if (!user.isOwner) return;
    const title = renameDraft.trim();
    if (!title) {
      notifyIssue("Give the clip a name");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tv/videos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: videoId, title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not rename clip");
      if (data.channel) {
        mergeChannel(data.channel);
      } else if (data.video) {
        setChannels((prev) =>
          prev.map((channel) => ({
            ...channel,
            videos: channel.videos.map((v) =>
              v.id === data.video.id ? data.video : v
            ),
          }))
        );
      }
      if (room.currentVideoId === videoId && data.video) {
        setRoom((prev) => ({
          ...prev,
          currentVideo: data.video,
        }));
      }
      setRenamingVideoId(null);
      setRenameDraft("");
      notifySuccess(`Renamed to “${data.video.title}”`);
    } catch (err) {
      notifyIssue(
        err instanceof Error ? err.message : "Could not rename clip"
      );
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
    if (isVillageBroadcast(room)) {
      // Village lounge: tune the channel — schedule decides the airing clip.
      void patchRoom({ channelId: channel.id });
    } else {
      void patchRoom({
        channelId: channel.id,
        videoId: channel.videos[0].id,
        isPlaying: true,
        positionMs: 0,
      });
    }
    setSelectedChannelId(channel.id);
    setShowChannels(false);
  }

  function tuneToVideo(video: TvVideo) {
    if (isVillageBroadcast(room)) {
      // Shelf pick still only changes the channel; wall-clock schedule continues.
      void patchRoom({
        channelId: video.channelId,
        videoId: video.id,
      });
    } else {
      void patchRoom({
        channelId: video.channelId,
        videoId: video.id,
        isPlaying: true,
        positionMs: 0,
      });
    }
    if (video.channelId) setSelectedChannelId(video.channelId);
    setShowChannels(false);
  }

  function playNextInChannel() {
    if (isVillageBroadcast(room)) return;
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
          // Village broadcast is server clock. When the same clip is still
          // airing, keep the local currentVideo object so the <video> src
          // stays stable — only refresh guide/chat metadata.
          if (isVillageBroadcast(remote)) {
            if (
              prev.currentVideoId &&
              prev.currentVideoId === remote.currentVideoId &&
              prev.currentVideo
            ) {
              return {
                ...remote,
                currentVideo: prev.currentVideo,
              };
            }
            return remote;
          }
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

  // Apply remote playback when the program changes — never seek on every
  // village poll tick (that rewound the same scene again and again).
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !room.currentVideo) return;
    if (room.currentVideo.sourceKind === "youtube") return;

    const villageBroadcast = isVillageBroadcast({
      scope: room.scope,
      broadcastMode: room.broadcastMode,
    });
    // Village: videoId only — airStartsAt churn must not remount/restart.
    // Friends: channel/clip/play only.
    const syncKey = [
      room.currentVideoId,
      room.isPlaying ? "1" : "0",
      villageBroadcast ? room.airStartsAt || "" : "",
    ].join("|");

    const now = Date.now();
    if (
      !villageBroadcast &&
      now < suppressUntil.current &&
      localControlRef.current
    ) {
      // Still own the dial — don't yank the playhead.
      lastAppliedSyncKey.current = syncKey;
      return;
    }

    const programChanged = syncKey !== lastAppliedSyncKey.current;
    const targetSec =
      (villageBroadcast
        ? villagePositionMs({
            airStartsAt: room.airStartsAt,
            positionMs: room.positionMs,
            isPlaying: room.isPlaying,
            positionUpdatedAt: room.positionUpdatedAt,
            currentVideo: room.currentVideo,
          })
        : estimatedPositionMs({
            positionMs: room.positionMs,
            isPlaying: room.isPlaying,
            positionUpdatedAt: room.positionUpdatedAt,
          })) / 1000;
    const drift = Math.abs(el.currentTime - targetSec) * 1000;

    if (villageBroadcast) {
      const airing = villageAiringId();
      // Force only when we have not joined this airing yet, or the playhead
      // is stuck at the opening while the schedule is mid-show.
      const stuckAtStart = targetSec > 5 && el.currentTime < 3;
      if (villageJoinedAiringRef.current !== airing || stuckAtStart) {
        joinVillageBroadcast(el, true);
      } else if (room.isPlaying && powerOn && el.paused) {
        tryPlayVillage(el);
      } else if (!room.isPlaying && !el.paused) {
        el.pause();
      } else if (programChanged) {
        lastAppliedSyncKey.current = syncKey;
      }
      return;
    }

    applyingRemote.current = true;
    if (programChanged && drift > PROGRAM_SEEK_MS) {
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
    // videoEl is the mount signal; join helpers close over latest room.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    videoEl,
    room.currentVideo,
    room.currentVideoId,
    room.isPlaying,
    room.positionMs,
    room.positionUpdatedAt,
    room.scope,
    room.broadcastMode,
    room.airStartsAt,
    powerOn,
  ]);

  useEffect(() => {
    // Clear leftover cancel flags if the page remounts mid-upload.
    uploadCancelRef.current = false;
  }, []);

  useEffect(() => {
    if (!toast || toast.kind === "error") return;
    const timer = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!showSoundCue) return;
    const dismiss = () => {
      unlockVideoAudio();
      setShowSoundCue(false);
    };
    const events = [
      "pointerdown",
      "pointerup",
      "touchstart",
      "click",
      "keydown",
    ] as const;
    for (const eventName of events) {
      document.addEventListener(eventName, dismiss, true);
    }
    return () => {
      for (const eventName of events) {
        document.removeEventListener(eventName, dismiss, true);
      }
    };
  }, [showSoundCue, unlockVideoAudio]);

  // Soft progress heartbeat so friends stay roughly aligned without seeking ourselves.
  useEffect(() => {
    if (!room.id || !room.currentVideo || !powerOn) return;
    if (isVillageBroadcast(room)) return;
    if (room.currentVideo.sourceKind === "youtube") return;
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
  }, [room.id, room.currentVideo, room.scope, room.broadcastMode, powerOn]);

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
            Gather round the vintage set. The village lounge runs like a real
            channel — every clip joins the lineup, reshuffled after each full
            playthrough. Friends couches
            stay pause-and-scrub watch parties.
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
        <Link
          href="/tv-corner?scope=village"
          role="tab"
          aria-selected={scope === "village"}
          className={scope === "village" ? "active" : ""}
          onClick={(e) => {
            if (busy) {
              e.preventDefault();
              return;
            }
            e.preventDefault();
            void fetchScope("village");
          }}
        >
          Village lounge
        </Link>
        <Link
          href="/tv-corner?scope=friends"
          role="tab"
          aria-selected={scope === "friends"}
          className={scope === "friends" ? "active" : ""}
          onClick={(e) => {
            if (busy) {
              e.preventDefault();
              return;
            }
            e.preventDefault();
            void fetchScope("friends");
          }}
        >
          Friends couch
        </Link>
      </div>

      {error ? <p className="tv-error">{error}</p> : null}

      {toast && typeof document !== "undefined"
        ? createPortal(
            <div
              className={`tv-toast tv-toast-${toast.kind}`}
              role="alert"
              aria-live="assertive"
            >
              <div className="tv-toast-body">
                <strong>
                  {toast.kind === "error"
                    ? "Upload issue"
                    : toast.kind === "success"
                      ? "All set"
                      : "Note"}
                </strong>
                <p>{toast.message}</p>
              </div>
              <button
                type="button"
                className="tv-toast-dismiss"
                aria-label="Dismiss notification"
                onClick={() => setToast(null)}
              >
                ×
              </button>
            </div>,
            document.body
          )
        : null}

      {uploadProgress || uploadPercent !== null ? (
        <div className="tv-upload-banner" role="status" aria-live="polite">
          <div className="tv-upload-banner-top">
            <strong>
              {uploadPercent !== null && uploadPercent >= 100
                ? "Upload finished"
                : "Uploading your video"}
            </strong>
            <div className="tv-upload-banner-actions">
              {uploadPercent !== null ? (
                <span className="tv-upload-pct">{uploadPercent}%</span>
              ) : null}
              {uploading ? (
                <button
                  type="button"
                  className="tv-upload-cancel"
                  onClick={cancelActiveUpload}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
          <div
            className="tv-upload-bar"
            aria-hidden={uploadPercent === null}
          >
            <span
              style={{
                width: `${Math.max(uploadPercent ?? 0, uploadPercent === 0 ? 2 : 0)}%`,
              }}
            />
          </div>
          <p>{uploadProgress || "Working…"}</p>
          <p className="tv-upload-banner-hint">
            Keep this tab open until 100%. Big YTDown 1080p files upload in
            small pieces — if a piece fails it will retry automatically.
          </p>
        </div>
      ) : null}

      <div className="tv-nook-layout">
        <section className="tv-stage" aria-label="Vintage television">
          <div className="tv-cabinet">
            <div className="tv-antenna" aria-hidden>
              <span />
              <span />
            </div>
            <div className="tv-bezel">
              <div className={`tv-screen ${powerOn ? "on" : "off"}`}>
                {powerOn &&
                room.currentVideo &&
                room.currentVideo.sourceKind !== "youtube" &&
                !videoFailed &&
                showSoundCue ? (
                  <div className="tv-sound-cue" aria-live="polite">
                    Click to enable sound
                  </div>
                ) : null}
                {powerOn ? (
                  <audio
                    ref={soundRef}
                    data-tv-fallback="true"
                    preload="auto"
                    src="/tv-startup-tone.wav"
                    style={{ display: "none" }}
                  />
                ) : null}
                {powerOn &&
                room.currentVideo &&
                room.currentVideo.sourceKind !== "youtube" &&
                !videoFailed ? (
                  <video
                    ref={videoRef}
                    key={
                      isVillageBroadcast(room)
                        ? room.currentVideo.id
                        : airingKey(room.currentVideo.id, null)
                    }
                    className="tv-video"
                    src={
                      isVillageBroadcast(room)
                        ? villageVideoSrc || room.currentVideo.url
                        : room.currentVideo.url
                    }
                    playsInline
                    preload="auto"
                    muted={false}
                    // Village: never autoplay from 0 — joinVillageBroadcast
                    // seeks to the live schedule offset, then play()s.
                    autoPlay={!isVillageBroadcast(room)}
                    disablePictureInPicture
                    controlsList="nodownload noplaybackrate noremoteplayback"
                    onLoadedData={() => {
                      const el = videoRef.current;
                      if (!el) return;
                      el.muted = false;
                      el.defaultMuted = false;
                      try {
                        el.volume = 1;
                      } catch {
                        // ignore
                      }
                    }}
                    onError={() => {
                      // Broken pointer / missing bytes — fall back to idle copy
                      // instead of a blank tube.
                      setFailedAiringId(
                        airingKey(room.currentVideoId, room.airStartsAt)
                      );
                    }}
                    onPlay={() => {
                      if (isVillageBroadcast(room)) {
                        // Keep muted autoplay intact until a real user gesture
                        // unlocks audio via tv-sound-boot.js — do not force unmute.
                        return;
                      }
                      if (applyingRemote.current) return;
                      void patchRoom({
                        isPlaying: true,
                        positionMs: Math.floor(
                          (videoRef.current?.currentTime || 0) * 1000
                        ),
                      });
                    }}
                    onPause={() => {
                      if (isVillageBroadcast(room)) return;
                      if (applyingRemote.current) return;
                      void patchRoom({
                        isPlaying: false,
                        positionMs: Math.floor(
                          (videoRef.current?.currentTime || 0) * 1000
                        ),
                      });
                    }}
                    onLoadedMetadata={() => {
                      const el = videoRef.current;
                      if (!el || !Number.isFinite(el.duration) || el.duration <= 0) {
                        return;
                      }
                      // Align catalog runtime with the real file as soon as we know it.
                      reportActualDuration(
                        el.duration * 1000,
                        el.currentTime * 1000
                      );
                      if (isVillageBroadcast(room)) {
                        joinVillageBroadcast(el, true);
                      }
                    }}
                    onCanPlay={() => {
                      const el = videoRef.current;
                      if (!el || !isVillageBroadcast(room) || !powerOn) return;
                      if (villageJoinedAiringRef.current !== villageAiringId()) {
                        joinVillageBroadcast(el, true);
                      } else if (room.isPlaying && el.paused) {
                        tryPlayVillage(el);
                      }
                    }}
                    onSeeked={() => {
                      if (isVillageBroadcast(room)) {
                        const el = videoRef.current;
                        if (!el) return;
                        const airing = villageAiringId();
                        if (
                          el.ended ||
                          villageEndedAiringRef.current === airing
                        ) {
                          return;
                        }
                        const targetSec = villageTargetSec();
                        const drift =
                          Math.abs(el.currentTime - targetSec) * 1000;
                        if (drift <= VILLAGE_JOIN_CLOSE_MS) {
                          villageJoinedAiringRef.current = airing;
                          if (room.isPlaying) tryPlayVillage(el);
                        } else if (targetSec > 5 && el.currentTime < 3) {
                          villageJoinedAiringRef.current = "";
                          joinVillageBroadcast(el, true);
                        } else if (
                          room.isPlaying &&
                          el.paused &&
                          villageJoinedAiringRef.current === airing
                        ) {
                          tryPlayVillage(el);
                        }
                        return;
                      }
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
                    onWaiting={() => {
                      // Stalled mid-seek / buffer — nudge play once data returns.
                      if (!isVillageBroadcast(room)) return;
                      const el = videoRef.current;
                      if (!el) return;
                      const resume = () => {
                        el.removeEventListener("canplay", resume);
                        if (room.isPlaying && el.paused) tryPlayVillage(el);
                      };
                      el.addEventListener("canplay", resume, { once: true });
                    }}
                    onEnded={() => {
                      if (isVillageBroadcast(room)) {
                        // Hold this airing so play() cannot restart the file
                        // from 0 while the schedule catches up.
                        villageEndedAiringRef.current = villageAiringId();
                        const mediaMs = Math.floor(
                          (videoRef.current?.duration || 0) * 1000
                        );
                        const catalogMs =
                          Number(room.currentVideo?.durationMs) || 0;
                        // Prefer the real file length — never rewrite the
                        // catalog from a ~12s stand-in (that jumped the
                        // schedule back to the start on a loop).
                        if (
                          mediaMs > 1000 &&
                          !(catalogMs > 60_000 && mediaMs < 30_000)
                        ) {
                          reportActualDuration(mediaMs, mediaMs, true);
                        }
                        void refreshVillageRoom();
                        return;
                      }
                      playNextInChannel();
                    }}
                    controls={!isVillageBroadcast(room)}
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
                    <p>
                      {powerOn
                        ? videoFailed
                          ? "This reel’s file is missing on the shelf — re-upload the clip or restore Git LFS media."
                          : room.currentVideo?.sourceKind === "youtube"
                          ? "Upload that clip as a file to air it — the set never shows YouTube."
                          : decor.idle
                        : "The set is sleeping."}
                    </p>
                  </div>
                )}
                {/* Village tube glass: blocks hover chrome on the broadcast. */}
                {isVillageBroadcast(room) ? (
                  <div className="tv-screen-shield" aria-hidden />
                ) : null}
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

          {isVillageBroadcast(room) && (room.schedule?.length || 0) > 0 ? (
            <div className="tv-guide" aria-label="Channel schedule">
              <div className="tv-guide-header">
                <p className="tv-guide-eyebrow">Tonight&apos;s guide</p>
                <h2>
                  {channels.find((c) => c.id === room.currentChannelId)?.title ||
                    "Channel"}{" "}
                  schedule
                </h2>
                <p>
                  Every clip joins the lineup. Air times are in your local time
                  and follow each file&apos;s real length (and flex if a clip
                  ends early). After all videos play, the order reshuffles. Join
                  mid-show — the broadcast does not restart for you.
                </p>
              </div>
              <ol className="tv-guide-list">
                {(room.schedule as TvScheduleSlot[]).map((slot) => (
                  <li
                    key={`${slot.videoId}-${slot.startsAt}`}
                    className={slot.isCurrent ? "now" : undefined}
                  >
                    <GuideClock iso={slot.startsAt} />
                    <div>
                      <strong>
                        {slot.isCurrent ? "Now · " : ""}
                        {slot.title}
                      </strong>
                      <span>
                        {formatDurationShort(slot.durationMs)}
                        {" · until "}
                        <GuideClock iso={slot.endsAt} />
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
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
            Create a channel first, then upload files or paste video links.
            Turning the Channel knob tunes the whole lounge to that lineup.
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
                <strong>2.</strong> Add videos — upload a file (preferred), or
                paste a link. Uploads are saved to the durable shelf so they
                survive server resets.
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

              <p className="tv-shelf-copy tv-shelf-hint">
                <strong>Add by link</strong> — direct .mp4 / .webm URL only
                (no YouTube on the set). Optional length helps the village schedule stay accurate
                (defaults to 10 minutes).
              </p>
              <label className="tv-upload">
                <span>Video link</span>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://youtu.be/… or https://…/clip.mp4"
                  disabled={!effectiveChannelId || addingLink}
                />
              </label>
              <label className="tv-upload">
                <span>Title (optional)</span>
                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="What should this clip be called?"
                  maxLength={80}
                  disabled={!effectiveChannelId || addingLink}
                />
              </label>
              <label className="tv-upload">
                <span>Length in minutes (optional)</span>
                <input
                  type="number"
                  min={0.5}
                  max={720}
                  step={0.5}
                  value={linkDurationMinutes}
                  onChange={(e) => setLinkDurationMinutes(e.target.value)}
                  placeholder="e.g. 22"
                  disabled={!effectiveChannelId || addingLink}
                />
              </label>
              <button
                type="button"
                className="btn-primary tv-upload-file"
                onClick={() => void onAddLink()}
                disabled={addingLink || uploading || !effectiveChannelId}
              >
                {addingLink ? "Adding link…" : "Add link to channel"}
              </button>

              <p className="tv-shelf-copy" style={{ marginTop: "1rem" }}>
                <strong>Or upload a file</strong> — shorts or full movies (MP4,
                WebM, MOV, M4V, AVI, MPEG, or MKV · up to 5GB each). You can
                select multiple files at once.
              </p>
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
                <div className="tv-upload-inline" role="status">
                  <div className="tv-upload-bar">
                    <span
                      style={{
                        width: `${Math.max(uploadPercent ?? 0, 2)}%`,
                      }}
                    />
                  </div>
                  <p className="tv-shelf-copy tv-upload-status">{uploadProgress}</p>
                </div>
              ) : null}
              <label
                className={`tv-upload-file btn-primary${
                  !effectiveChannelId ? " is-disabled" : ""
                }`}
              >
                <input
                  type="file"
                  accept="video/*,.mp4,.webm,.mov,.m4v,.avi,.mpg,.mpeg,.mkv"
                  hidden
                  multiple
                  disabled={uploading || addingLink || !effectiveChannelId}
                  onChange={(e) => {
                    // Copy first — clearing the input empties the live FileList.
                    const files = Array.from(e.target.files || []);
                    e.target.value = "";
                    void onUploadClips(files);
                  }}
                />
                {uploading
                  ? uploadProgress || "Uploading…"
                  : "Upload videos to channel"}
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
                        <TvRemoveForm
                          action="/api/tv/channels"
                          id={channel.id}
                          label={`Remove ${channel.title}`}
                          disabled={busy}
                          onRemove={removeChannel}
                        />
                      ) : null}
                    </div>
                    {channel.videos.length > 0 ? (
                      <ul className="tv-channel-clips">
                        {channel.videos.map((video) => {
                          const clipActive = room.currentVideoId === video.id;
                          const isRenaming = renamingVideoId === video.id;
                          return (
                            <li key={video.id} className={clipActive ? "active" : ""}>
                              {isRenaming ? (
                                <form
                                  className="tv-rename-form"
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    void saveRenameVideo(video.id);
                                  }}
                                >
                                  <input
                                    type="text"
                                    value={renameDraft}
                                    onChange={(e) =>
                                      setRenameDraft(e.target.value)
                                    }
                                    maxLength={80}
                                    autoFocus
                                    disabled={busy}
                                    aria-label="Clip title"
                                  />
                                  <button
                                    type="submit"
                                    className="tv-rename-save"
                                    disabled={busy || !renameDraft.trim()}
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    className="tv-rename-cancel"
                                    onClick={cancelRenameVideo}
                                    disabled={busy}
                                  >
                                    Cancel
                                  </button>
                                </form>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    disabled={!room.id || busy}
                                    onClick={() => tuneToVideo(video)}
                                  >
                                    {video.title}
                                    {video.sourceKind === "direct" ? (
                                      <span className="tv-clip-kind">· link</span>
                                    ) : video.sourceKind === "file" ? (
                                      <span className="tv-clip-kind">· file</span>
                                    ) : null}
                                  </button>
                                  {user.isOwner ? (
                                    <>
                                      <button
                                        type="button"
                                        className="tv-video-rename"
                                        onClick={() => startRenameVideo(video)}
                                        disabled={busy}
                                        aria-label={`Rename ${video.title}`}
                                        title="Rename"
                                      >
                                        ✎
                                      </button>
                                      <TvRemoveForm
                                        action="/api/tv/videos"
                                        id={video.id}
                                        label={`Remove ${video.title}`}
                                        disabled={busy}
                                        onRemove={removeVideo}
                                      />
                                    </>
                                  ) : null}
                                </>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="muted tv-channel-empty">No videos yet.</p>
                    )}
                    {user.isOwner ? (
                      <div className="tv-channel-add-row">
                        <div className="tv-channel-link-box">
                          <input
                            type="url"
                            value={linkUrl}
                            onChange={(e) => {
                              setSelectedChannelId(channel.id);
                              setLinkUrl(e.target.value);
                            }}
                            onFocus={() => setSelectedChannelId(channel.id)}
                            placeholder="Paste a direct .mp4 / .webm link…"
                            disabled={addingLink || uploading}
                            aria-label={`Video link for ${channel.title}`}
                          />
                          <button
                            type="button"
                            className="btn-primary"
                            disabled={addingLink || uploading}
                            onClick={() => {
                              setSelectedChannelId(channel.id);
                              void onAddLink(channel.id);
                            }}
                          >
                            {addingLink && selectedChannelId === channel.id
                              ? "Adding…"
                              : "Add link"}
                          </button>
                        </div>
                        <label className="tv-channel-add btn-secondary">
                          <input
                            type="file"
                            accept="video/*,.mp4,.webm,.mov,.m4v,.avi,.mpg,.mpeg,.mkv"
                            hidden
                            multiple
                            disabled={uploading || addingLink}
                            onChange={(e) => {
                              // Copy first — clearing the input empties the live FileList.
                              const files = Array.from(e.target.files || []);
                              e.target.value = "";
                              setSelectedChannelId(channel.id);
                              void onUploadClips(files, channel.id);
                            }}
                          />
                          {uploading && effectiveChannelId === channel.id
                            ? uploadProgress || "Uploading…"
                            : "Upload file"}
                        </label>
                      </div>
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
