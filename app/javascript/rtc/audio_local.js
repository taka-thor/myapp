export const prepareLocalAudio = async (ctx) => {
  if (ctx.localStream) return ctx.localStream;

  ctx.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  console.debug("[rtc] got local audio tracks:", ctx.localStream.getAudioTracks().length);
  return ctx.localStream;
};
