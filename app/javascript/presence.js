console.log("[presence] presence.js loaded");

function csrfToken() {
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (!meta) throw new Error("[presence] csrf-token meta not found");
  return meta.content;
}

async function post(url) {
  if (!url) {
    console.warn("[presence] url empty");
    return;
  }

  console.log("[presence] (A) before fetch");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "X-CSRF-Token": csrfToken(), Accept: "application/json" },
      credentials: "same-origin",
      keepalive: true,
    });

    console.log("[presence] (B) after fetch", res.status);

    if (!res.ok) {
      console.log("[presence] (C) res not ok, reading body...");
      const body = await res.text();
      console.log("[presence] (D) body read:", body.slice(0, 200));
    }

    console.log("[presence] (E) returning res");
    return res;
  } catch (e) {
    console.error("[presence] (X) fetch error", e);
  } finally {
    console.log("[presence] (Z) finally");
  }
}

// ✅ ここがトップレベル（関数の外）
window.presenceDebug = { post, csrfToken };
console.log("[presence] exposed to window.presenceDebug");
