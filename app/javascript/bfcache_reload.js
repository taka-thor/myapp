window.addEventListener("pageshow", (e) => {
  const nav = performance.getEntriesByType?.("navigation")?.[0];
  const isBFCache = e.persisted === true || nav?.type === "back_forward";

  if (isBFCache) window.location.reload();
});
