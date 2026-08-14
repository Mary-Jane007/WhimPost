import { getDb } from "@/lib/db";
import {
  DEFAULT_TV_DURATION_MS,
  probeUploadDurationMs,
} from "@/lib/tvDuration";
import {
  isLfsPointerFile,
  isServingTvStandin,
} from "@/lib/tvUploadFiles";
import { UPLOAD_DIR } from "@/lib/persistentTvMedia";
import path from "path";
import fs from "fs";

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

/** Deterministic shuffle so every playthrough order is stable across polls. */
function seededShuffle(ids: string[], seed: number): string[] {
  const next = [...ids].sort(); // stable starting point
  let state = Math.floor(seed) >>> 0;
  const rand = () => {
    // Numerical Recipes LCG
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/**
 * Prefer a lineup where the same clip never airs twice in a row.
 * With only one clip on the channel this is impossible — it will repeat.
 */
function avoidStartingWith(order: string[], avoidFirstId?: string | null) {
  if (!avoidFirstId || order.length <= 1) return order;
  if (order[0] !== avoidFirstId) return order;
  const swapAt = order.findIndex((id, index) => index > 0 && id !== avoidFirstId);
  if (swapAt <= 0) return order;
  const next = [...order];
  [next[0], next[swapAt]] = [next[swapAt], next[0]];
  return next;
}

function shuffleAvoidingAdjacent(
  ids: string[],
  avoidFirstId?: string | null
): string[] {
  const unique = [...new Set(ids)];
  return avoidStartingWith(shuffleIds(unique), avoidFirstId);
}

function seededShuffleAvoidingAdjacent(
  ids: string[],
  seed: number,
  avoidFirstId?: string | null
): string[] {
  const unique = [...new Set(ids)];
  return avoidStartingWith(seededShuffle(unique, seed), avoidFirstId);
}

function sameIdOrder(a: string[], b: string[]) {
  return (
    a.length === b.length && a.every((id, index) => id === b[index])
  );
}

function toIsoFromMs(ms: number) {
  return new Date(ms).toISOString();
}

function parseEpoch(raw: number | string | null | undefined): number {
  const n = typeof raw === "string" ? Number(raw) : Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
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
  // Only air real files / direct media — never YouTube embeds on the set.
  return db
    .prepare(
      `SELECT id, title, filename, duration_ms
       FROM tv_videos
       WHERE channel_id = ?
         AND lower(coalesce(mime, '')) != 'video/youtube'
         AND (
           source_url IS NULL
           OR trim(source_url) = ''
           OR (
             lower(source_url) NOT LIKE '%youtube.com%'
             AND lower(source_url) NOT LIKE '%youtu.be%'
           )
         )
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

const DURATION_DRIFT_MS = 1500;

/**
 * Correct a clip's scheduled runtime from the real media length.
 * Used when a file ends sooner (or later) than the catalog estimate so the
 * wall-clock guide stays accurate and the next clip can start on time.
 */
export function correctVideoDurationMs(
  videoId: string,
  actualMs: number,
  opts?: { currentPositionMs?: number; force?: boolean }
): {
  ok: true;
  durationMs: number;
  changed: boolean;
} | { ok: false; error: string } {
  const videoRow = getDb()
    .prepare(
      `SELECT id, duration_ms, filename, source_url, channel_id
       FROM tv_videos WHERE id = ?`
    )
    .get(videoId) as
    | {
        id: string;
        duration_ms: number;
        filename: string;
        source_url: string | null;
        channel_id: string | null;
      }
    | undefined;
  if (!videoRow) return { ok: false, error: "Clip not found" };

  let next = Math.max(1000, Math.floor(actualMs));
  const position = Math.max(0, Math.floor(opts?.currentPositionMs || 0));
  // If the playhead is already past the reported end, close the slot now
  // instead of jumping the whole village backward.
  if (position > next) {
    next = position;
  }

  const existing = Number(videoRow.duration_ms) || 0;
  if (
    !opts?.force &&
    existing > 0 &&
    Math.abs(existing - next) < DURATION_DRIFT_MS
  ) {
    return { ok: true, durationMs: existing, changed: false };
  }

  const filename = String(videoRow.filename || "");
  const servingStandin =
    Boolean(filename) &&
    !filename.startsWith("link-") &&
    isServingTvStandin(filename);
  const primary = filename
    ? path.join(UPLOAD_DIR, path.basename(filename))
    : "";
  const primaryIsPointer =
    Boolean(primary) &&
    fs.existsSync(primary) &&
    isLfsPointerFile(primary);

  // Stand-in title cards (~12s) must never rewrite the guide — that collapsed
  // air times and remounted the same clip from 0 on a loop.
  if (
    (servingStandin || primaryIsPointer) &&
    existing > 60_000 &&
    next < 30_000
  ) {
    return { ok: true, durationMs: existing, changed: false };
  }

  // Refuse absurd shortens from onLoadedMetadata (stand-in / broken probe).
  if (
    existing > 60_000 &&
    next < Math.min(existing * 0.5, 30_000) &&
    filename &&
    !filename.startsWith("link-")
  ) {
    const probed = probeUploadDurationMs(filename);
    if (probed >= 60_000) {
      if (Math.abs(existing - probed) < DURATION_DRIFT_MS) {
        return { ok: true, durationMs: existing, changed: false };
      }
      next = probed;
    } else {
      return { ok: true, durationMs: existing, changed: false };
    }
  }

  // Ignore force-shortens that disagree with the real file — those used to
  // rewrite air times from wall-clock and restart the village broadcast.
  if (
    opts?.force &&
    existing > 60_000 &&
    next < existing * 0.85 &&
    filename &&
    !filename.startsWith("link-")
  ) {
    if (servingStandin || primaryIsPointer) {
      return { ok: true, durationMs: existing, changed: false };
    }
    const probed = probeUploadDurationMs(filename);
    if (probed > next + 5_000) {
      if (Math.abs(existing - probed) < DURATION_DRIFT_MS) {
        return { ok: true, durationMs: existing, changed: false };
      }
      next = probed;
    }
  }

  // Prefer shortening an overstated runtime (video done sooner). Still allow
  // modest lengthening when metadata was wrong the other way.
  setVideoDurationMs(videoId, next);
  return { ok: true, durationMs: next, changed: true };
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

/**
 * Full reshuffle: every clip on the channel in a new random order, with the
 * wall-clock epoch reset to now so the new lineup starts immediately.
 */
export function reshuffleChannelSchedule(channelId: string): {
  epochMs: number;
  order: string[];
  videos: Map<string, { title: string; durationMs: number; filename: string }>;
} {
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
  const knownIds = [...videos.keys()];
  const epochMs = Date.now();
  const order = shuffleAvoidingAdjacent(knownIds);
  writeChannelSchedule(channelId, epochMs, order);
  return { epochMs, order, videos };
}

/** Reshuffle every TV channel lineup (owner / maintenance). */
export function reshuffleAllChannelSchedules(): {
  channels: number;
  clips: number;
} {
  const db = getDb();
  const channels = db
    .prepare(`SELECT id FROM tv_channels`)
    .all() as { id: string }[];
  let clips = 0;
  for (const ch of channels) {
    const { order } = reshuffleChannelSchedule(ch.id);
    clips += order.length;
  }
  return { channels: channels.length, clips };
}

/**
 * Build or repair the channel lineup.
 * Every clip on the channel is always in the schedule. Brand-new clips are
 * appended without resetting the epoch (see addVideoToChannelSchedule).
 */
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

  const knownIds = [...videos.keys()];
  const knownSet = new Set(knownIds);
  let order = parseOrderJson(channel.schedule_order_json).filter((id) =>
    knownSet.has(id)
  );
  const missing = knownIds.filter((id) => !order.includes(id));

  let epochMs = parseEpoch(channel.schedule_epoch_ms);
  let dirty = false;

  if (order.length === 0 && knownIds.length > 0) {
    // Rebuild the lineup, but NEVER reset a healthy epoch to Date.now() —
    // that made every clip-replace / restore restart the broadcast at t=0.
    if (!epochMs) epochMs = Date.now();
    order = seededShuffleAvoidingAdjacent(knownIds, epochMs);
    dirty = true;
  } else if (missing.length > 0) {
    // Append stragglers at the end — do not reshuffle or restart the airing.
    // If the only clip somehow matched the tail, avoidAdjacent is a no-op for uniques.
    order = [...order, ...missing.filter((id) => !order.includes(id))];
    if (!epochMs) epochMs = Date.now();
    dirty = true;
  }

  if (!epochMs) {
    // First-time seed only.
    epochMs = Date.now();
    dirty = true;
  }

  if (
    dirty ||
    !sameIdOrder(order, parseOrderJson(channel.schedule_order_json))
  ) {
    writeChannelSchedule(channelId, epochMs, order);
  }

  return { epochMs, order, videos };
}

/**
 * Add a freshly uploaded clip to the channel schedule WITHOUT interrupting
 * whatever is currently on air. Keeps the wall-clock epoch and existing order;
 * the new clip is appended after the current cycle's remaining lineup.
 */
export function addVideoToChannelSchedule(channelId: string, videoId: string) {
  const db = getDb();
  const channel = db
    .prepare(
      `SELECT schedule_epoch_ms, schedule_order_json FROM tv_channels WHERE id = ?`
    )
    .get(channelId) as
    | { schedule_epoch_ms: number | null; schedule_order_json: string | null }
    | undefined;
  if (!channel) return;

  const rows = listChannelVideoRows(channelId);
  const knownIds = new Set(rows.map((r) => r.id));
  if (!knownIds.has(videoId)) return;

  let order = parseOrderJson(channel.schedule_order_json).filter((id) =>
    knownIds.has(id)
  );
  if (order.includes(videoId)) {
    // Already queued — leave the live airing alone.
    return;
  }

  let epochMs = parseEpoch(channel.schedule_epoch_ms);

  if (order.length === 0) {
    // First clip on an empty channel — start the clock now.
    epochMs = Date.now();
    order = [videoId];
    writeChannelSchedule(channelId, epochMs, order);
    return;
  }

  if (!epochMs) epochMs = Date.now();

  // Keep epoch + current order intact so mid-show join math stays put.
  // New uploads wait their turn after the clips already lined up.
  order = [...order, videoId];
  writeChannelSchedule(channelId, epochMs, order);
}

/**
 * After every full playthrough, reshuffle all clips and advance the epoch to
 * the start of the new cycle so air times stay continuous.
 */
function reshuffleCompletedCycles(
  channelId: string,
  epochMs: number,
  order: string[],
  videos: Map<string, { title: string; durationMs: number; filename: string }>,
  nowMs: number
): { epochMs: number; order: string[] } {
  if (order.length === 0) return { epochMs, order };

  const durations = order.map(
    (id) => videos.get(id)?.durationMs || DEFAULT_TV_DURATION_MS
  );
  const loopMs = durations.reduce((sum, d) => sum + d, 0);
  if (loopMs <= 0) return { epochMs, order };

  let elapsed = nowMs - epochMs;
  if (elapsed < 0) elapsed = 0;
  const loopsCompleted = Math.floor(elapsed / loopMs);
  if (loopsCompleted <= 0) return { epochMs, order };

  // Include every clip currently on the channel, not just the old order.
  const allIds = [...videos.keys()];
  let prevLast = order[order.length - 1] || null;
  let nextOrder = order;
  // Walk each completed cycle so the next lineup never starts on the same
  // clip that just finished (when at least two clips exist).
  for (let i = 1; i <= loopsCompleted; i += 1) {
    const seed = epochMs + i * loopMs;
    nextOrder = seededShuffleAvoidingAdjacent(allIds, seed, prevLast);
    prevLast = nextOrder[nextOrder.length - 1] || null;
  }
  const nextEpoch = epochMs + loopsCompleted * loopMs;
  writeChannelSchedule(channelId, nextEpoch, nextOrder);
  return { epochMs: nextEpoch, order: nextOrder };
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
  /** Stable wall-clock start of this airing (ISO). Survives poll jitter. */
  airStartsAt: string;
  isPlaying: boolean;
  positionUpdatedAt: string;
  schedule: TvScheduleSlot[];
};

/**
 * Resolve what a village lounge channel is airing right now from wall clock.
 * Every full playthrough reshuffles the lineup; late joiners land mid-clip.
 */
export function resolveChannelBroadcast(
  channelId: string,
  nowMs = Date.now(),
  scheduleHorizonMs = 3 * 60 * 60 * 1000
): ChannelBroadcast | null {
  const ensured = ensureChannelSchedule(channelId);
  if (ensured.order.length === 0) return null;

  const rolled = reshuffleCompletedCycles(
    channelId,
    ensured.epochMs,
    ensured.order,
    ensured.videos,
    nowMs
  );
  const epochMs = rolled.epochMs;
  const order = rolled.order;
  const videos = ensured.videos;

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

  // Derive air start from the schedule epoch so it never jitters between polls.
  const loopsCompleted = Math.floor(elapsed / loopMs);
  const airStartsAtMs = epochMs + loopsCompleted * loopMs + cursor;
  const airStartsAt = toIsoFromMs(airStartsAtMs);

  // Build upcoming schedule window from the start of the current clip.
  // Later playthroughs use the same seeded shuffle the rollover will persist.
  let slotStart = airStartsAtMs;
  const schedule: TvScheduleSlot[] = [];
  const horizonEnd = nowMs + scheduleHorizonMs;
  // Always reshuffle the full shelf — never a partial id list.
  const allIds = [...new Set([...videos.keys(), ...order])].filter((id) =>
    videos.has(id)
  );
  let cycleOrder = [...order];
  let posInCycle = currentIndex;
  let cycleIdx = 0;
  let lastEmittedId: string | null =
    currentIndex > 0 ? order[currentIndex - 1] : null;
  let guard = 0;
  while (slotStart < horizonEnd && guard < Math.max(allIds.length, 1) * 48) {
    if (posInCycle >= cycleOrder.length) {
      const prevCycleLast = cycleOrder[cycleOrder.length - 1] || lastEmittedId;
      cycleIdx += 1;
      // Seed matches reshuffleCompletedCycles: epochMs + i * loopMs
      cycleOrder = seededShuffleAvoidingAdjacent(
        allIds,
        epochMs + cycleIdx * loopMs,
        prevCycleLast
      );
      posInCycle = 0;
    }

    let videoId = cycleOrder[posInCycle];
    // Hard guard: never air the same clip twice in a row when another exists.
    if (
      allIds.length > 1 &&
      lastEmittedId &&
      videoId === lastEmittedId
    ) {
      const swapAt = cycleOrder.findIndex(
        (id, index) => index >= posInCycle && id !== lastEmittedId
      );
      if (swapAt >= posInCycle) {
        const next = [...cycleOrder];
        [next[posInCycle], next[swapAt]] = [next[swapAt], next[posInCycle]];
        cycleOrder = next;
        videoId = cycleOrder[posInCycle];
      } else {
        // Advance to a fresh cycle rather than repeating.
        posInCycle = cycleOrder.length;
        guard += 1;
        continue;
      }
    }

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
        isCurrent:
          videoId === currentId &&
          startsAtMs === airStartsAtMs &&
          startsAtMs <= nowMs &&
          nowMs < endsAtMs,
      });
      lastEmittedId = videoId;
    }
    slotStart = endsAtMs;
    posInCycle += 1;
    guard += 1;
  }

  // Keep milliseconds so late joiners don't overshoot start by a full second.
  const positionUpdatedAt = new Date(nowMs)
    .toISOString()
    .replace("T", " ")
    .replace("Z", "");

  return {
    videoId: currentId,
    title: current.title,
    durationMs: current.durationMs,
    positionMs: Math.min(positionMs, Math.max(0, current.durationMs - 250)),
    airStartsAt,
    isPlaying: true,
    positionUpdatedAt,
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

/** Re-probe a file clip and store the accurate runtime. */
export function refreshProbedDurationMs(videoId: string, filename: string) {
  if (!filename || filename.startsWith("link-")) return null;
  const probed = probeUploadDurationMs(filename);
  setVideoDurationMs(videoId, probed);
  return probed;
}

export function probeAndStoreDuration(videoId: string, filename: string) {
  const durationMs = probeUploadDurationMs(filename);
  setVideoDurationMs(videoId, durationMs);
  return durationMs;
}
