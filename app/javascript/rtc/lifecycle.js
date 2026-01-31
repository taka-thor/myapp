import { send } from "./send";
import { closePeer } from "./peer";

export const cleanup = (ctx) => {
  try {
    send(ctx, "leave", {});
  } catch {}

  for (const peerUserId of [...ctx.peers.keys()]) closePeer(ctx, peerUserId);

  try {
    ctx.sub?.unsubscribe();
  } catch {}
  ctx.sub = null;

  // roomId単位の init ガードを解除（戻ってきた時に再初期化できる）
  try {
    window[ctx.initKey] = false;
  } catch {}
};

export const bindLifecycle = (ctx) => {
  window.addEventListener("pagehide", () => cleanup(ctx), { once: true });
};
