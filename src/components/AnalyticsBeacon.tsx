"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function sessionId() {
  try {
    const key = "whim_analytics_sid";
    let id = window.sessionStorage.getItem(key);
    if (!id) {
      id = `s_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      window.sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Lightweight page-view beacon for owner analytics (privacy-safe). */
export function AnalyticsBeacon() {
  const pathname = usePathname();
  const last = useRef("");

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (pathname === last.current) return;
    last.current = pathname;
    const payload = {
      type: "page_viewed",
      path: pathname,
      referrer: document.referrer || null,
      title: document.title || null,
      sessionId: sessionId(),
      utm: new URLSearchParams(window.location.search).get("utm_source"),
    };
    try {
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/analytics/event",
          new Blob([body], { type: "application/json" })
        );
      } else {
        void fetch("/api/analytics/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        });
      }
    } catch {
      // ignore beacon failures
    }
  }, [pathname]);

  useEffect(() => {
    function onError(event: ErrorEvent) {
      try {
        void fetch("/api/analytics/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "error_occurred",
            kind: "javascript",
            message: String(event.message || "JS error").slice(0, 500),
            path: window.location.pathname,
            tag: "window.onerror",
          }),
          keepalive: true,
        });
      } catch {
        // ignore
      }
    }
    window.addEventListener("error", onError);
    return () => window.removeEventListener("error", onError);
  }, []);

  return null;
}
