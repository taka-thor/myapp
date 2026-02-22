import { setSpeakingIndicator } from "./speaking_ring";

const speakerStatusSelector = (userId) => `[data-rtc-speaker-status][data-rtc-user-id=\"${userId}\"]`;
const muteToggleSelector = (userId) => `[data-rtc-mute-toggle][data-rtc-user-id=\"${userId}\"]`;

const renderSpeakerStatus = (statusEl, muted) => {
  statusEl.classList.toggle("text-slate-400", muted);
  statusEl.classList.toggle("text-sky-500", !muted);
  statusEl.setAttribute("aria-label", muted ? "自分の音声 OFF" : "自分の音声 ON");

  statusEl.querySelector("[data-rtc-speaker-on-icon]")?.classList.toggle("hidden", muted);
  statusEl.querySelector("[data-rtc-speaker-off-icon]")?.classList.toggle("hidden", !muted);
};

const renderMuteToggle = (buttonEl, muted) => {
  buttonEl.setAttribute("aria-pressed", String(muted));
  buttonEl.textContent = muted ? "自分の音声 OFF" : "自分の音声 ON";

  buttonEl.classList.remove("bg-emerald-500", "text-white", "bg-slate-200", "text-slate-700");
  if (muted) {
    buttonEl.classList.add("bg-slate-200", "text-slate-700");
  } else {
    buttonEl.classList.add("bg-emerald-500", "text-white");
  }
};

export const applyLocalMuteState = (ctx) => {
  const tracks = ctx.localStream?.getAudioTracks?.() ?? [];
  for (const track of tracks) {
    track.enabled = !ctx.isMuted;
  }

  if (ctx.isMuted) {
    setSpeakingIndicator(ctx.myUserId, false);
  }
};

const syncLocalOnlyMuteButtons = (ctx) => {
  for (const buttonEl of document.querySelectorAll("[data-rtc-mute-toggle][data-rtc-user-id]")) {
    const userId = Number(buttonEl.dataset.rtcUserId);
    const isMine = userId === ctx.myUserId;
    buttonEl.classList.toggle("hidden", !isMine);
  }
};

export const syncMuteUi = (ctx) => {
  const muted = Boolean(ctx.isMuted);

  for (const statusEl of document.querySelectorAll(speakerStatusSelector(ctx.myUserId))) {
    renderSpeakerStatus(statusEl, muted);
  }

  for (const buttonEl of document.querySelectorAll(muteToggleSelector(ctx.myUserId))) {
    renderMuteToggle(buttonEl, muted);
  }
};

export const setLocalMuted = (ctx, muted) => {
  ctx.isMuted = Boolean(muted);
  applyLocalMuteState(ctx);
  syncMuteUi(ctx);
};

export const bindMuteControls = (ctx) => {
  syncLocalOnlyMuteButtons(ctx);
  syncMuteUi(ctx);

  ctx._onMuteClick = (event) => {
    const button = event.target.closest(muteToggleSelector(ctx.myUserId));
    if (!button) return;

    event.preventDefault();
    setLocalMuted(ctx, !ctx.isMuted);
  };

  ctx._onTurboRender = () => {
    syncLocalOnlyMuteButtons(ctx);
    syncMuteUi(ctx);
  };

  ctx._onBeforeStreamRender = (event) => {
    const originalRender = event.detail?.render;
    if (typeof originalRender !== "function") return;

    event.detail.render = (streamElement) => {
      originalRender(streamElement);
      syncLocalOnlyMuteButtons(ctx);
      syncMuteUi(ctx);
    };
  };

  document.addEventListener("click", ctx._onMuteClick);
  document.addEventListener("turbo:render", ctx._onTurboRender);
  document.addEventListener("turbo:before-stream-render", ctx._onBeforeStreamRender);
};

export const unbindMuteControls = (ctx) => {
  if (ctx._onMuteClick) document.removeEventListener("click", ctx._onMuteClick);
  if (ctx._onTurboRender) document.removeEventListener("turbo:render", ctx._onTurboRender);
  if (ctx._onBeforeStreamRender) {
    document.removeEventListener("turbo:before-stream-render", ctx._onBeforeStreamRender);
  }

  ctx._onMuteClick = null;
  ctx._onTurboRender = null;
  ctx._onBeforeStreamRender = null;
};
