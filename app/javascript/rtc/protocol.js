import { atCapacity, acceptIfToMe, discard } from "./utils";
import { newPeerConnection, flushPendingIce } from "./peer";
import { send } from "./send";

export const makeOfferTo = async (ctx, peerUserId, peerSessionId) => {
  if (atCapacity(ctx)) return;

  const entry = ctx.peers.get(peerUserId);
  const pc = entry?.pc || newPeerConnection(ctx, peerUserId, peerSessionId);

  try {
    const offer = await pc.createOffer({ offerToReceiveAudio: true });
    await pc.setLocalDescription(offer);

    send(ctx, "offer", {
      to_user_id: peerUserId,
      to_session_id: peerSessionId,
      sdp: pc.localDescription,
    });

    console.debug("[rtc] offer sent ->", peerUserId);
  } catch (e) {
    console.warn("[rtc] offer error ->", peerUserId, e?.message || e);
  }
};

export const answerTo = async (ctx, peerUserId, peerSessionId, remoteDesc) => {
  const entry = ctx.peers.get(peerUserId);
  const pc = entry?.pc || newPeerConnection(ctx, peerUserId, peerSessionId);

  try {
    await pc.setRemoteDescription(remoteDesc);
    await flushPendingIce(ctx, peerUserId);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    send(ctx, "answer", {
      to_user_id: peerUserId,
      to_session_id: peerSessionId,
      sdp: pc.localDescription,
    });

    console.debug("[rtc] answer sent ->", peerUserId);
  } catch (e) {
    console.warn("[rtc] answer error ->", peerUserId, e?.message || e);
  }
};

export const handleReceived = (ctx, data) => {
  const type = data?.type;
  if (!type) return;

  // 自分が送ったブロードキャストのエコーを無視
  if (data.from_user_id != null && Number(data.from_user_id) === ctx.myUserId) return;

  switch (type) {
    case "present": {
      if (!acceptIfToMe(ctx, data)) return;

      const list = Array.isArray(data.peers) ? data.peers : [];
      console.debug("[rtc] present", list);

      for (const p of list) {
        if (atCapacity(ctx)) break;

        const peerUserId = Number(p.user_id);
        const peerSessionId = String(p.session_id || "");
        if (!peerUserId || !peerSessionId) continue;
        if (peerUserId === ctx.myUserId) continue;
        if (ctx.knownPeerSessions.has(peerUserId)) continue;

        ctx.knownPeerSessions.set(peerUserId, peerSessionId);
        makeOfferTo(ctx, peerUserId, peerSessionId);
      }
      break;
    }

    case "offer": {
      if (!acceptIfToMe(ctx, data)) return;

      const fromUserId = Number(data.from_user_id);
      const fromSessionId = String(data.from_session_id || "");
      if (!fromUserId || !fromSessionId) return;

      const known = ctx.knownPeerSessions.get(fromUserId);
      if (known && known !== fromSessionId) {
        discard(ctx, "from_session_id mismatch (known)", data);
        return;
      } else if (!known) {
        ctx.knownPeerSessions.set(fromUserId, fromSessionId);
      }

      answerTo(ctx, fromUserId, fromSessionId, new RTCSessionDescription(data.sdp));
      break;
    }

    case "answer": {
      if (!acceptIfToMe(ctx, data)) return;

      const fromUserId = Number(data.from_user_id);
      const fromSessionId = String(data.from_session_id || "");
      if (!fromUserId || !fromSessionId) return;

      const known = ctx.knownPeerSessions.get(fromUserId);
      if (known && known !== fromSessionId) {
        discard(ctx, "from_session_id mismatch (known)", data);
        return;
      }

      const entry = ctx.peers.get(fromUserId);
      if (!entry) return;

      entry.pc
        .setRemoteDescription(new RTCSessionDescription(data.sdp))
        .then(() => flushPendingIce(ctx, fromUserId))
        .catch((e) => console.warn("[rtc] setRemoteDescription(answer) err:", e));
      break;
    }

    case "ice": {
      if (!acceptIfToMe(ctx, data)) return;

      const fromUserId = Number(data.from_user_id);
      const fromSessionId = String(data.from_session_id || "");
      if (!fromUserId || !fromSessionId) return;

      const known = ctx.knownPeerSessions.get(fromUserId);
      if (known && known !== fromSessionId) {
        discard(ctx, "from_session_id mismatch (known)", data);
        return;
      }

      const entry = ctx.peers.get(fromUserId);
      const c = data.candidate;
      if (!entry || !c || !c.candidate) return;

      if (!entry.pc.remoteDescription) {
        const arr = ctx.pendingIce.get(fromUserId) || [];
        arr.push(c);
        ctx.pendingIce.set(fromUserId, arr);
        return;
      }

      entry.pc
        .addIceCandidate(new RTCIceCandidate(c))
        .catch((e) => console.warn("[rtc] addIceCandidate err:", e, c));
      break;
    }

    default:
      break;
  }
};
