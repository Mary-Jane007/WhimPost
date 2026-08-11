/* Village TV — muted autoplay (browsers allow this), then unlock audio on
 * the first real pointer/key gesture. No Sound/Mute UI or tap prompt.
 * Do not unmute before a gesture or the browser will pause/block playback.
 */
(function () {
  if (window.__whimTvSoundBoot) return;
  window.__whimTvSoundBoot = true;
  window.__whimTvUnlocked = false;
  window.__whimTvWantSound = false;

  function videoEl() {
    return document.querySelector("video.tv-video");
  }

  function applySound() {
    if (!window.__whimTvUnlocked) return false;
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
    window.__whimTvUnlocked = true;
    window.__whimTvWantSound = true;
    applySound();
    try {
      document.dispatchEvent(new Event("whimtv-audio-unlocked"));
    } catch (e) {}
  }

  // Any real user gesture unlocks audio (no prompt / no Sound knob).
  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("keydown", unlock, true);

  // Re-apply when React swaps the <video> for a new airing — only after unlock.
  if (typeof MutationObserver !== "undefined") {
    var obs = new MutationObserver(function (records) {
      if (!window.__whimTvUnlocked) return;
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

  // Keep sound on after unlock if something remutes a playing broadcast.
  window.setInterval(function () {
    if (!window.__whimTvUnlocked) return;
    var v = videoEl();
    if (!v || v.paused) return;
    if (v.muted || v.volume < 0.05) applySound();
  }, 500);

  window.__whimTvUnmute = unlock;
})();
