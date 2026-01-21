
function isRoomsIndexPage() {
  return !!document.querySelector('[data-page="rooms-index"]');
}

function isBackForwardNavigation(e) {
  if (e && e.persisted === true) return true;

  const nav = performance.getEntriesByType?.("navigation")?.[0];
  if (nav && nav.type === "back_forward") return true;

  return false;
}

function reloadOnce() {
  const key = "rooms_index_bfcache_reloaded";
  if (sessionStorage.getItem(key) === "1") return;
  sessionStorage.setItem(key, "1");

  window.location.reload();
}

window.addEventListener("pageshow", (e) => {
  if (!isRoomsIndexPage()) return;

  if (!isBackForwardNavigation(e)) return;

  reloadOnce();
});

window.addEventListener("pagehide", () => {
  sessionStorage.removeItem("rooms_index_bfcache_reloaded");
});
