(function () {
  if (window.__whimLibraryReaderBoot) return;
  window.__whimLibraryReaderBoot = true;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        if (existing.dataset.loaded === "1") return resolve();
        existing.addEventListener("load", function () {
          resolve();
        });
        existing.addEventListener("error", reject);
        return;
      }
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = function () {
        s.dataset.loaded = "1";
        resolve();
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function setStatus(text, isError) {
    var stage = document.querySelector(".mh-reader-stage");
    if (!stage) return;
    var status = stage.querySelector(".mh-reader-status");
    if (!status) {
      status = document.createElement("p");
      status.className = "mh-reader-status";
      stage.insertBefore(status, stage.firstChild);
    }
    status.textContent = text || "";
    status.classList.toggle("form-error", Boolean(isError));
    status.style.display = text ? "" : "none";
  }

  function wireNav(rendition) {
    document.querySelectorAll("[data-reader-nav='prev']").forEach(function (btn) {
      btn.disabled = false;
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        rendition.prev();
      });
    });
    document.querySelectorAll("[data-reader-nav='next']").forEach(function (btn) {
      btn.disabled = false;
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        rendition.next();
      });
    });
    window.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        rendition.next();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        rendition.prev();
      }
    });
  }

  function savePosition(payload) {
    var body = JSON.stringify(
      Object.assign({ type: "saveReadingPosition" }, payload)
    );
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/library/progress",
          new Blob([body], { type: "application/json" })
        );
        return;
      }
    } catch (_) {}
    fetch("/api/library/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
      keepalive: true,
      credentials: "include",
    }).catch(function () {});
  }

  function placeFromLocation(location, book) {
    var start = location && location.start ? location.start : {};
    var cfi = start.cfi || null;
    var percent = 0;
    var page = null;
    var total = null;
    var reliable = false;
    if (cfi && book && book.locations && typeof book.locations.length === "function") {
      try {
        var locLen = book.locations.length();
        if (locLen > 0 && typeof book.locations.locationFromCfi === "function") {
          var idxRaw = book.locations.locationFromCfi(cfi);
          if (typeof idxRaw === "number" && idxRaw >= 0) {
            var idx = Math.min(idxRaw, Math.max(0, locLen - 1));
            page = idx + 1;
            total = locLen;
            percent =
              locLen <= 1 ? (idx > 0 ? 100 : 0) : Math.round((idx / (locLen - 1)) * 100);
            percent = Math.max(0, Math.min(100, percent));
            reliable = true;
          }
        } else if (typeof book.locations.percentageFromCfi === "function") {
          var pct = book.locations.percentageFromCfi(cfi);
          if (typeof pct === "number" && !Number.isNaN(pct)) {
            percent = Math.round(Math.max(0, Math.min(1, pct)) * 100);
            reliable = true;
          }
        }
      } catch (_) {}
    }
    var label =
      reliable && page && total
        ? percent + "% · place " + page + " of " + total
        : reliable && percent > 0
          ? percent + "% through"
          : cfi
            ? "Reading"
            : "Beginning";
    return {
      cfi: cfi,
      percent: percent,
      page: page,
      total: total,
      label: label,
      reliable: reliable,
    };
  }

  function updateLocLabel(label) {
    var el = document.querySelector(".mh-reader-loc");
    if (el) el.textContent = label || "";
  }

  async function openWithEpubJs(mount, fileUrl, resumeCfi, bookId) {
    setStatus("Opening the book…");
    await loadScript("/vendor/jszip.min.js");
    await loadScript("/vendor/epub.min.js");
    if (typeof window.ePub !== "function") {
      throw new Error("Could not load the EPUB reader");
    }

    var res = await fetch(fileUrl, { credentials: "include" });
    if (!res.ok) {
      throw new Error(
        res.status === 401
          ? "Sign in to read this book"
          : "Could not load the book file"
      );
    }
    var buffer = await res.arrayBuffer();
    var book = window.ePub(buffer);
    await book.ready;

    var rect = mount.getBoundingClientRect();
    var width = Math.max(280, Math.floor(rect.width || mount.clientWidth || 600));
    var height = Math.max(
      320,
      Math.floor(rect.height || mount.clientHeight || 700)
    );

    var rendition = book.renderTo(mount, {
      width: width,
      height: height,
      flow: "paginated",
      spread: "none",
      minSpreadWidth: 100000,
      allowScriptedContent: true,
    });

    rendition.themes.default({
      html: {
        width: "100% !important",
        height: "100% !important",
        overflow: "hidden !important",
        margin: "0 !important",
        padding: "0 !important",
      },
      body: {
        color: "#2c2418 !important",
        background: "#f6edd9 !important",
        "font-family": "Georgia, 'Times New Roman', serif !important",
        "line-height": "1.65 !important",
        "font-size": "1em !important",
        padding: "0.85rem 1rem !important",
        margin: "0 !important",
        width: "100% !important",
        height: "100% !important",
        "max-height": "100% !important",
        "box-sizing": "border-box !important",
        overflow: "hidden !important",
      },
      img: {
        "max-width": "100% !important",
        "max-height": "100% !important",
        width: "auto !important",
        height: "auto !important",
        "object-fit": "contain !important",
      },
      svg: {
        "max-width": "100% !important",
        "max-height": "100% !important",
      },
    });

    try {
      if (resumeCfi) await rendition.display(resumeCfi);
      else await rendition.display();
    } catch (_) {
      await rendition.display();
    }

    function resize() {
      var r = mount.getBoundingClientRect();
      var w = Math.max(280, Math.floor(r.width || mount.clientWidth || width));
      var h = Math.max(320, Math.floor(r.height || mount.clientHeight || height));
      if (w > 0 && h > 0) rendition.resize(w, h);
    }
    window.addEventListener("resize", resize);
    setTimeout(resize, 80);
    setTimeout(resize, 280);
    wireNav(rendition);

    var lastPlace = {
      cfi: resumeCfi || null,
      percent: 0,
      page: null,
      total: null,
      label: "Reading",
      reliable: false,
    };
    var saveTimer = null;

    function persist(place, immediate) {
      lastPlace = place;
      updateLocLabel(place.label);
      if (!bookId) return;
      if (!place.cfi && !(place.reliable && place.percent > 0)) return;
      var payload = {
        bookId: bookId,
        cfi: place.cfi,
        page: place.page,
        total: place.total,
        label: place.label,
      };
      if (place.reliable) payload.percent = place.percent;
      if (saveTimer) clearTimeout(saveTimer);
      if (immediate) {
        savePosition(payload);
        return;
      }
      saveTimer = setTimeout(function () {
        savePosition(payload);
      }, 700);
    }

    rendition.on("relocated", function (location) {
      var place = placeFromLocation(location, book);
      if (!place.reliable) {
        place.percent = lastPlace.percent || 0;
        if (!place.label || place.label === "Beginning") {
          place.label = lastPlace.label || place.label;
        }
      }
      persist(place, false);
    });

    function flush() {
      if (saveTimer) clearTimeout(saveTimer);
      if (!bookId) return;
      if (!lastPlace.cfi && !(lastPlace.reliable && lastPlace.percent > 0)) return;
      var payload = {
        bookId: bookId,
        cfi: lastPlace.cfi,
        page: lastPlace.page,
        total: lastPlace.total,
        label: lastPlace.label,
      };
      if (lastPlace.reliable) payload.percent = lastPlace.percent;
      savePosition(payload);
    }
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") flush();
    });

    // Mark opened immediately so shelves show progress even before a page turn.
    if (bookId) {
      savePosition({
        bookId: bookId,
        cfi: resumeCfi || undefined,
        label: "Reading",
      });
    }

    // Whole-book % in the background after first paint.
    Promise.resolve()
      .then(function () {
        return book.locations.generate(1000);
      })
      .then(function () {
        if (!lastPlace.cfi) return;
        var place = placeFromLocation({ start: { cfi: lastPlace.cfi } }, book);
        if (place.reliable) persist(place, true);
      })
      .catch(function () {});

    setStatus("");
    return { book: book, rendition: rendition };
  }

  function tryBoot() {
    var mount = document.querySelector(".mh-reader-epub[data-file-url]");
    if (!mount) return;
    if (mount.dataset.owned === "react" || mount.dataset.owned === "boot") return;
    if (mount.querySelector("iframe")) {
      mount.dataset.owned = "react";
      return;
    }

    mount.dataset.owned = "boot";
    var fileUrl = mount.getAttribute("data-file-url") || "";
    var resumeCfi = mount.getAttribute("data-resume-cfi") || "";
    var bookId = mount.getAttribute("data-book-id") || "";
    if (!fileUrl) {
      setStatus("Missing book file.", true);
      return;
    }

    openWithEpubJs(mount, fileUrl, resumeCfi, bookId).catch(function (err) {
      console.error("[library-reader-boot]", err);
      setStatus(
        (err && err.message) || "Could not open this EPUB",
        true
      );
    });
  }

  // Give React a short head start; if it never hydrates, open the book anyway.
  function schedule() {
    setTimeout(tryBoot, 900);
    setTimeout(tryBoot, 2200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule);
  } else {
    schedule();
  }
})();
