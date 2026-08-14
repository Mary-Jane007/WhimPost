import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  inferBrowser,
  inferDevice,
  inferSource,
  trackAnalyticsError,
  trackAnalyticsEvent,
} from "@/lib/analytics/track";

export const runtime = "nodejs";

/** Public beacon for privacy-safe page views / client errors (no letter bodies). */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body || typeof body.type !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ua = req.headers.get("user-agent") || "";
  const referrer =
    (typeof body.referrer === "string" && body.referrer) ||
    req.headers.get("referer") ||
    null;
  const path = typeof body.path === "string" ? body.path : null;
  const sessionId =
    typeof body.sessionId === "string" ? body.sessionId.slice(0, 64) : null;
  const utm = typeof body.utm === "string" ? body.utm : null;

  if (body.type === "page_viewed") {
    trackAnalyticsEvent({
      event: "page_viewed",
      userId: user?.id || null,
      villageId: user?.villageId || null,
      path,
      referrer,
      source: inferSource(referrer, utm),
      device: inferDevice(ua),
      browser: inferBrowser(ua),
      sessionId,
      meta: {
        title: typeof body.title === "string" ? body.title.slice(0, 120) : undefined,
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.type === "error_occurred") {
    trackAnalyticsError({
      kind: typeof body.kind === "string" ? body.kind : "client",
      message:
        typeof body.message === "string"
          ? body.message
          : "Client error",
      path,
      userId: user?.id || null,
      meta: {
        // Never store raw user content — only short safe tags.
        tag: typeof body.tag === "string" ? body.tag.slice(0, 80) : undefined,
      },
    });
    trackAnalyticsEvent({
      event: "error_occurred",
      userId: user?.id || null,
      villageId: user?.villageId || null,
      path,
      sessionId,
      device: inferDevice(ua),
      browser: inferBrowser(ua),
    });
    return NextResponse.json({ ok: true });
  }

  if (body.type === "feature" && typeof body.event === "string") {
    trackAnalyticsEvent({
      event: body.event.slice(0, 80),
      userId: user?.id || null,
      villageId: user?.villageId || null,
      path,
      sessionId,
      device: inferDevice(ua),
      browser: inferBrowser(ua),
      meta:
        body.meta && typeof body.meta === "object"
          ? (body.meta as Record<string, unknown>)
          : {},
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
}
