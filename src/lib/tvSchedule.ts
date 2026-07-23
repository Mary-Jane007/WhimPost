import { getDb } from "@/lib/db";
import {
  DEFAULT_TV_DURATION_MS,
  probeUploadDurationMs,
} from "@/lib/tvDuration";

export type TvScheduleSlot = {
  videoId: string;
  title: string;
  durationMs: number;
  startsAt: string;
  endsAt: string;
  isCurrent: boolean;
};

type ScheduleVideoRow = {
  id: string;
  title: string;
  filename: string;
  duration_ms: number | null;
};

function shuffleIds(ids: string[]): string[] {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function toIsoFromMs(ms: number) {
  return new Date(ms).toISOString();
}

function parseEpoch(raw: number | string | null | undefined): number {
  const n = typeof raw === "string" ? Number(raw) : Number(raw);
  if (!Number.isFinite(n) || n <= 0) return Date.now();
  return Math.floor(n);
}

function parseOrderJson(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

function listChannelVideoRows(channelId: string): ScheduleVideoRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, title, filename, duration_ms
       FROM tv_videos
       WHERE channel_id = ?
       ORDER BY created_at ASC`
    )
    .all(channelId) as ScheduleVideoRow[];
}

function ensureVideoDuration(row: ScheduleVideoRow): number {
  const existing = Number(row.duration_ms) || 0;
  if (existing > 0) return existing;
  const probed = probeUploadDurationMs(row.filename);
  const db = getDb();
  db.prepare(`UPDATE tv_videos SET duration_ms = ? WHERE id = ?`).run(
    probed,
    row.id
  );
  row.duration_ms = probed;
  return probed;
}

function writeChannelSchedule(
  channelId: string,
  epochMs: number,
  order: string[]
) {
  const db = getDb();
  db.prepare(
    `UPDATE tv_channels
     SET schedule_epoch_ms = ?, schedule_order_json = ?
     WHERE id = ?`
  ).run(epochMs, JSON.stringify(order), channelId);
}

/** Build or repair a shuffled looping schedule for a channel. */
export function ensureChannelSchedule(channelId: string): {
  epochMs: number;
  order: string[];
  videos: Map<string, { title: string; durationMs: number; filename: string }>;
} {
  const db = getDb();
  const channel = db
    .prepare(
      `SELECT schedule_epoch_ms, schedule_order_json FROM tv_channels WHERE id = ?`
    )
    .get(channelId) as
    | { schedule_epoch_ms: number | null; schedule_order_json: string | null }
    | undefined;

  if (!channel) {
    return { epochMs: Date.now(), order: [], videos: new Map() };
  }

  const rows = listChannelVideoRows(channelId);
  const videos = new Map<
    string,
    { title: string; durationMs: number; filename: string }
  >();
  for (const row of rows) {
    const durationMs = ensureVideoDuration(row);
    videos.set(row.id, {
      title: row.title,
      durationMs,
      filename: row.filename,
    });
  }

  const knownIds = new Set(videos.keys());
  let order = parseOrderJson(channel.schedule_order_json).filter((id) =>
    knownIds.has(id)
  );
  const missing = [...knownIds].filter((id) => !order.includes(id));

  let epochMs = parseEpoch(channel.schedule_epoch_ms);

  if (order.length === 0 && knownIds.size > 0) {
    order = shuffleIds([...knownIds]);
    epochMs = Date.now();
    writeChannelSchedule(channelId, epochMs, order);
  } else if (missing.length > 0) {
    // New clips join the lineup without reshuffling existing air times.
    order = [...order, ...shuffleIds(missing)];
    if (!channel.schedule_epoch_ms) epochMs = Date.now();
    writeChannelSchedule(channelId, epochMs, order);
  } else if (
    order.length !== parseOrderJson(channel.schedule_order_json).length ||
    !channel.schedule_epoch_ms
  ) {
    writeChannelSchedule(channelId, epochMs, order);
  }

  return { epochMs, order, videos };
}

/** Append a freshly uploaded clip into the channel schedule (shuffled among new). */
export function addVideoToChannelSchedule(channelId: string, videoId: string) {
  ensureChannelSchedule(channelId);
  const db = getDb();
  const channel = db
    .prepare(
      `SELECT schedule_epoch_ms, schedule_order_json FROM tv_channels WHERE id = ?`
    )
    .get(channelId) as
    | { schedule_epoch_ms: number | null; schedule_order_json: string | null }
    | undefined;
  if (!channel) return;

  const order = parseOrderJson(channel.schedule_order_json);
  if (order.includes(videoId)) return;
  // Insert at a random index so new clips are shuffled into the lineup.
  const insertAt = Math.floor(Math.random() * (order.length + 1));
  order.splice(insertAt, 0, videoId);
  const epochMs = parseEpoch(channel.schedule_epoch_ms) || Date.now();
  writeChannelSchedule(channelId, epochMs || Date.now(), order);
}

export function removeVideoFromChannelSchedule(
  channelId: string,
  videoId: string
) {
  const db = getDb();
  const channel = db
    .prepare(
      `SELECT schedule_epoch_ms, schedule_order_json FROM tv_channels WHERE id = ?`
    )
    .get(channelId) as
    | { schedule_epoch_ms: number | null; schedule_order_json: string | null }
    | undefined;
  if (!channel) return;
  const order = parseOrderJson(channel.schedule_order_json).filter(
    (id) => id !== videoId
  );
  writeChannelSchedule(
    channelId,
    parseEpoch(channel.schedule_epoch_ms),
    order
  );
}

export type ChannelBroadcast = {
  videoId: string;
  title: string;
  durationMs: number;
  positionMs: number;
  isPlaying: boolean;
  positionUpdatedAt: string;
  schedule: TvScheduleSlot[];
};

/**
 * Resolve what a village lounge channel is airing right now from wall clock.
 * Playlist loops forever; late joiners land mid-clip.
 */
export function resolveChannelBroadcast(
  channelId: string,
  nowMs = Date.now(),
  scheduleHorizonMs = 3 * 60 * 60 * 1000
): ChannelBroadcast | null {
  const { epochMs, order, videos } = ensureChannelSchedule(channelId);
  if (order.length === 0) return null;

  const durations = order.map(
    (id) => videos.get(id)?.durationMs || DEFAULT_TV_DURATION_MS
  );
  const loopMs = durations.reduce((sum, d) => sum + d, 0);
  if (loopMs <= 0) return null;

  let elapsed = nowMs - epochMs;
  if (elapsed < 0) elapsed = 0;
  const offsetInLoop = elapsed % loopMs;

  let cursor = 0;
  let currentIndex = 0;
  let positionMs = 0;
  for (let i = 0; i < order.length; i += 1) {
    const dur = durations[i];
    if (offsetInLoop < cursor + dur) {
      currentIndex = i;
      positionMs = Math.floor(offsetInLoop - cursor);
      break;
    }
    cursor += dur;
  }

  const currentId = order[currentIndex];
  const current = videos.get(currentId);
  if (!current) return null;

  // Build upcoming schedule window from the start of the current clip.
  let slotStart =
    nowMs - positionMs;
  // Align slotStart to absolute timeline for display of past/current/future.
  const schedule: TvScheduleSlot[] = [];
  const horizonEnd = nowMs + scheduleHorizonMs;
  let idx = currentIndex;
  let guard = 0;
  while (slotStart < horizonEnd && guard < order.length * 40) {
    const videoId = order[idx % order.length];
    const meta = videos.get(videoId);
    const durationMs = meta?.durationMs || DEFAULT_TV_DURATION_MS;
    const startsAtMs = slotStart;
    const endsAtMs = slotStart + durationMs;
    if (endsAtMs > nowMs - 1000) {
      schedule.push({
        videoId,
        title: meta?.title || "Untitled clip",
        durationMs,
        startsAt: toIsoFromMs(startsAtMs),
        endsAt: toIsoFromMs(endsAtMs),
        isCurrent: videoId === currentId && startsAtMs <= nowMs && nowMs < endsAtMs,
      });
    }
    slotStart = endsAtMs;
    idx += 1;
    guard += 1;
  }

  // Ensure the now-playing row is marked current.
  for (const slot of schedule) {
    slot.isCurrent =
      slot.videoId === currentId &&
      Date.parse(slot.startsAt) <= nowMs &&
      nowMs < Date.parse(slot.endsAt);
  }

  return {
    videoId: currentId,
    title: current.title,
    durationMs: current.durationMs,
    positionMs: Math.min(positionMs, Math.max(0, current.durationMs - 250)),
    isPlaying: true,
    // Match SQLite UTC datetime so clients can treat it as Zulu.
    positionUpdatedAt: new Date(nowMs)
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d{3}Z$/, ""),
    schedule: schedule.slice(0, 24),
  };
}

/** Persist probed duration when a file lands on disk. */
export function setVideoDurationMs(videoId: string, durationMs: number) {
  const db = getDb();
  db.prepare(`UPDATE tv_videos SET duration_ms = ? WHERE id = ?`).run(
    Math.max(1000, Math.floor(durationMs)),
    videoId
  );
}

export function probeAndStoreDuration(videoId: string, filename: string) {
  const durationMs = probeUploadDurationMs(filename);
  setVideoDurationMs(videoId, durationMs);
  return durationMs;
}
