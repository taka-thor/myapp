import { send } from "./send";
import { closePeer } from "./peer";
import { unbindMuteControls } from "./mute_control";
import { stopLocalNgDetector } from "./local_ng_detector";

//開発者側でctxに正しくない値を入れた時などのブロック処理
//仮に例外処理が発生してもcleanupメソッドは処理を継続できるため必要。
export const cleanup = (ctx) => {
  try {
    send(ctx, "leave", {});
  } catch {}

  for (const peerUserId of [...ctx.peers.keys()]) closePeer(ctx, peerUserId);

  try {
    ctx.sub?.unsubscribe();
  } catch {}
  ctx.sub = null;

  try {
    unbindMuteControls(ctx);
  } catch {}

  try {
    stopLocalNgDetector(ctx);
  } catch {}

  try {
    window[ctx.initKey] = false;
  } catch {}
};

// bindLifecycleはbootRtcで渡されたctx(=presencehookの部分)
export const bindLifecycle = (ctx) => {
  window.addEventListener("pagehide", () => cleanup(ctx), { once: true });
};
// once: trueにより、一度イベント実行したら自動で解除される。