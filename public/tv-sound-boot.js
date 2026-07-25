/* Village TV — keep sound on. No Sound/Mute UI or "tap for sound" prompt.
 * Browsers may block unmuted autoplay; the first real pointer/key gesture
 * unlocks audio silently. While the picture is playing, we keep it unmuted.
 */
(function () {
  if (window.__whimTvSoundBoot) return;
  window.__whimTvSoundBoot = true;
  window.__whimTvWantSound = true;

  function videoEl() {
    return document.querySelector("video.tv-video");
  }

  function applySound() {
    var v = videoEl();
    if (!v) return false;
    v.muted = false;
    try {
      v.volume = 1;
    } catch (e) {}
    try {
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
    return true;
  }

  function unlock() {
    window.__whimTvWantSound = true;
    applySound();
  }

  // Any real user gesture unlocks audio (no prompt / no Sound knob).
  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("keydown", unlock, true);

  // Re-apply when React swaps the <video> for a new airing.
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
            applySound();
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

  // If something remutes a playing broadcast, turn sound back on.
  window.setInterval(function () {
    var v = videoEl();
    if (!v || v.paused) return;
    if (v.muted || v.volume < 0.05) applySound();
  }, 500);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applySound);
  } else {
    applySound();
  }

  window.__whimTvUnmute = unlock;
})();
