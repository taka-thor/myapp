const GA_INIT_KEY = "__ga4_initialized__";

const measurementIdFromMeta = () => {
  return document.querySelector('meta[name="ga-measurement-id"]')?.content?.trim() || "";
};

const ensureGtagLoaded = (measurementId) => {
  if (!measurementId || window[GA_INIT_KEY]) return false;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: false });

  window[GA_INIT_KEY] = true;
  return true;
};

const trackPageView = (measurementId) => {
  if (!measurementId || typeof window.gtag !== "function") return;

  window.gtag("event", "page_view", {
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname + window.location.search,
  });
};

const bootGoogleAnalytics = () => {
  const measurementId = measurementIdFromMeta();
  if (!measurementId) return;

  ensureGtagLoaded(measurementId);
  trackPageView(measurementId);
};

document.addEventListener("turbo:load", bootGoogleAnalytics);
