/* Village TV unmute — runs without React hydration.
 * Persists the user's sound choice and re-applies it when React remounts
 * the <video> or re-sets muted=true on poll/re-render.
 */
(function () {
  if (window.__whimTvSoundBoot) return;
  window.__whimTvSoundBoot = true;

  var STORAGE_KEY = "whim-tv-sound";
  var HOLD_MS = 250;
  var holdTimer = null;

  function readWantSound() {
    try {
      if (window.__whimTvWantSound === true) return true;
      if (window.__whimTvWantSound === false) return false;
      return sessionStorage.getItem(STORAGE_KEY) === "on";
    } catch (e) {
      return window.__whimTvWantSound === true;
    }
  }

  function writeWantSound(on) {
    var next = !!on;
    var prev = window.__whimTvWantSound;
    window.__whimTvWantSound = next;
    try {
      if (next) sessionStorage.setItem(STORAGE_KEY, "on");
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    if (prev === next) return;
    try {
      window.dispatchEvent(
        new CustomEvent("whim-tv-sound", { detail: { muted: !next } })
      );
    } catch (e) {}
  }

  function videoEl() {
    return document.querySelector("video.tv-video");
  }

  function setPrompt(visible) {
    document.querySelectorAll(".tv-sound-prompt").forEach(function (el) {
      var next = visible ? "" : "none";
      if (el.style.display !== next) el.style.display = next;
    });
    document.querySelectorAll(".tv-screen-shield").forEach(function (el) {
      var has = el.classList.contains("tv-screen-shield-muted");
      if (visible && !has) el.classList.add("tv-screen-shield-muted");
      if (!visible && has) el.classList.remove("tv-screen-shield-muted");
      if (visible) {
        if (el.getAttribute("role") !== "button") {
          el.setAttribute("role", "button");
          el.setAttribute("tabindex", "0");
          el.setAttribute("aria-label", "Turn sound on");
        }
      } else if (el.hasAttribute("role")) {
        el.removeAttribute("role");
        el.removeAttribute("tabindex");
        el.removeAttribute("aria-label");
      }
    });
    document.querySelectorAll("[data-tv-sound-toggle]").forEach(function (btn) {
      var label = btn.querySelector("[data-tv-sound-label]");
      var pressed = btn.getAttribute("aria-pressed");
      if (visible) {
        if (pressed !== "false") {
          btn.setAttribute("aria-label", "Turn sound on");
          btn.setAttribute("aria-pressed", "false");
          btn.classList.remove("tv-knob-lit");
          if (label) label.textContent = "Sound";
        }
      } else if (pressed !== "true") {
        btn.setAttribute("aria-label", "Turn sound off");
        btn.setAttribute("aria-pressed", "true");
        btn.classList.add("tv-knob-lit");
        if (label) label.textContent = "Mute";
      }
    });
  }

  function applyToVideo(v, muted) {
    if (!v) return;
    v.muted = muted;
    if (!muted) {
      try {
        v.volume = 1;
      } catch (e) {}
      // Some browsers keep a zeroed volume after muted autoplay.
      try {
        if (v.volume < 0.05) v.volume = 1;
      } catch (e) {}
    }
  }

  function ensureApplied() {
    var want = readWantSound();
    var v = videoEl();
    if (!v) return;
    if (!want) {
      setPrompt(true);
      return;
    }
    if (v.muted || v.volume < 0.05) {
      applyToVideo(v, false);
      try {
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      } catch (e) {}
    }
    setPrompt(false);
  }

  function startHold() {
    if (holdTimer) return;
    holdTimer = window.setInterval(function () {
      if (!readWantSound()) {
        window.clearInterval(holdTimer);
        holdTimer = null;
        return;
      }
      ensureApplied();
    }, HOLD_MS);
  }

  function unmute() {
    writeWantSound(true);
    applyToVideo(videoEl(), false);
    var v = videoEl();
    if (v) {
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    }
    setPrompt(false);
    startHold();
    return true;
  }

  function mute() {
    writeWantSound(false);
    if (holdTimer) {
      window.clearInterval(holdTimer);
      holdTimer = null;
    }
    applyToVideo(videoEl(), true);
    setPrompt(true);
    return true;
  }

  var lastGestureAt = 0;

  function onGesture(e) {
    var t = e.target;
    if (!t || !t.closest) return;
    // pointerdown + click both fire for one tap — only honor the first.
    var now = Date.now();
    if (now - lastGestureAt < 400) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    var toggle = t.closest("[data-tv-sound-toggle]");
    if (toggle) {
      lastGestureAt = now;
      if (readWantSound()) mute();
      else unmute();
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (
      t.closest(".tv-screen-shield-muted") ||
      t.closest(".tv-sound-prompt") ||
      (!readWantSound() && t.closest(".tv-screen"))
    ) {
      // First tap on the tube glass turns sound on (autoplay started muted).
      if (!readWantSound()) {
        lastGestureAt = now;
        unmute();
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }

  // pointerdown is the gesture browsers credit for unmuting autoplay.
  // Still listen for click as a fallback (keyboard / older browsers).
  document.addEventListener("pointerdown", onGesture, true);
  document.addEventListener("click", onGesture, true);

  // Re-apply when React swaps the <video> for a new airing.
  // Only react to added <video> nodes — setPrompt() mutates classes and would
  // otherwise feedback-loop through a broad MutationObserver.
  if (typeof MutationObserver !== "undefined") {
    var obs = new MutationObserver(function (records) {
      if (!readWantSound()) return;
      for (var i = 0; i < records.length; i++) {
        var added = records[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (!node || node.nodeType !== 1) continue;
          if (
            (node.matches && node.matches("video.tv-video")) ||
            (node.querySelector && node.querySelector("video.tv-video"))
          ) {
            ensureApplied();
            return;
          }
        }
      }
    });
    var startObs = function () {
      if (!document.body) return;
      obs.observe(document.body, { childList: true, subtree: true });
    };
    if (document.body) startObs();
    else document.addEventListener("DOMContentLoaded", startObs);
  }

  // Restore prior choice after navigation / remount.
  if (readWantSound()) {
    startHold();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", ensureApplied);
    } else {
      ensureApplied();
    }
  }

  window.__whimTvUnmute = unmute;
  window.__whimTvMute = mute;
})();
