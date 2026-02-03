import { startSpeakingFromStream } from "./speaking_ring";

const startMeSpeakingSafely = (ctx) => {
  const tryStart = (retry = 0) => {
    const el = document.querySelector(`[data-rtc-user-id="${ctx.myUserId}"]`);
    if (!el) {
      if (retry < 10) requestAnimationFrame(() => tryStart(retry + 1));
      return;
    }

    startSpeakingFromStream(ctx, ctx.myUserId, ctx.localStream, {
      threshold: 0.01,
      holdMs: 600,
      debug: true,
      debugEveryMs: 250,
    });
  };

  tryStart();
};

export const prepareLocalAudio = async (ctx) => {
  console.log("[rtc] prepareLocalAudio called", {
    hasLocalStream: !!ctx.localStream,
    myUserId: ctx.myUserId,
  });

  if (ctx.localStream) return ctx.localStream;

  ctx.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  console.log("[rtc] got local audio tracks:", ctx.localStream.getAudioTracks().length);

  startMeSpeakingSafely(ctx);

  return ctx.localStream;
};
