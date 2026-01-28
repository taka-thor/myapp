// app/javascript/rtc.js
// WebRTC P2P signaling (audio) up to 4 peers
// 方式1: join → server returns "present" → newcomer sends offers
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

  // peers: peerUserId -> { pc, audioEl }
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

  // ====== local audio ======
  let localStream = null;

  const prepareLocalAudio = async () => {
    if (localStream) return localStream;
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    console.debug("[rtc] got local audio tracks:", localStream.getAudioTracks().length);
    return localStream;
  };

  // ====== remote audio playback ======
  const ensureAudioEl = (peerUserId) => {
    const audioId = `rtc-audio-${roomId}-${peerUserId}`;
    let el = document.getElementById(audioId);
    if (!el) {
      el = document.createElement("audio");
      el.id = audioId;
      el.autoplay = true;
      el.playsInline = true;
      // ミュートしない（相手音を鳴らす）
      el.muted = false;
      document.body.appendChild(el);
    }
    return el;
  };

  const showTapToPlay = (peerUserId, audioEl) => {
    const btnId = `rtc-tap-${roomId}-${peerUserId}`;
    if (document.getElementById(btnId)) return;

    const btn = document.createElement("button");
    btn.id = btnId;
    btn.type = "button";
    btn.textContent = "🔊 タップして音声を再生";
    btn.style.position = "fixed";
    btn.style.left = "16px";
    btn.style.bottom = "16px";
    btn.style.zIndex = "99999";
    btn.style.padding = "10px 12px";
    btn.style.borderRadius = "12px";
    btn.style.border = "1px solid rgba(0,0,0,0.15)";
    btn.style.background = "white";
    btn.style.cursor = "pointer";

    btn.addEventListener(
      "click",
      () => {
        audioEl
          .play()
          .then(() => {
            btn.remove();
            console.debug("[rtc] audio play ok (user gesture)", { peerUserId });
          })
          .catch((e) => console.warn("[rtc] audio play still blocked", e));
      },
      { once: false }
    );

    document.body.appendChild(btn);
  };

  const closePeer = (peerUserId) => {
    const entry = peers.get(peerUserId);
    if (!entry) return;

    try {
      entry.pc.onicecandidate = null;
    } catch {}
    try {
      entry.pc.onconnectionstatechange = null;
    } catch {}
    try {
      entry.pc.ontrack = null;
    } catch {}
    try {
      entry.pc.close();
    } catch {}

    try {
      // audio要素は残しても良いが、消したいなら消す
      // entry.audioEl?.remove?.();
    } catch {}

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

    // 送信（自分のマイク）
    if (localStream) {
      for (const track of localStream.getAudioTracks()) {
        pc.addTrack(track, localStream);
      }
    } else {
      // マイクが取れてない時でも受信m-lineを作るため
      pc.addTransceiver("audio", { direction: "recvonly" });
    }

    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      send("ice", {
        to_user_id: peerUserId,
        to_session_id: peerSessionIdForTo,
        candidate: e.candidate,
      });
    };

    pc.onconnectionstatechange = () => {
      console.debug("[rtc] connectionState", peerUserId, pc.connectionState);
      if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
        closePeer(peerUserId);
      }
    };

    // 受信（相手の音声を鳴らす）
    const audioEl = ensureAudioEl(peerUserId);
    pc.ontrack = (e) => {
      const [stream] = e.streams;
      if (!stream) return;

      audioEl.srcObject = stream;
      audioEl
        .play()
        .then(() => {
          console.debug("[rtc] audio play ok", { peerUserId });
        })
        .catch((err) => {
          console.warn("[rtc] audio.play blocked", err);
          showTapToPlay(peerUserId, audioEl);
        });

      console.debug("[rtc] ontrack", { peerUserId, kinds: e.track?.kind });
    };

    peers.set(peerUserId, { pc, audioEl });
    return pc;
  };

  const makeOfferTo = async (peerUserId, peerSessionId) => {
    if (atCapacity()) return;

    const entry = peers.get(peerUserId);
    const pc = entry?.pc || newPeerConnection(peerUserId, peerSessionId);

    try {
      // マイク無しでも受信だけの offer は作れる
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
        async connected() {
          console.debug("[rtc] AC connected", { roomId, myUserId, mySessionId });

          // マイク取得（失敗しても recvonly で進む）
          try {
            await prepareLocalAudio();
          } catch (e) {
            console.warn("[rtc] getUserMedia failed:", e);
          }

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
                makeOfferTo(peerUserId, peerSessionId); // newcomer sends offers
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
    try {
      send("leave", {});
    } catch {}
    for (const peerUserId of [...peers.keys()]) closePeer(peerUserId);
    try {
      sub?.unsubscribe();
    } catch {}
    sub = null;

    // roomId単位の init ガードを解除（戻ってきた時に再初期化できる）
    try {
      window[initKey] = false;
    } catch {}
  };

  // Turbo/BFCache 対策：pagehide で確実に退出
  window.addEventListener("pagehide", cleanup, { once: true });

  // 入室した瞬間に購読して offer まで進める
  connectCable();
})();
