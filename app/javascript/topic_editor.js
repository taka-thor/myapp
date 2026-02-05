(() => {
  console.debug("[topic_editor] loaded");

  if (window.__topic_editor_init__) return;
  window.__topic_editor_init__ = true;

  let cleaned = false;

  const onClick = (e) => {
    const openBtn = e.target.closest("#topic-edit-open");
    const cancelBtn = e.target.closest("#topic-edit-cancel");
    if (!openBtn && !cancelBtn) return;

    const area = document.getElementById("topic-edit-area");
    if (!area) return;

    const field = area.querySelector("input, textarea, [contenteditable='true']");

    if (openBtn) {
      area.classList.remove("hidden");
      field?.classList.add("is-editing");
      return;
    }

    if (cancelBtn) {
      area.classList.add("hidden");
      field?.classList.remove("is-editing");
    }
  };

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;

    window.__topic_editor_init__ = false;
    document.removeEventListener("click", onClick);

    console.debug("[topic_editor] cleanup");
  };

  document.addEventListener("click", onClick);

  window.addEventListener("turbo:before-cache", cleanup, { once: true });
  window.addEventListener("pagehide", cleanup, { once: true });
})();
