import { createRtcContext } from "./context";
import { bindLifecycle } from "./lifecycle";
import { connectCable } from "./cable";
import { bindMuteControls } from "./mute_control";
import { startWordDetector } from "./word_detector";

const LISTENER_KEY = "__rtc_entry_listener_installed__";

// bootRtcが初期化ロジック
//厳密にはsessionIDをかえているため一意
//
export const bootRtc = () => {
  const ctx = createRtcContext();
  if (!ctx) return;

  bindLifecycle(ctx);//bootRtc実行時にpagehideをトリガーとするイベントリスナーを設置する処理
  bindMuteControls(ctx);
  connectCable(ctx);
  startWordDetector(ctx);
};

//turboload用のロジック(2回目以降の表示))
export const bootRtcOnTurboLoad = () => {
  if (window[LISTENER_KEY]) return; //変数を入れるために[]を使う(変数はLISTENER_KEY)
  window[LISTENER_KEY] = true;
  //turboloadイベントを認知したらbootRtc実行
  //イベントリスナーの二重付与防止のためにwindowオブジェクトに目印をつける
  document.addEventListener("turbo:load", () => {
    bootRtc();
  });
};
