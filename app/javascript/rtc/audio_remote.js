export const ensureAudioEl = (ctx, peerUserId) => {
  const audioId = `rtc-audio-${ctx.roomId}-${peerUserId}`;
  let el = document.getElementById(audioId);

  if (!el) {
    el = document.createElement("audio");
    el.id = audioId;
    el.autoplay = true;
    el.playsInline = true;
    el.muted = false;
    document.body.appendChild(el);
  }

  return el;
};

export const showTapToPlay = (ctx, peerUserId, audioEl) => {
  const btnId = `rtc-tap-${ctx.roomId}-${peerUserId}`;
  if (document.getElementById(btnId)) return;

  const btn = document.createElement("button");
  btn.id = btnId;
  btn.type = "button";
  btn.textContent = "🔊 タップして音声を再生";

  btn.style.position = "fixed";
  btn.style.left = "16px";
  btn.style.bottom = "16px";
  btn.style.zIndex = "99999";
  btn.style.padding = "10px 12px";
  btn.style.borderRadius = "12px";
  btn.style.border = "1px solid rgba(0,0,0,0.15)";
  btn.style.background = "white";
  btn.style.cursor = "pointer";

  btn.addEventListener("click", () => {
    audioEl
      .play()
      .then(() => {
        btn.remove();
        console.debug("[rtc] audio play ok (user gesture)", { peerUserId });
      })
      .catch((e) => console.warn("[rtc] audio play still blocked", e));
  });

  document.body.appendChild(btn);
};
