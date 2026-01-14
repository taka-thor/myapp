console.log("[presence] presence.js loaded");

const DEBUG = true; // 本番は false 推奨

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
let started = false;
let leaving = false;

function stopHeartbeat() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function canPingNow() {
  return document.visibilityState === "visible";
}

function startHeartbeat({ pingUrl, intervalMs }) {
  if (!pingUrl) return;

  if (started) stopHeartbeat();

  started = true;
  leaving = false;

  // 入室（active true）
  dlog("[presence] ping (enter)", pingUrl);
  post(pingUrl)
    .then((res) => dlog("[presence] ping:", res.status))
    .catch((e) => {
      // ここはベストエフォート。頻発するなら DEBUG を false に
      derr("[presence] ping failed (ignored):", e);
    });

  // heartbeat
  const ms = Number(intervalMs || 5000);
  timerId = setInterval(() => {
    if (!canPingNow()) return;

    post(pingUrl)
      .then((res) => dlog("[presence] heartbeat ok:", res.status))
      .catch((e) => {
        derr("[presence] heartbeat failed (ignored):", e);
      });
  }, ms);

  dlog("[presence] heartbeat started:", ms, "ms");
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector("[data-presence-ping-url]");
  if (!root) {
    dwarn("[presence] root not found: data-presence-ping-url");
    return;
  }

  const pingUrl = root.dataset.presencePingUrl;
  const leaveUrl = root.dataset.presenceLeaveUrl;
  const intervalMs = Number(root.dataset.presenceHeartbeatMs || "5000");

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

    // leave はベストエフォート（設計上、失敗しても TTL が真実）
    postOnLeave(leaveUrl);
  });

  // 復帰時の保険：可視化されたのにタイマーが無ければ張り直す
  document.addEventListener("visibilitychange", () => {
    if (!started) return;
    if (!canPingNow()) return;
    if (!timerId) {
      dlog("[presence] visibility back -> restart heartbeat");
      startHeartbeat({ pingUrl, intervalMs });
    }
  });
});
