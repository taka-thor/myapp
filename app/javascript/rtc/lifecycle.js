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

  try {
    window[ctx.initKey] = false;
  } catch {}
};

export const bindLifecycle = (ctx) => {
  window.addEventListener("pagehide", () => cleanup(ctx), { once: true });
};
