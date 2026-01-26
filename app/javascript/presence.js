console.log("[presence] presence.js loaded");

const DEBUG = false;

function dlog(...args) {
  if (DEBUG) console.log(...args);
}
function dwarn(...args) {
  if (DEBUG) console.warn(...args);
}
function derr(...args) {
  if (DEBUG) console.error(...args);
}

function csrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (!meta) throw new Error("[presence] csrf-token meta not found");
  return meta.content;
}

function post(url) {
  return fetch(url, {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken(),
      Accept: "application/json",
    },
    credentials: "same-origin",
  });
}

function postOnLeave(url) {
  if (!url) {
    dwarn("[presence] leave url empty");
    return;
  }

  dlog("[presence] leave sending...", url);

  try {
    fetch(url, {
      method: "POST",
      headers: {
        "X-CSRF-Token": csrfToken(),
        Accept: "application/json",
      },
      credentials: "same-origin",
      keepalive: true,
    })
      .then((res) => dlog("[presence] leave ok:", res.status))
      .catch((e) => {
        derr("[presence] leave failed (ignored):", e);
      });
  } catch (e) {
    derr("[presence] leave exception (ignored):", e);
  }
}

let timerId = null;
let firstPingTimeoutId = null;
let started = false;
let leaving = false;

function stopHeartbeat() {
  if (firstPingTimeoutId) {
    clearTimeout(firstPingTimeoutId);
    firstPingTimeoutId = null;
  }
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function is_showing_page() {
  return document.visibilityState === "visible";
}

function startHeartbeat({ pingUrl, intervalMs }) {
  if (!pingUrl) return;

  if (started) stopHeartbeat();

  started = true;
  leaving = false;

  const ms = Number(intervalMs || 5000);
  const firstDelayMs = 300;

  // ✅ 初回 ping（enter）だけ遅らせる
  firstPingTimeoutId = setTimeout(() => {
    firstPingTimeoutId = null;

    if (!is_showing_page()) {
      dlog("[presence] first ping skipped (hidden)");
      return;
    }

    dlog("[presence] ping (enter, delayed)", pingUrl);
    post(pingUrl)
      .then((res) => dlog("[presence] ping:", res.status))
      .catch((e) => {
        derr("[presence] ping failed (ignored):", e);
      });
  }, firstDelayMs);

  // ✅ heartbeat（2回目以降は通常通り）
  timerId = setInterval(() => {
    if (!is_showing_page()) return;

    post(pingUrl)
      .then((res) => dlog("[presence] heartbeat ok:", res.status))
      .catch((e) => {
        derr("[presence] heartbeat failed (ignored):", e);
      });
  }, ms);

  dlog("[presence] heartbeat started:", ms, "ms / first ping delay:", firstDelayMs, "ms");
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector("[data-presence-ping-url]");
  if (!root) {
    dwarn("[presence] root not found: data-presence-ping-url");
    return;
  }

  const pingUrl = root.dataset.presencePingUrl;
  const leaveUrl = root.dataset.presenceLeaveUrl;
  const intervalMs = Number("5000");

  startHeartbeat({ pingUrl, intervalMs });

  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    dlog("[presence] pageshow (bfcache restore) -> restart heartbeat");
    startHeartbeat({ pingUrl, intervalMs });
  });

  window.addEventListener("pagehide", (e) => {
    if (leaving) return;
    leaving = true;

    dlog("[presence] pagehide -> leave fired (persisted:", !!e.persisted, ")");
    stopHeartbeat();

    postOnLeave(leaveUrl);
  });

  document.addEventListener("visibilitychange", () => {
    if (!started) return;
    if (!is_showing_page()) return;

    if (!timerId) {
      dlog("[presence] visibility back -> restart heartbeat");
      startHeartbeat({ pingUrl, intervalMs });
    }
  });
});
