// app/javascript/rtc.js
// WebRTC P2P signaling (audio) up to 4 peers
// 方式1: join → server returns "present" → newcomer sends offers
// UIなし：部屋詳細に入った瞬間に購読して offer まで送る（listen-only）
//
// 前提（rooms/show.html.erb）:
// <div id="presence-hook"
//      data-room-id="..."
//      data-user-id="..."
//      data-session-id="..."></div>

import consumer from "./channels/consumer";

(() => {
  const root = document.getElementById("presence-hook");
  if (!root) return;

  const roomId = String(root.dataset.roomId || "");
  const myUserId = Number(root.dataset.userId);
  const mySessionId = String(root.dataset.sessionId || "");

  if (!roomId || !myUserId || !mySessionId) {
    console.warn("[rtc] missing dataset", { roomId, myUserId, mySessionId });
    return;
  }

  // 多重 init ガード（roomIdごと / Turbo等で二重起動しがち）
  const initKey = `__rtc_init_room_${roomId}`;
  if (window[initKey]) return;
  window[initKey] = true;

  // デバッグ（必要なら残してOK）
  console.debug("[rtc] boot", {
    roomId,
    myUserId,
    mySessionId,
    initKey,
    already: !!window[initKey],
    hasRoot: !!root,
  });

  const MAX_PEERS = 4; // self + 3
  const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // TURNを使うならここに追加
  ];

  let sub = null;

  // peers: peerUserId -> { pc }
  const peers = new Map();

  // knownPeerSessions: peerUserId -> session_id
  const knownPeerSessions = new Map();

  // ICEが先に来た時に貯めておく
  // pendingIce: peerUserId -> [candidateInit,...]
  const pendingIce = new Map();

  const atCapacity = () => peers.size >= (MAX_PEERS - 1);

  const discard = (reason, data) => {
    console.debug("[rtc] discard:", reason, data);
  };

  const acceptIfToMe = (data) => {
    if (data.to_user_id != null && Number(data.to_user_id) !== myUserId) {
      discard("to_user_id mismatch", data);
      return false;
    }
    if (data.to_session_id != null && String(data.to_session_id) !== mySessionId) {
      discard("to_session_id mismatch", data);
      return false;
    }
    return true;
  };

  const send = (type, payload = {}) => {
    if (!sub) return;
    sub.perform("signal", {
      type,
      room: roomId,
      from_user_id: myUserId,
      from_session_id: mySessionId,
      ...payload,
    });
  };

  const closePeer = (peerUserId) => {
    const entry = peers.get(peerUserId);
    if (!entry) return;
    try { entry.pc.onicecandidate = null; } catch {}
    try { entry.pc.onconnectionstatechange = null; } catch {}
    try { entry.pc.ontrack = null; } catch {}
    try { entry.pc.close(); } catch {}
    peers.delete(peerUserId);
    knownPeerSessions.delete(peerUserId);
    pendingIce.delete(peerUserId);
    console.debug("[rtc] peer closed", peerUserId);
  };

  const flushPendingIce = async (peerUserId) => {
    const entry = peers.get(peerUserId);
    if (!entry) return;

    const pc = entry.pc;
    if (!pc.remoteDescription) return;

    const list = pendingIce.get(peerUserId);
    if (!list || list.length === 0) return;

    pendingIce.delete(peerUserId);

    for (const c of list) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch (e) {
        console.warn("[rtc] addIceCandidate(flush) err:", e, c);
      }
    }
  };

  const newPeerConnection = (peerUserId, peerSessionIdForTo) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      send("ice", {
        to_user_id: peerUserId,
        to_session_id: peerSessionIdForTo,
        candidate: e.candidate,
      });
    };

    pc.onconnectionstatechange = () => {
      if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
        closePeer(peerUserId);
      }
    };

    // UIなし：音を鳴らしたいならここで audio 要素を生成して stream を刺す処理を足す
    // pc.ontrack = (e) => { ... }

    peers.set(peerUserId, { pc });
    return pc;
  };

  const makeOfferTo = async (peerUserId, peerSessionId) => {
    if (atCapacity()) return;

    const entry = peers.get(peerUserId);
    const pc = entry?.pc || newPeerConnection(peerUserId, peerSessionId);

    try {
      // listen-only でも offer は作れる（ローカルトラック無し）
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);

      send("offer", {
        to_user_id: peerUserId,
        to_session_id: peerSessionId,
        sdp: pc.localDescription,
      });

      console.debug("[rtc] offer sent ->", peerUserId);
    } catch (e) {
      console.warn("[rtc] offer error ->", peerUserId, e?.message || e);
    }
  };

  const answerTo = async (peerUserId, peerSessionId, remoteDesc) => {
    const entry = peers.get(peerUserId);
    const pc = entry?.pc || newPeerConnection(peerUserId, peerSessionId);

    try {
      await pc.setRemoteDescription(remoteDesc);
      await flushPendingIce(peerUserId);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      send("answer", {
        to_user_id: peerUserId,
        to_session_id: peerSessionId,
        sdp: pc.localDescription,
      });

      console.debug("[rtc] answer sent ->", peerUserId);
    } catch (e) {
      console.warn("[rtc] answer error ->", peerUserId, e?.message || e);
    }
  };

  const connectCable = () => {
    if (sub) return;

    sub = consumer.subscriptions.create(
      { channel: "RtcChannel", room: roomId },
      {
        connected() {
          console.debug("[rtc] AC connected", { roomId, myUserId, mySessionId });
          send("join", {}); // 方式1: server → present
        },
        disconnected() {
          console.debug("[rtc] AC disconnected");
        },
        received(data) {
          const type = data?.type;
          if (!type) return;

          // 自分が送ったブロードキャストのエコーを無視
          if (data.from_user_id != null && Number(data.from_user_id) === myUserId) return;

          switch (type) {
            case "present": {
              if (!acceptIfToMe(data)) return;

              const list = Array.isArray(data.peers) ? data.peers : [];
              console.debug("[rtc] present", list);

              for (const p of list) {
                if (atCapacity()) break;

                const peerUserId = Number(p.user_id);
                const peerSessionId = String(p.session_id || "");
                if (!peerUserId || !peerSessionId) continue;
                if (peerUserId === myUserId) continue;
                if (knownPeerSessions.has(peerUserId)) continue;

                knownPeerSessions.set(peerUserId, peerSessionId);
                makeOfferTo(peerUserId, peerSessionId); // ★ newcomer sends offers
              }
              break;
            }

            case "offer": {
              if (!acceptIfToMe(data)) return;

              const fromUserId = Number(data.from_user_id);
              const fromSessionId = String(data.from_session_id || "");
              if (!fromUserId || !fromSessionId) return;

              const known = knownPeerSessions.get(fromUserId);
              if (known && known !== fromSessionId) {
                discard("from_session_id mismatch (known)", data);
                return;
              } else if (!known) {
                knownPeerSessions.set(fromUserId, fromSessionId);
              }

              answerTo(fromUserId, fromSessionId, new RTCSessionDescription(data.sdp));
              break;
            }

            case "answer": {
              if (!acceptIfToMe(data)) return;

              const fromUserId = Number(data.from_user_id);
              const fromSessionId = String(data.from_session_id || "");
              if (!fromUserId || !fromSessionId) return;

              const known = knownPeerSessions.get(fromUserId);
              if (known && known !== fromSessionId) {
                discard("from_session_id mismatch (known)", data);
                return;
              }

              const entry = peers.get(fromUserId);
              if (!entry) return;

              entry.pc
                .setRemoteDescription(new RTCSessionDescription(data.sdp))
                .then(() => flushPendingIce(fromUserId))
                .catch((e) => console.warn("[rtc] setRemoteDescription(answer) err:", e));
              break;
            }

            case "ice": {
              if (!acceptIfToMe(data)) return;

              const fromUserId = Number(data.from_user_id);
              const fromSessionId = String(data.from_session_id || "");
              if (!fromUserId || !fromSessionId) return;

              const known = knownPeerSessions.get(fromUserId);
              if (known && known !== fromSessionId) {
                discard("from_session_id mismatch (known)", data);
                return;
              }

              const entry = peers.get(fromUserId);
              const c = data.candidate;
              if (!entry || !c || !c.candidate) return;

              if (!entry.pc.remoteDescription) {
                const arr = pendingIce.get(fromUserId) || [];
                arr.push(c);
                pendingIce.set(fromUserId, arr);
                return;
              }

              entry.pc
                .addIceCandidate(new RTCIceCandidate(c))
                .catch((e) => console.warn("[rtc] addIceCandidate err:", e, c));
              break;
            }

            case "leave": {
              const fromUserId = Number(data.from_user_id);
              if (!fromUserId) return;
              closePeer(fromUserId);
              break;
            }

            default:
              break;
          }
        },
      }
    );
  };

  const cleanup = () => {
    try { send("leave", {}); } catch {}
    for (const peerUserId of [...peers.keys()]) closePeer(peerUserId);
    try { sub?.unsubscribe(); } catch {}
    sub = null;

    // roomId単位の init ガードを解除（戻ってきた時に再初期化できる）
    try { window[initKey] = false; } catch {}
  };

  // Turbo/BFCache 対策：pagehide で確実に退出
  window.addEventListener("pagehide", cleanup, { once: true });

  // 入室した瞬間に購読して offer まで進める
  connectCable();
})();
