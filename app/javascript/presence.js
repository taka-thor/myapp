console.log("[presence] presence.js loaded");

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
      Accept: "application/json", //htmlを描画するリクエストでないためJSONを使用
    },
    credentials: "same-origin",
  }).then((res) => {
    //ここでresの中にResponseオブジェクトを保持
    console.log("[ok]", res.status);
    return res; // 呼び出し元で使えるように返す
  });
}

//if(!url)はurlの中身が空の時
function postOnLeave(url) {
  if (!url) {
    console.warn("[presence] leave url empty");
    return;
  }

  console.log("[presence] leave sending...", url);

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
      .then((res) => {
        console.log("[presence] leave fetch status:", res.status);
      })
      .catch((e) => {
        console.error("[presence] leave fetch error", e);
      });
  } catch (e) {
    console.error("[presence] leave fetch exception", e);
  }
}

/* ---------------------------
 * Heartbeat state
 * -------------------------- */
let timerId = null;
let started = false;
let leaving = false;

function startHeartbeat({ pingUrl, intervalMs }) {
  if (!pingUrl) return;

  // 二重起動防止（bfcache復元や二重イベント対策）
  if (started) {
    // ただし、タイマーが死んでいる可能性があるので張り直す
    if (timerId) clearInterval(timerId);
  }

  started = true;
  leaving = false;

  // 入室（active true）
  console.log("[presence] ping (enter)", pingUrl);
  post(pingUrl).catch((e) => console.error("[presence] ping error", e));

  // heartbeat
  const ms = Number(intervalMs || 15000);
  timerId = setInterval(() => {
    post(pingUrl).catch((e) => console.error("[presence] heartbeat error", e));
  }, ms);

  console.log("[presence] heartbeat started:", ms, "ms");
}

function stopHeartbeat() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

/* ---------------------------
 * Boot
 * -------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector("[data-presence-ping-url]");
  if (!root) return;

  const pingUrl = root.dataset.presencePingUrl;
  const leaveUrl = root.dataset.presenceLeaveUrl;
  const intervalMs = Number(root.dataset.presenceHeartbeatMs || "5000");

  // 初回表示: DOM構築後に開始
  startHeartbeat({ pingUrl, intervalMs });

  window.addEventListener("pageshow", (e) => {
    // bfcache復元のときだけ再開
    if (!e.persisted) return;

    console.log("[presence] pageshow (bfcache restore) -> restart heartbeat");
    startHeartbeat({ pingUrl, intervalMs });
  });

  // 離脱（active false）: pagehide に寄せる（unloadより実用的）
  window.addEventListener("pagehide", (e) => {
    if (leaving) return;
    leaving = true;

    console.log(
      "[presence] pagehide -> leave fired (persisted:",
      !!e.persisted,
      ")"
    );
    stopHeartbeat();

    postOnLeave(leaveUrl);
  });

  // デバッグ用
  // window.presenceDebug = {
  //   post,
  //   postOnLeave,
  //   csrfToken,
  //   startHeartbeat: () => startHeartbeat({ pingUrl, intervalMs }),
  //   stopHeartbeat,
  //   urls: { pingUrl, leaveUrl, intervalMs },
  // };
});
