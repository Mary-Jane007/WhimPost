(function () {
  if (window.__whimTvSoundBoot) return;
  window.__whimTvSoundBoot = true;

  function unlock() {
    var v = document.querySelector("video.tv-video");
    if (v) {
      v.muted = false;
      v.defaultMuted = false;
      try { v.volume = 1; } catch (e) {}
      try { v.play().catch(function () {}); } catch (e) {}
    }

    var a = document.querySelector('audio[data-tv-fallback="true"]');
    if (a) {
      a.muted = false;
      a.volume = 0.7;
      try { a.play().catch(function () {}); } catch (e) {}
    }
  }

  document.addEventListener("pointerdown", unlock, { once: true, capture: true });
  document.addEventListener("touchstart", unlock, { once: true, capture: true });
  document.addEventListener("keydown", unlock, { once: true, capture: true });

  window.__whimTvUnmute = unlock;
})();
