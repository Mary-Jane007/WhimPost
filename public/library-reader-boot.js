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

  async function openWithEpubJs(mount, fileUrl, resumeCfi) {
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
      allowScriptedContent: true,
    });

    rendition.themes.default({
      body: {
        color: "#2c2418 !important",
        background: "#f6edd9 !important",
        "font-family": "Georgia, 'Times New Roman', serif !important",
        "line-height": "1.7 !important",
        "font-size": "1.05em !important",
        padding: "1.1rem 1.25rem !important",
        margin: "0 !important",
      },
      img: { "max-width": "100% !important", height: "auto !important" },
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

    // Locations in background — don't block first page.
    try {
      book.locations.generate(1000);
    } catch (_) {}

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
    if (!fileUrl) {
      setStatus("Missing book file.", true);
      return;
    }

    openWithEpubJs(mount, fileUrl, resumeCfi).catch(function (err) {
      console.error("[library-reader-boot]", err);
      setStatus(
        (err && err.message) || "Could not open this EPUB",
        true
      );
      // Keep Download available in the header.
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
