function csrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (!meta) throw new Error("[presence] csrf-token meta not found");
  return meta.content;
}

function post(url) {
  return fetch(url, {
    method: "POST",
    headers: { "X-CSRF-Token": csrfToken() },
    keepalive: true,
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector("[data-presence-ping-url]"); //HTMLにあらかじめ埋め込んたURLを、[]内の属性セレクタ名で探す。
  if (!root) return;

  const pingUrl = root.dataset.presencePingUrl; //fetch先のURLを変数pingURLへ代入
  const leaveUrl = root.dataset.presenceLeaveUrl;
  const intervalMs = Number(root.dataset.presenceHeartbeatMs || "15000");

  // 入室（active true）
  post(pingUrl);

  // heartbeat
  const timerId = setInterval(() => post(pingUrl), intervalMs);

  // 離脱（active false）
  window.addEventListener(
    "beforeunload",
    () => {
      clearInterval(timerId);
      post(leaveUrl);
    },
    { once: true }
  );
});
