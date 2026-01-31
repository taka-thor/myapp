import { createRtcContext } from "./context";
import { bindLifecycle } from "./lifecycle";
import { connectCable } from "./cable";

const LISTENER_KEY = "__rtc_entry_listener_installed__";

// presence-hook があるページだけ起動（context が null なら何もしない）
export const bootRtc = () => {
  const ctx = createRtcContext();
  if (!ctx) return;

  bindLifecycle(ctx);
  connectCable(ctx);
};

// application.js から呼ぶのはこれだけ
export const bootRtcOnTurboLoad = () => {
  if (window[LISTENER_KEY]) return;
  window[LISTENER_KEY] = true;

  document.addEventListener("turbo:load", () => {
    bootRtc();
  });
};
