/* Format TV guide air times in the viewer's local (laptop) timezone.
 * Runs without React hydration — same approach as the sound boot script.
 */
(function () {
  if (window.__whimTvGuideLocal) return;
  window.__whimTvGuideLocal = true;

  function formatLocal(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    try {
      return d.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
    } catch (e) {
      return d.toLocaleTimeString();
    }
  }

  function apply() {
    document.querySelectorAll("time[data-tv-guide-time]").forEach(function (el) {
      var iso = el.getAttribute("datetime");
      if (!iso) return;
      var next = formatLocal(iso);
      if (el.textContent !== next) el.textContent = next;
    });
  }

  function onReady() {
    apply();
    if (typeof MutationObserver !== "undefined" && document.body) {
      var obs = new MutationObserver(function () {
        apply();
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }

  // Re-apply when the tab becomes visible (timezone / DST edge cases).
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") apply();
  });

  window.__whimTvFormatGuideTimes = apply;
})();
