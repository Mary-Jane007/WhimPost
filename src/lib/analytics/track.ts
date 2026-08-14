import { getDb } from "@/lib/db";
import { newId } from "@/lib/requireOwner";
import type { AnalyticsEventName } from "@/lib/analytics/types";

export type TrackInput = {
  event: AnalyticsEventName;
  userId?: string | null;
  villageId?: string | null;
  path?: string | null;
  referrer?: string | null;
  source?: string | null;
  device?: string | null;
  browser?: string | null;
  country?: string | null;
  sessionId?: string | null;
  durationMs?: number | null;
  meta?: Record<string, unknown>;
};

/** Persist a product analytics event (privacy-safe meta only). */
export function trackAnalyticsEvent(input: TrackInput): void {
  try {
    const db = getDb();
    db.prepare(
      `INSERT INTO analytics_events (
        id, event_name, user_id, village_id, path, referrer, source,
        device, browser, country, session_id, duration_ms, meta_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      newId("evt"),
      String(input.event).slice(0, 80),
      input.userId || null,
      input.villageId || null,
      (input.path || "").slice(0, 240) || null,
      (input.referrer || "").slice(0, 240) || null,
      (input.source || "").slice(0, 80) || null,
      (input.device || "").slice(0, 40) || null,
      (input.browser || "").slice(0, 40) || null,
      (input.country || "").slice(0, 40) || null,
      input.sessionId || null,
      input.durationMs ?? null,
      JSON.stringify(input.meta || {})
    );
  } catch (err) {
    console.error("[analytics] track failed:", err);
  }
}

export function trackAnalyticsError(input: {
  kind: string;
  message: string;
  path?: string | null;
  statusCode?: number | null;
  userId?: string | null;
  meta?: Record<string, unknown>;
}): void {
  try {
    const db = getDb();
    db.prepare(
      `INSERT INTO analytics_errors (
        id, kind, message, path, status_code, user_id, meta_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      newId("err"),
      String(input.kind).slice(0, 80),
      String(input.message).slice(0, 500),
      (input.path || "").slice(0, 240) || null,
      input.statusCode ?? null,
      input.userId || null,
      JSON.stringify(input.meta || {})
    );
  } catch (err) {
    console.error("[analytics] error track failed:", err);
  }
}

export function inferDevice(ua: string): string {
  const u = ua.toLowerCase();
  if (/ipad|tablet/.test(u)) return "tablet";
  if (/mobi|iphone|android/.test(u)) return "mobile";
  return "desktop";
}

export function inferBrowser(ua: string): string {
  const u = ua.toLowerCase();
  if (u.includes("edg/")) return "Edge";
  if (u.includes("chrome/") && !u.includes("edg/")) return "Chrome";
  if (u.includes("safari/") && !u.includes("chrome/")) return "Safari";
  if (u.includes("firefox/")) return "Firefox";
  return "Other";
}

export function inferSource(referrer: string | null, utm?: string | null): string {
  if (utm) return utm.slice(0, 40);
  if (!referrer) return "Direct";
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes("google.") || host.includes("bing.") || host.includes("duckduckgo.")) {
      return "Search";
    }
    if (host.includes("instagram.")) return "Instagram";
    if (host.includes("tiktok.")) return "TikTok";
    if (
      host.includes("twitter.") ||
      host.includes("x.com") ||
      host.includes("facebook.") ||
      host.includes("reddit.")
    ) {
      return "Social";
    }
    return "Referral";
  } catch {
    return "Other";
  }
}
