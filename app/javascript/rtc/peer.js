import { ensureAudioEl, showTapToPlay } from "./audio_remote";
import { send } from "./send";
import { startSpeakingFromStream, stopSpeaking } from "./speaking_ring";

export const closePeer = (ctx, peerUserId) => {
  const entry = ctx.peers.get(peerUserId);
  if (!entry) return;

  stopSpeaking(ctx, peerUserId);

  try { entry.pc.onicecandidate = null; } catch {}
  try { entry.pc.onconnectionstatechange = null; } catch {}
  try { entry.pc.ontrack = null; } catch {}
  try { entry.pc.close(); } catch {}

  ctx.peers.delete(peerUserId);
  ctx.knownPeerSessions.delete(peerUserId);
  ctx.pendingIce.delete(peerUserId);

  console.debug("[rtc] peer closed", peerUserId);
};

export const flushPendingIce = async (ctx, peerUserId) => {
  const entry = ctx.peers.get(peerUserId);
  if (!entry) return;

  const pc = entry.pc;
  if (!pc.remoteDescription) return;

  const list = ctx.pendingIce.get(peerUserId);
  if (!list || list.length === 0) return;

  ctx.pendingIce.delete(peerUserId);

  for (const c of list) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(c));
    } catch (e) {
      console.warn("[rtc] addIceCandidate(flush) err:", e, c);
    }
  }
};

export const newPeerConnection = (ctx, peerUserId, peerSessionIdForTo) => {
  const pc = new RTCPeerConnection({ iceServers: ctx.ICE_SERVERS });

  if (ctx.localStream) {
    for (const track of ctx.localStream.getAudioTracks()) {
      pc.addTrack(track, ctx.localStream);
    }
  } else {
    pc.addTransceiver("audio", { direction: "recvonly" });
  }

  pc.onicecandidate = (e) => {
    if (!e.candidate) return;
    send(ctx, "ice", {
      to_user_id: peerUserId,
      to_session_id: peerSessionIdForTo,
      candidate: e.candidate,
    });
  };

  pc.onconnectionstatechange = () => {
    console.debug("[rtc] connectionState", peerUserId, pc.connectionState);
    if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
      closePeer(ctx, peerUserId);
    }
  };

  const audioEl = ensureAudioEl(ctx, peerUserId);
  pc.ontrack = (e) => {
    const [stream] = e.streams;
    if (!stream) return;

    audioEl.srcObject = stream;

    startSpeakingFromStream(ctx, peerUserId, stream, { threshold: 0.02, holdMs: 450 });

    audioEl
      .play()
      .then(() => console.debug("[rtc] audio play ok", { peerUserId }))
      .catch((err) => {
        console.warn("[rtc] audio.play blocked", err);
        showTapToPlay(ctx, peerUserId, audioEl);
      });

    console.debug("[rtc] ontrack", { peerUserId, kinds: e.track?.kind });
  };

  ctx.peers.set(peerUserId, { pc, audioEl });
  return pc;
};
