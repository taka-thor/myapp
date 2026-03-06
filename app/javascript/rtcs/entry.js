import { createRtcContext } from "./context";
import { bindLifecycle } from "./lifecycle";
import { connectCable } from "./cable";
import { bindMuteControls } from "./mute_control";

const LISTENER_KEY = "__rtc_entry_listener_installed__";

// bootRtcが初期化ロジック
//厳密にはsessionIDをかえているため一意
export const bootRtc = () => {
  const ctx = createRtcContext();
  if (!ctx) return;

  bindLifecycle(ctx);
  bindMuteControls(ctx);
  connectCable(ctx);
};

export const bootRtcOnTurboLoad = () => {
  if (window[LISTENER_KEY]) return;
  window[LISTENER_KEY] = true;
  //turboloadイベントを認知したらbootRtc実行
  document.addEventListener("turbo:load", () => {
    bootRtc();
  });
};
