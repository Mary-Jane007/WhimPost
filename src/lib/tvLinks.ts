/** Parse and classify TV Corner link sources (direct video URL or YouTube). */

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

const DIRECT_EXT_MIME: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/x-m4v",
  webm: "video/webm",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  mpg: "video/mpeg",
  mpeg: "video/mpeg",
  mkv: "video/x-matroska",
};

export type TvSourceKind = "file" | "direct" | "youtube";

export type ParsedTvLink =
  | {
      ok: true;
      kind: "youtube";
      sourceUrl: string;
      youtubeId: string;
      mime: string;
      titleHint: string;
    }
  | {
      ok: true;
      kind: "direct";
      sourceUrl: string;
      mime: string;
      titleHint: string;
    }
  | { ok: false; error: string };

function stripWww(host: string) {
  return host.replace(/^www\./i, "").toLowerCase();
}

export function extractYoutubeId(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  const host = stripWww(url.hostname);
  if (host === "youtu.be") {
    const id = url.pathname.replace(/^\//, "").split("/")[0];
    return id && /^[\w-]{6,}$/.test(id) ? id : null;
  }
  if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase()) && host !== "youtube.com") {
    return null;
  }
  if (url.pathname.startsWith("/embed/")) {
    const id = url.pathname.slice("/embed/".length).split("/")[0];
    return id && /^[\w-]{6,}$/.test(id) ? id : null;
  }
  if (url.pathname.startsWith("/shorts/")) {
    const id = url.pathname.slice("/shorts/".length).split("/")[0];
    return id && /^[\w-]{6,}$/.test(id) ? id : null;
  }
  if (url.pathname.startsWith("/live/")) {
    const id = url.pathname.slice("/live/".length).split("/")[0];
    return id && /^[\w-]{6,}$/.test(id) ? id : null;
  }
  const v = url.searchParams.get("v");
  if (v && /^[\w-]{6,}$/.test(v)) return v;
  return null;
}

export function youtubeEmbedSrc(
  youtubeId: string,
  opts?: { startSec?: number; autoplay?: boolean }
) {
  // Prefer a quiet "set" look: no related videos, no keyboard, no chrome on hover.
  // Prefer uploading a real file when possible — embeds still show YouTube branding
  // in some browsers even with these flags.
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    controls: "0",
    disablekb: "1",
    fs: "0",
    iv_load_policy: "3",
    cc_load_policy: "0",
  });
  if (opts?.autoplay) params.set("autoplay", "1");
  const start = Math.max(0, Math.floor(opts?.startSec || 0));
  if (start > 0) params.set("start", String(start));
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?${params}`;
}

function titleFromUrl(url: URL) {
  const last = url.pathname.split("/").filter(Boolean).pop() || "";
  const decoded = decodeURIComponent(last).replace(/\.[^.]+$/, "");
  const cleaned = decoded.replace(/[-_]+/g, " ").trim();
  return cleaned.slice(0, 80) || "Linked clip";
}

export function parseTvLink(raw: string): ParsedTvLink {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Paste a video link first" };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return {
      ok: false,
      error: "That does not look like a full link (include https://…)",
    };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "Links must start with http:// or https://" };
  }

  const youtubeId = extractYoutubeId(trimmed);
  if (youtubeId) {
    return {
      ok: true,
      kind: "youtube",
      sourceUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
      youtubeId,
      mime: "video/youtube",
      titleHint: `YouTube · ${youtubeId}`,
    };
  }

  const ext = (url.pathname.split(".").pop() || "").toLowerCase();
  const mime = DIRECT_EXT_MIME[ext];
  if (mime) {
    return {
      ok: true,
      kind: "direct",
      sourceUrl: url.toString(),
      mime,
      titleHint: titleFromUrl(url),
    };
  }

  // Allow query-string CDNs without a clear extension — treat as MP4 stream.
  // Owner can still paste known-good video CDN URLs.
  if (
    /video|media|stream|cdn|cloudfront|blob\.core/i.test(url.hostname + url.pathname)
  ) {
    return {
      ok: true,
      kind: "direct",
      sourceUrl: url.toString(),
      mime: "video/mp4",
      titleHint: titleFromUrl(url),
    };
  }

  return {
    ok: false,
    error:
      "Use a YouTube link, or a direct video URL (…mp4, webm, mov, m4v, avi, mpeg, mkv)",
  };
}

/** Default airtime when duration cannot be probed (10 minutes). */
export const DEFAULT_LINK_DURATION_MS = 10 * 60 * 1000;

export function parseDurationMinutesInput(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number.parseFloat(String(raw));
  if (!Number.isFinite(n) || n <= 0) return null;
  // Clamp between 30 seconds and 12 hours.
  const minutes = Math.min(12 * 60, Math.max(0.5, n));
  return Math.round(minutes * 60_000);
}
