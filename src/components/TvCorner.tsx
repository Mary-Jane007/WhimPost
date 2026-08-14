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
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function shortFileName(name: string) {
  const base = name.replace(/\\/g, "/").split("/").pop()?.trim() || "clip.mp4";
  return base.length > 48 ? `${base.slice(0, 45)}…` : base;
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
  const [uploadChannelId, setUploadChannelId] = useState(
    initialChannels[0]?.id || ""
  );
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [renamingVideoId, setRenamingVideoId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [powerOn, setPowerOn] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const suppressUntil = useRef(0);
  const roomIdRef = useRef(room.id);
  const applyingRemote = useRef(false);
  const joinedClipKey = useRef("");
  const uploadCancelRef = useRef(false);
  const activeXhrRef = useRef<XMLHttpRequest | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const activeChannel = useMemo(
    () => channels.find((c) => c.id === room.currentChannelId) || null,
    [channels, room.currentChannelId]
  );

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

  function reportUploadProgress(msg: string, percent: number | null) {
    setUploadProgress(msg);
    setUploadPercent(percent);
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

    return (async () => {
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
    })();
  }

  async function uploadOneToChannel(
    file: File,
    channelId: string,
    title: string | undefined,
    onProgress: (msg: string, percent: number | null) => void
  ) {
    const shortName = shortFileName(file.name);
    if (file.size <= 0) {
      throw new Error(`${shortName} looks empty`);
    }
    if (file.size > 5 * 1024 * 1024 * 1024) {
      throw new Error(`${shortName} is over 5GB`);
    }

    const clipName =
      (title || "").trim() ||
      shortName.replace(/\.[^.]+$/, "").slice(0, 80) ||
      "Untitled clip";

    onProgress(`Preparing ${shortName} (${formatSize(file.size)})…`, 0);

    const initRes = await fetch("/api/tv/upload/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channelId,
        title: clipName,
        filename: file.name,
        mime: file.type || "application/octet-stream",
        size: file.size,
      }),
    });
    const initData = (await initRes.json().catch(() => ({}))) as {
      error?: string;
      uploadId?: string;
      chunkSize?: number;
      chunkCount?: number;
    };
    if (!initRes.ok) {
      throw new Error(initData.error || `Could not start upload for ${shortName}`);
    }

    const uploadId = String(initData.uploadId || "");
    const chunkSize = Number(initData.chunkSize) || 2 * 1024 * 1024;
    const chunkCount =
      Number(initData.chunkCount) ||
      Math.max(1, Math.ceil(file.size / chunkSize));
    if (!uploadId) throw new Error("Upload session missing id");

    const concurrency = 3;
    let completed = 0;
    let nextIndex = 0;

    const worker = async () => {
      while (true) {
        if (uploadCancelRef.current) throw new Error("Upload cancelled");
        const i = nextIndex;
        nextIndex += 1;
        if (i >= chunkCount) return;
        const start = i * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        await putChunk(uploadId, i, file.slice(start, end));
        completed += 1;
        const pct = Math.min(99, Math.round((completed / chunkCount) * 100));
        onProgress(
          `Uploading ${shortName} — ${pct}% (${formatSize(
            Math.min(file.size, completed * chunkSize)
          )} of ${formatSize(file.size)}) · piece ${completed}/${chunkCount}`,
          pct
        );
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(concurrency, chunkCount) }, () => worker())
    );

    if (uploadCancelRef.current) throw new Error("Upload cancelled");

    onProgress(`Finishing ${shortName}…`, 99);
    const doneRes = await fetch(
      `/api/tv/upload/${encodeURIComponent(uploadId)}/complete`,
      { method: "POST" }
    );
    const doneData = (await doneRes.json().catch(() => ({}))) as {
      error?: string;
      video?: TvVideo;
      channels?: TvChannel[];
    };
    if (!doneRes.ok) {
      throw new Error(doneData.error || `Could not finish ${shortName}`);
    }
    if (doneData.channels) setChannels(doneData.channels);
    if (!doneData.video) {
      throw new Error(`Upload finished but no clip was saved for ${shortName}`);
    }
    onProgress(`Saved ${shortName}`, 100);
    return doneData.video;
  }

  async function onUploadClips(
    files: FileList | File[] | null,
    channelId?: string
  ) {
    if (!user.isOwner) return;
    if (!files || files.length === 0) {
      setError("Choose one or more video files first");
      return;
    }
    const targetChannelId = channelId || uploadChannelId;
    if (!targetChannelId) {
      setError("Make a channel first, then upload into it");
      return;
    }

    const list = Array.from(files);
    uploadCancelRef.current = false;
    setUploadChannelId(targetChannelId);
    setUploading(true);
    setBusy(true);
    setError(null);
    reportUploadProgress(
      `Preparing ${list.length} video${list.length === 1 ? "" : "s"}…`,
      0
    );

    let ok = 0;
    const errors: string[] = [];
    const channelName =
      channels.find((c) => c.id === targetChannelId)?.title || "channel";

    try {
      for (let i = 0; i < list.length; i++) {
        if (uploadCancelRef.current) throw new Error("Upload cancelled");
        const file = list[i];
        try {
          await uploadOneToChannel(
            file,
            targetChannelId,
            undefined,
            (msg, pct) => {
              const prefix =
                list.length > 1 ? `File ${i + 1} of ${list.length} · ` : "";
              reportUploadProgress(`${prefix}${msg}`, pct);
            }
          );
          ok += 1;
        } catch (err) {
          if (err instanceof Error && err.message === "Upload cancelled") {
            throw err;
          }
          errors.push(
            `${shortFileName(file.name)}: ${
              err instanceof Error ? err.message : "failed"
            }`
          );
        }
      }

      // Refresh the live guide if this channel is already tuned — new clips
      // are already in the shuffle either way.
      if (
        room.id &&
        scope === "village" &&
        ok > 0 &&
        room.currentChannelId === targetChannelId
      ) {
        await patchRoom({ channelId: targetChannelId });
      }

      if (ok && !errors.length) {
        reportUploadProgress(
          ok === 1
            ? `Added to ${channelName}’s schedule — rename anytime.`
            : `Added ${ok} clips to ${channelName}’s schedule.`,
          100
        );
      } else if (ok) {
        setError(`Uploaded ${ok} of ${list.length}. ${errors.join(" · ")}`);
        reportUploadProgress(`Uploaded ${ok} of ${list.length}`, 100);
      } else if (errors.length) {
        setError(errors.join(" · "));
        setUploadProgress(null);
        setUploadPercent(null);
      }
    } catch (err) {
      if (err instanceof Error && err.message === "Upload cancelled") {
        setError("Upload cancelled");
      } else {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
      setUploadProgress(null);
      setUploadPercent(null);
    } finally {
      activeXhrRef.current = null;
      setUploading(false);
      setBusy(false);
      window.setTimeout(() => {
        setUploadProgress(null);
        setUploadPercent(null);
      }, 2800);
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
      setError("Give the clip a name");
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
      const data = (await res.json()) as {
        error?: string;
        video?: TvVideo;
        channels?: TvChannel[];
      };
      if (!res.ok) throw new Error(data.error || "Could not rename clip");
      if (data.channels) setChannels(data.channels);
      if (room.currentVideoId === videoId && data.video) {
        setRoom((prev) => ({ ...prev, currentVideo: data.video || prev.currentVideo }));
      }
      setRenamingVideoId(null);
      setRenameDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename clip");
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
      if (renamingVideoId === id) {
        setRenamingVideoId(null);
        setRenameDraft("");
      }
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
          <div className="tv-upload-bar" aria-hidden={uploadPercent === null}>
            <span
              style={{
                width: `${Math.max(
                  uploadPercent ?? 0,
                  uploadPercent === 0 ? 2 : 0
                )}%`,
              }}
            />
          </div>
          <p>{uploadProgress || "Working…"}</p>
          <p className="tv-upload-banner-hint">
            Keep this tab open until 100%. Movies upload in small pieces — if a
            piece fails it retries automatically. You can rename clips on the
            shelf after they land.
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
                {powerOn && room.currentVideo ? (
                  <>
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
                    {scheduleMode ? (
                      <div className="tv-now-osd" aria-live="polite">
                        <p className="tv-now-osd-label">Now playing</p>
                        <p className="tv-now-osd-title">{room.currentVideo.title}</p>
                        {activeChannel ? (
                          <p className="tv-now-osd-channel">{activeChannel.title}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="tv-idle">
                    <div className="tv-idle-glow" />
                    <p className="tv-idle-channel">CH · 03</p>
                    <p>
                      {powerOn
                        ? activeChannel
                          ? user.isOwner
                            ? `${activeChannel.title} is between reels — upload another clip.`
                            : `${activeChannel.title} is between reels — the next shuffle is coming.`
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

          {scheduleMode ? (
            <div className="tv-village-broadcast" aria-label="Village broadcast">
              {room.currentVideo ? (
                <div className="tv-now-playing" aria-live="polite">
                  <p className="tv-now-playing-label">Now playing</p>
                  <h2>{room.currentVideo.title}</h2>
                  <p>
                    {activeChannel ? `${activeChannel.title} · ` : ""}
                    Join mid-show anytime — the whole village shares this set.
                  </p>
                </div>
              ) : (
                <div className="tv-now-playing is-idle">
                  <p className="tv-now-playing-label">Village lounge</p>
                  <h2>{activeChannel?.title || "Waiting for a reel"}</h2>
                  <p>
                    {user.isOwner
                      ? "Add videos to a channel bar and the shuffle starts for everyone."
                      : "The set is quiet until the owner tucks a clip onto a channel."}
                  </p>
                </div>
              )}

              {room.schedule.length > 0 ? (
                <div className="tv-guide" aria-label="Tonight's shuffle">
                  <div className="tv-guide-header">
                    <p className="tv-guide-eyebrow">Tonight&apos;s shuffle</p>
                    <h2>{activeChannel?.title || "Channel guide"}</h2>
                    <p>
                      Every clip plays in shuffled order — neighbors see the same
                      schedule.
                    </p>
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
              ? "Each channel has its own bar — add videos anytime and they join that channel’s shuffle for the whole village."
              : "Tune a channel to watch with the village. Now playing and tonight’s shuffle stay in sync for everyone."}
          </p>

          {user.isOwner ? (
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
          ) : null}

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

          <ul className="tv-channel-bars">
            {channels.length === 0 ? (
              <li className="muted">
                {user.isOwner
                  ? "Make your first channel above — then add videos to its bar."
                  : "No channels yet."}
              </li>
            ) : (
              channels.map((channel, index) => {
                const tuned = room.currentChannelId === channel.id;
                const uploadingHere =
                  uploading && uploadChannelId === channel.id;
                return (
                  <li
                    key={channel.id}
                    className={`tv-channel-bar${tuned ? " active" : ""}`}
                  >
                    <div className="tv-channel-bar-head">
                      <button
                        type="button"
                        className="tv-channel-bar-tune"
                        disabled={!room.id || busy}
                        onClick={() => patchRoom({ channelId: channel.id })}
                      >
                        <strong>
                          <span className="tv-ch-num">
                            CH {String(index + 1).padStart(2, "0")}
                          </span>{" "}
                          {channel.title}
                          {channel.isGlobal ? (
                            <span className="tv-global-tag"> every village</span>
                          ) : null}
                        </strong>
                        <span>
                          {channel.videos.length} clip
                          {channel.videos.length === 1 ? "" : "s"}
                          {channel.videos.length === 0 ? " · empty" : " · in shuffle"}
                          {tuned ? " · on air" : ""}
                        </span>
                      </button>
                      {user.isOwner ? (
                        <button
                          type="button"
                          className="tv-video-remove"
                          onClick={() => removeChannel(channel.id)}
                          aria-label={`Remove ${channel.title}`}
                          disabled={busy || uploading}
                        >
                          ×
                        </button>
                      ) : null}
                    </div>

                    {channel.videos.length > 0 ? (
                      <ul className="tv-channel-clips">
                        {channel.videos.map((video) => {
                          const clipActive = room.currentVideoId === video.id;
                          const canDelete =
                            user.isOwner || video.uploaderId === user.id;
                          const isRenaming = renamingVideoId === video.id;
                          return (
                            <li
                              key={video.id}
                              className={`${clipActive ? "active" : ""}${
                                isRenaming ? " is-renaming" : ""
                              }`}
                            >
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
                                    className="tv-clip-pick"
                                    disabled={
                                      !room.id || busy || scheduleMode
                                    }
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
                                    <span>{formatSize(video.sizeBytes)}</span>
                                  </button>
                                  {user.isOwner ? (
                                    <button
                                      type="button"
                                      className="tv-video-rename"
                                      onClick={() => startRenameVideo(video)}
                                      disabled={busy || uploading}
                                      aria-label={`Rename ${video.title}`}
                                      title="Rename"
                                    >
                                      ✎
                                    </button>
                                  ) : null}
                                  {canDelete ? (
                                    <button
                                      type="button"
                                      className="tv-video-remove"
                                      onClick={() => removeVideo(video.id)}
                                      aria-label={`Remove ${video.title}`}
                                      disabled={busy || uploading}
                                    >
                                      ×
                                    </button>
                                  ) : null}
                                </>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="muted tv-channel-empty">
                        No videos yet — add some and they join the schedule.
                      </p>
                    )}

                    {user.isOwner ? (
                      <label
                        className={`tv-channel-add btn-primary${
                          uploading && !uploadingHere ? " is-disabled" : ""
                        }`}
                      >
                        <input
                          type="file"
                          accept="video/*,.mp4,.webm,.mov,.m4v,.avi,.mpg,.mpeg,.mkv"
                          hidden
                          multiple
                          disabled={busy || uploading}
                          onChange={(e) => {
                            // FileList is live — copy before clearing the input
                            // or the selection becomes empty and upload aborts.
                            const files = e.target.files
                              ? Array.from(e.target.files)
                              : [];
                            e.target.value = "";
                            void onUploadClips(files, channel.id);
                          }}
                        />
                        {uploadingHere
                          ? uploadPercent !== null
                            ? `Uploading… ${uploadPercent}%`
                            : "Uploading…"
                          : "Add videos"}
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
