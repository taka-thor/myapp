(() => {
  console.debug("[topic_editor] loaded");

  // Turbo遷移で二重評価されるケースがあるので「ページ単位」でガード
  // （room/show とか index とか、同じDOMが再描画された時に二重bindを防ぐ）
  if (window.__topic_editor_init__) return;
  window.__topic_editor_init__ = true;

  // Turboのキャッシュ復帰や before-cache に備えて cleanup を用意
  let cleaned = false;

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;

    // 次のページで再初期化できるようにガード解除
    window.__topic_editor_init__ = false;

    // イベント解除（存在していた場合のみ）
    if (openBtn) openBtn.removeEventListener("click", onOpen);
    if (cancelBtn) cancelBtn.removeEventListener("click", onCancel);

    console.debug("[topic_editor] cleanup");
  };

  // 要素取得（あなたのログに出てるIDをそのまま使う）
  const openBtn = document.getElementById("topic-edit-open");
  const area = document.getElementById("topic-edit-area");
  const cancelBtn = document.getElementById("topic-edit-cancel");

  console.debug("[topic_editor] elements", { openBtn, area, cancelBtn });

  // ページに対象が無ければ何もしない（ただしガードは解除しておく）
  if (!openBtn || !area || !cancelBtn) {
    window.__topic_editor_init__ = false;
    return;
  }

  // ハンドラ
  const onOpen = () => {
    area.classList.remove("hidden");
  };

  const onCancel = () => {
    area.classList.add("hidden");
  };

  // イベント登録
  openBtn.addEventListener("click", onOpen);
  cancelBtn.addEventListener("click", onCancel);

  // Turboのキャッシュに入る直前に必ず掃除（重要）
  window.addEventListener("turbo:before-cache", cleanup, { once: true });

  // ページを離れる系でも掃除（念のため）
  window.addEventListener("pagehide", cleanup, { once: true });
})();
