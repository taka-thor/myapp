import { send } from "./send";
import { closePeer } from "./peer";
import { unbindMuteControls } from "./mute_control";
import { stopWordDetector } from "./word_detector";

//開発者側でctxに正しくない値を入れた時などのブロック処理
//仮に例外処理が発生してもcleanupメソッドは処理を継続できるため必要。
export const cleanup = (ctx) => {
  try {
    send(ctx, "leave", {});
  } catch {}
// const peerUserIdは、ローカル変数
//ctx.peerはMapオブジェクト(context.jsで定義)で、keysメソッドでキーのみを１つずつ取り出して、const peerUserIdに入れている。
//その後、closePeerの第二引数に渡している。
//peersには相手端末ごとの接続情報が入っている。(相手端末ごとにclosePeerを実行)
  for (const peerUserId of [...ctx.peers.keys()]) closePeer(ctx, peerUserId);

  try {
    ctx.sub?.unsubscribe();//ctx.sub?はctx.subがあればunsubscribeを実行するということ
  } catch {}
  ctx.sub = null;

  try {
    unbindMuteControls(ctx);//ミュート状態を解除
  } catch {}

  try {
    stopWordDetector(ctx);//音声認識文字起こしを解除
  } catch {}

  try {
    window[ctx.initKey] = false;
  } catch {}
};

// bindLifecycleはbootRtcで渡されたctx(=presencehookの部分)
//イベントリスナーを設置したタイミングのctxつまり、初期のctxを使ってbindLifecycleを実行する
export const bindLifecycle = (ctx) => {
  window.addEventListener("pagehide", () => cleanup(ctx), { once: true });
};
// once: trueにより、一度イベント実行したら自動で解除される。
