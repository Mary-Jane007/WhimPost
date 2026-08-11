/* Village TV — keep sound on. No Sound/Mute UI or "tap for sound" prompt.
 * Browsers may block unmuted autoplay; the first real pointer/key gesture
 * unlocks audio silently. Playback itself is owned by React so the village
 * set can seek to the live schedule before play() — forcing play() on insert
 * used to stream opening credits mid-show.
 */
(function () {
  if (window.__whimTvSoundBoot) return;
  window.__whimTvSoundBoot = true;
  window.__whimTvWantSound = true;

  function videoEl() {
    return document.querySelector("video.tv-video");
  }

  function applySound(opts) {
    var v = videoEl();
    if (!v) return false;
    v.muted = false;
    try {
      v.volume = 1;
    } catch (e) {}
    var allowPlay = opts && opts.play;
    var onAir = v.getAttribute("data-tv-on-air") === "1";
    // Never start playback just because the node appeared — that raced the
    // mid-show seek and made the broadcast look like it restarted.
    if (allowPlay && onAir) {
      try {
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      } catch (e) {}
    }
    return true;
  }

  function unlock() {
    window.__whimTvWantSound = true;
    applySound({ play: true });
  }

  // Any real user gesture unlocks audio (no prompt / no Sound knob).
  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("keydown", unlock, true);

  // Re-apply unmute when React swaps the <video> for a new airing.
  if (typeof MutationObserver !== "undefined") {
    var obs = new MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var added = records[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (!node || node.nodeType !== 1) continue;
          if (
            (node.matches && node.matches("video.tv-video")) ||
            (node.querySelector && node.querySelector("video.tv-video"))
          ) {
            applySound({ play: false });
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

  // If something remutes a playing on-air broadcast, turn sound back on.
  window.setInterval(function () {
    var v = videoEl();
    if (!v || v.paused) return;
    if (v.muted || v.volume < 0.05) applySound({ play: false });
  }, 500);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      applySound({ play: false });
    });
  } else {
    applySound({ play: false });
  }

  window.__whimTvUnmute = unlock;
})();
