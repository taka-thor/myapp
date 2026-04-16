const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);

const unregisterAllServiceWorkers = async () => {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
};

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (isLocalhost) {
      unregisterAllServiceWorkers().catch((error) => {
        console.warn("[pwa] service worker unregister failed", error);
      });
      return;
    }

    navigator.serviceWorker.register("/service-worker.js").catch((error) => {
      console.warn("[pwa] service worker registration failed", error);
    });
  });
}
