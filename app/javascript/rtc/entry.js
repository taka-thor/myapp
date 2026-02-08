import { createRtcContext } from "./context";
import { bindLifecycle } from "./lifecycle";
import { connectCable } from "./cable";
import { bindMuteControls } from "./mute_control";

const LISTENER_KEY = "__rtc_entry_listener_installed__";

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

  document.addEventListener("turbo:load", () => {
    bootRtc();
  });
};
