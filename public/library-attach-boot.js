(function () {
  if (window.__whimLibraryAttachBoot) return;
  window.__whimLibraryAttachBoot = true;

  document.addEventListener(
    "change",
    function (event) {
      var target = event.target;
      if (!target || target.tagName !== "INPUT") return;
      if (target.type !== "file") return;
      if (!target.closest || !target.closest(".mh-attach")) return;
      if (!target.files || !target.files.length || !target.form) return;
      try {
        target.form.requestSubmit();
      } catch (_) {
        target.form.submit();
      }
    },
    true
  );
})();
