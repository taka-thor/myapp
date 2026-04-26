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
  statusEl.classList.toggle("text-slate-400", muted);// statusElの中身はcssセレクター。このcssセレクターを含んたclassを探し、メソッドを実行。
  statusEl.classList.toggle("text-sky-500", !muted);

  statusEl.querySelector("[data-rtc-speaker-on-icon]")?.classList.toggle("hidden", muted);
  statusEl.querySelector("[data-rtc-speaker-off-icon]")?.classList.toggle("hidden", !muted);
};

const renderMuteToggle = (buttonEl, muted) => {
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
    track.enabled = !ctx.isMuted;//enabledは、MediaStreamTrackのプロパティ
  }                              //真偽値判定し、track.enabledでマイク音声を有効にする

  if (ctx.isMuted) {
    setSpeakingIndicator(ctx.myUserId, false);
  }
};

// ボタンを隠している状態がデフォ。自分の分だけミュートボタンを表示。
const syncLocalOnlyMuteButtons = (ctx) => {
  for (const buttonEl of document.querySelectorAll("[data-rtc-mute-toggle][data-rtc-user-id]")) { //data-rtc-user-idのみだと、被り(意図しない値を取得する)もあるため2つ取得。
    const userId = Number(buttonEl.dataset.rtcUserId);
    const isMine = userId === ctx.myUserId;
    buttonEl.classList.toggle("hidden", !isMine);
  }
};

// ボタンを隠している状態がデフォ。自分の分だけ再接続ボタンを表示。
const syncLocalOnlyReconnect = (ctx) => {
  for (const el of document.querySelectorAll(reconnectSelector)) {
    const userId = Number(el.dataset.rtcUserId);
    el.classList.toggle("hidden", userId !== ctx.myUserId);
  }
};

export const showOnlyMyMuteAndReconnectButtons = (ctx) => {
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
  }
};

export const markForceTapToPlayOnReconnect = () => {
  sessionStorage.setItem(FORCE_TAP_TO_PLAY_KEY, "1");
};// ブラウザのセッションストレージに、キー、バリューを設置

export const getActiveMuteCtx = () => activeMuteCtx;

// entry.jsから渡されたctx
// createRtcContextを実行するごとにsessionIDが変わるため、各場所経由で受け渡し
export const bindMuteControls = (ctx) => {
  activeMuteCtx = ctx;
  showOnlyMyMuteAndReconnectButtons(ctx);
  syncMuteUi(ctx);
};

export const unbindMuteControls = (ctx) => {
  if (activeMuteCtx === ctx) {
    activeMuteCtx = null;
  }
};
