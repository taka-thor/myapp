
const DEBUG = true;

function dlog(...args) {
  if (DEBUG) console.log(...args);
}

function watchDom(root, ms = 3000) {
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
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
    }
  });

  observer.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
  });

  setTimeout(() => observer.disconnect(), ms);
}

function isRoomsIndexPage() {
  return !!document.querySelector('[data-page="rooms-index"]');
}

function detectBFCache(e) {
  const nav = performance.getEntriesByType?.("navigation")?.[0];
  return e.persisted === true || nav?.type === "back_forward";
}

async function fetchActiveCounts() {
  const res = await fetch("/active_users/index", {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
    cache: "no-store", // BFCache復帰時に古いレスポンスを掴みにくくする
  });

  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  return await res.json(); // 期待: { "1": 2, "2": 0, ... } みたいなJSON
}

function applyCounts(counts) {
  document.querySelectorAll('[data-page="rooms-index"] [data-room-id]').forEach((card) => {
    const roomId = card.dataset.roomId; // "1" みたいに文字列
    const el = card.querySelector("[data-active-count]");
    if (!el) return;

    const n = counts?.[roomId] ?? 0; // JSONのキーも文字列想定
    const next = String(n);

    if (el.textContent !== next) {
      el.textContent = next;
      dlog("[bfcache] updated", { roomId, next });
    }

    if (DEBUG) {
      el.dataset.updatedAt = String(Date.now());
      el.classList.add("ring", "ring-2");
      setTimeout(() => el.classList.remove("ring", "ring-2"), 600);
    }
  });
}

window.addEventListener("pageshow", async (e) => {
  if (!isRoomsIndexPage()) return;
  if (!detectBFCache(e)) return;

  const root = document.querySelector('[data-page="rooms-index"]');
  dlog("[bfcache] pageshow detected", { persisted: e.persisted });

  if (DEBUG) watchDom(root, 3000);

  try {
    const counts = await fetchActiveCounts();
    dlog("[bfcache] counts", counts);
    applyCounts(counts);
  } catch (err) {
    dlog("[bfcache] error", err);
  }
});
