"use client";

import { useEffect } from "react";

/**
 * Registers the WhimPost service worker so visited pages are remembered
 * and the site can open instantly (installable / app-like) even when
 * Render is still waking up.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          // Pick up a waiting worker quickly after deploy.
          if (reg.waiting) {
            reg.waiting.postMessage("SKIP_WAITING");
          }
          reg.addEventListener("updatefound", () => {
            const worker = reg.installing;
            if (!worker) return;
            worker.addEventListener("statechange", () => {
              if (worker.state === "installed" && navigator.serviceWorker.controller) {
                worker.postMessage("SKIP_WAITING");
              }
            });
          });
        })
        .catch(() => {
          /* SW optional — site still works without it */
        });
    };

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
