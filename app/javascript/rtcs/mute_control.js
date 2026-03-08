import { setSpeakingIndicator } from "./speaking_ring";
import { send } from "./send";

const speakerStatusSelector = (userId) => `[data-rtc-speaker-status][data-rtc-user-id=\"${userId}\"]`;
const muteToggleSelector = (userId) => `[data-rtc-mute-toggle][data-rtc-user-id=\"${userId}\"]`;
const reconnectSelector = "[data-rtc-reconnect][data-rtc-user-id]";
const FORCE_TAP_TO_PLAY_KEY = "rtc_force_tap_to_play";
let activeMuteCtx = null;

const csrfToken = () => document.querySelector('meta[name="csrf-token"]')?.content;

const postMutedPresence = async (ctx) => {
  const token = csrfToken();
  if (!token || !ctx.roomId) return;

  try {
    await fetch(`/rooms/${ctx.roomId}/presence/ping`, {
      method: "POST",
      headers: {
        "X-CSRF-Token": token,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({ muted: ctx.isMuted }),
    });
  } catch (e) {
    console.warn("[rtc] muted ping failed:", e);
  }
};

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
  const tracks = ctx.localStream?.getAudioTracks?.() ?? []; //applyLocalMuteState音声トラック一覧を取る。localStream があれば音声トラック配列を取得 なければ []（空配列）
  for (const track of tracks) {
    track.enabled = !ctx.isMuted;//MediaStreamTrackのプロパティであるenabledに値を入れるだけで、自動で適応される。(どこかのメソッドを呼んで適応させるなどの作業はいらない)
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

const syncLocalOnlyReconnect = (ctx) => {
  for (const el of document.querySelectorAll(reconnectSelector)) {
    const userId = Number(el.dataset.rtcUserId);
    el.classList.toggle("hidden", userId !== ctx.myUserId);
  }
};

export const syncMuteVisibilityForLocalUser = (ctx) => {
  syncLocalOnlyMuteButtons(ctx);
  syncLocalOnlyReconnect(ctx);
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
  applyLocalMuteState(ctx); // isMuted:trueのctxを保持
  syncMuteUi(ctx);
  postMutedPresence(ctx);
  if (ctx.sub) {
    send(ctx, "mute_changed", { muted: ctx.isMuted });
    ctx.pendingMuteBroadcast = false;
  } else {
    ctx.pendingMuteBroadcast = true;
  }
};

export const markForceTapToPlayOnReconnect = () => {
  sessionStorage.setItem(FORCE_TAP_TO_PLAY_KEY, "1");
};

export const getActiveMuteCtx = () => activeMuteCtx;

// entry.jsから渡されたctx
// createRtcContextを実行するごとにsessionIDが変わるため、各場所経由で受け渡し
export const bindMuteControls = (ctx) => {
  activeMuteCtx = ctx;
  syncMuteVisibilityForLocalUser(ctx);
  syncMuteUi(ctx);
};

export const unbindMuteControls = (ctx) => {
  if (activeMuteCtx === ctx) {
    activeMuteCtx = null;
  }
};
