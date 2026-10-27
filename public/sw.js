/* WhimPost service worker — remember pages & open instantly offline/slow Render. */
const VERSION = "whimpost-pwa-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const PAGE_CACHE = `${VERSION}-pages`;
const ASSET_CACHE = `${VERSION}-assets`;

const PRECACHE_URLS = [
  "/",
  "/login",
  "/village",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "no-cache" });
            if (res.ok) await cache.put(url, res.clone());
          } catch {
            /* first boot may race cold start — ignore */
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("whimpost-pwa-") && !key.startsWith(VERSION))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

function isAssetRequest(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/stickers/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/characters/") ||
    url.pathname.startsWith("/cottages/") ||
    url.pathname.startsWith("/villages/") ||
    url.pathname.startsWith("/vendor/") ||
    url.pathname.startsWith("/sounds/") ||
    url.pathname.startsWith("/meeting-bench/") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".wav")
  );
}

function isApiRequest(url) {
  return url.pathname.startsWith("/api/");
}

function isNavigationRequest(request) {
  return (
    request.mode === "navigate" ||
    (request.method === "GET" &&
      (request.headers.get("accept") || "").includes("text/html"))
  );
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res && res.ok) await cache.put(request, res.clone());
  return res;
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      await cache.put(request, res.clone());
      const shell = await caches.open(SHELL_CACHE);
      // Keep a copy of known routes warm for instant reopen.
      const url = new URL(request.url);
      if (PRECACHE_URLS.includes(url.pathname)) {
        await shell.put(url.pathname, res.clone());
      }
    }
    return res;
  } catch {
    const cached =
      (await cache.match(request)) ||
      (await caches.open(SHELL_CACHE).then((c) => c.match(request))) ||
      (await caches.open(SHELL_CACHE).then((c) => c.match("/offline")));
    if (cached) return cached;
    return new Response(
      "<!doctype html><title>WhimPost</title><p>Opening the woods…</p>",
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache auth/mutations-ish APIs; health can be network-only.
  if (isApiRequest(url)) {
    if (url.pathname === "/api/health") {
      event.respondWith(fetch(request).catch(() => new Response("ok")));
      return;
    }
    return;
  }

  if (isAssetRequest(url)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirstPage(request));
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
