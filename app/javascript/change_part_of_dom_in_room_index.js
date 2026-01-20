function isRoomsIndexPage() {
  return !!document.querySelector('[data-page="rooms-index"]');
}

async function fetchRoomsHtml() {
  const res = await fetch("/rooms", {
    headers: { Accept: "text/html" },
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`fetch /rooms failed: ${res.status}`);
  return await res.text();
}

function extractCountsFromHtml(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const map = new Map();

  doc.querySelectorAll('[data-page="rooms-index"] [data-room-id]').forEach((card) => {
    const roomId = card.dataset.roomId;
    const el = card.querySelector("[data-active-count]");
    if (!roomId || !el) return;
    map.set(roomId, el.textContent.trim());
  });

  return map;
}

function applyCountsMap(map) {
  document
    .querySelectorAll('[data-page="rooms-index"] [data-room-id]')
    .forEach((card) => {
      const roomId = card.dataset.roomId;
      const el = card.querySelector("[data-active-count]");
      if (!roomId || !el) return;

      const next = map.get(roomId);
      if (next == null) return;

      if (el.textContent.trim() !== next) {
        el.textContent = next;
      }
    });
}

window.addEventListener("pageshow", async (e) => {
  if (!isRoomsIndexPage()) return;

  const nav = performance.getEntriesByType?.("navigation")?.[0];
  const isBack = e.persisted === true || nav?.type === "back_forward";
  if (!isBack) return;

  try {
    const html = await fetchRoomsHtml();
    const map = extractCountsFromHtml(html);
    applyCountsMap(map);
  } catch (err) {
    console.log("[counts reload] error", err);
  }
});
