const DEBUG = false;

function dlog(...args) {
  if (DEBUG) console.log(...args);
}

function watchDom(root, ms = 3000) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      if (m.type === "childList") {
        const addedElems = [...m.addedNodes].filter(
          (n) => n.nodeType === Node.ELEMENT_NODE
        );
        const removedElems = [...m.removedNodes].filter(
          (n) => n.nodeType === Node.ELEMENT_NODE
        );

        if (addedElems.length || removedElems.length) {
          dlog("[childList elements]", m.target, { addedElems, removedElems });
        } else {
          dlog("[childList text]", m.target);
        }
      } else if (m.type === "attributes") {
        dlog(
          "[attr]",
          m.target,
          m.attributeName,
          "->",
          m.target.getAttribute(m.attributeName)
        );
      } else if (m.type === "characterData") {
        dlog("[text]", m.target.parentElement, "->", m.target.data);
      }
    });
  });

  observer.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
  });

  setTimeout(() => observer.disconnect(), ms);
}

window.addEventListener("pageshow", async (e) => {
  const root = document.querySelector('[data-page="rooms-index"]');
  if (!root) return;

  const nav = performance.getEntriesByType?.("navigation")?.[0];
  const isBFCache = e.persisted === true || nav?.type === "back_forward";
  if (!isBFCache) return;

  dlog("[bfcache] pageshow detected", {
    persisted: e.persisted,
    navType: nav?.type,
  });

  // DEBUG時だけDOM監視（本番は重いのでOFF推奨）
  if (DEBUG) watchDom(root, 3000);

  try {
    const res = await fetch("/active_users/index", {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    if (!res.ok) {
      dlog("[bfcache] fetch failed", res.status);
      return;
    }

    const counts = await res.json();
    dlog("[bfcache] counts", counts);

    document.querySelectorAll("[data-room-id]").forEach((card) => {
      const roomId = card.dataset.roomId;
      const el = card.querySelector("[data-active-count]");
      if (!el) return;

      const n = counts[roomId] ?? 0;
      const next = String(n);

      // 値が変わる時だけ更新（ムダなDOM変更を減らす）
      if (el.textContent !== next) {
        el.textContent = next;
        dlog("[bfcache] updated", { roomId, next });
      }

      // 確認用マーク（DEBUG時だけ）
      if (DEBUG) {
        el.dataset.updatedAt = String(Date.now());
        el.classList.add("ring", "ring-2");
        setTimeout(() => el.classList.remove("ring", "ring-2"), 600);
      }
    });
  } catch (err) {
    dlog("[bfcache] error", err);
  }
});
