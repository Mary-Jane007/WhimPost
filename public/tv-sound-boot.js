/* Village TV — keep sound on. No Sound/Mute UI or "tap for sound" prompt.
 *
 * Never call play() just because <video> appeared. That raced the mid-show
 * schedule seek and made the broadcast look like it restarted from the
 * opening every refresh. React joins the live air slot, then plays.
 * This script only unmutes (and resumes on a real user gesture).
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
    if (opts && opts.play) {
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

  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("keydown", unlock, true);

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
            // Unmute only — do not play() before the schedule seek lands.
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
