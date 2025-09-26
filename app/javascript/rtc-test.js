// app/javascript/rtc-test.js
// WebRTC P2P (audio only) up to 4 peers, signaling via Action Cable

console.log("[rtc-test] loaded");

import consumer from "channels/consumer"; // ← 共通の consumer を使用

(() => {
  // ====== UI ======
  const $ = (q) => document.querySelector(q);
  const logBox = $("#status");
  const startBtn = $("#startBtn");
  const hangupBtn = $("#hangupBtn");
  const page = $("#rtc-test-page");

  const log = (...m) => {
    console.log("[rtc-test]", ...m);
    if (logBox) {
      logBox.textContent += m.join(" ") + "\n";
      logBox.scrollTop = logBox.scrollHeight;
    }
  };

  // ====== Params ======
  const MAX_PEERS = 4; // self + 3 = 4人部屋
  const myId = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
//  const roomId =
//    (location.pathname.split("/").filter(Boolean).join("-")) || "rtc-room";

   // ---- ルーム名を「アンダースコア」に正規化（/rtc_test → "rtc_test"）----
   const path = location.pathname; // 例: "/rtc_test"
   const base = path.split("/").filter(Boolean).at(-1) || "rtc_test";
   // Safari など古い環境も考慮するなら replaceAll の代わりに正規表現版を使用
   const roomId = (base.replaceAll ? base.replaceAll("-", "_") : base.replace(/-/g, "_"));

   // ---- TURN / STUN（coturn on EC2）----
   const ICE_SERVERS = [
    { urls: "stun:turn.turn-kt.com:3478" },
    {
      urls: [
        "turn:turn.turn-kt.com:3478?transport=udp",
        "turn:turn.turn-kt.com:3478?transport=tcp",
      ],
      username: "qVpuPYG7+2wHq1Sa",
      credential: "m3AXodGnCLlWy251",
    },
    // TLSはまだ有効してないのでコメントアウト：
// { urls: ["turns:turn.turn-kt.com:5349"], username: "...", credential: "..." }
  ];

  // ====== State ======
  let sub;                 // Action Cable subscription
  let localStream = null;  // MediaStream
  const peers = new Map(); // peerId -> { pc, audioEl }

  const atCapacity = () => peers.size >= (MAX_PEERS - 1);

  // ====== Helpers ======
  const ensureRemoteAudioEl = (peerId) => {
    let el = document.getElementById(`remote-audio-${peerId}`);
    if (!el) {
      el = document.createElement("audio");
      el.id = `remote-audio-${peerId}`;
      el.autoplay = true;
      el.playsInline = true;
      el.style.display = "block";
      el.style.marginTop = "6px";
      page?.appendChild(el);
    }
    return el;
  };

  const closePeer = (peerId) => {
    const entry = peers.get(peerId);
    if (!entry) return;
    try { entry.pc.ontrack = null; } catch {}
    try { entry.pc.onicecandidate = null; } catch {}
    try { entry.pc.close(); } catch {}
    peers.delete(peerId);
    const el = document.getElementById(`remote-audio-${peerId}`);
    if (el?.parentNode) el.parentNode.removeChild(el);
    log(`peer closed: ${peerId}`);
  };

  const send = (type, payload = {}) => {
    if (!sub) return;
    sub.perform("signal", { type, room: roomId, from: myId, ...payload });
  };

  const newPeerConnection = (peerId) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // 送信（ICE）
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        send("ice", { to: peerId, candidate: e.candidate });
      }
    };

    // 受信（音声）
    pc.ontrack = (e) => {
      const [stream] = e.streams;
      const el = ensureRemoteAudioEl(peerId);
      if (el.srcObject !== stream) {
        el.srcObject = stream;
        log(`remote track from ${peerId}`);
      }
    };

    // 状態ログ
    pc.onconnectionstatechange = () => {
      log(`pc ${peerId} state:`, pc.connectionState);
      if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
        closePeer(peerId);
      }
    };

    // ローカル音声を乗せる
    if (localStream) {
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
    }

    peers.set(peerId, { pc, audioEl: null });
    return pc;
  };

  const makeOfferTo = async (peerId) => {
    let entry = peers.get(peerId);
    const pc = entry?.pc || newPeerConnection(peerId);
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      send("offer", { to: peerId, sdp: pc.localDescription });
      log(`offer sent -> ${peerId}`);
    } catch (e) {
      log(`offer error -> ${peerId}:`, e.message || e);
    }
  };

  const answerTo = async (peerId, remoteDesc) => {
    let entry = peers.get(peerId);
    const pc = entry?.pc || newPeerConnection(peerId);
    try {
      await pc.setRemoteDescription(remoteDesc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      send("answer", { to: peerId, sdp: pc.localDescription });
      log(`answer sent -> ${peerId}`);
    } catch (e) {
      log(`answer error -> ${peerId}:`, e.message || e);
    }
  };

  // ====== Signaling (Action Cable) ======
  const connectCable = () => {
    if (sub) return;
    sub = consumer.subscriptions.create(
      { channel: "RtcChannel", room: roomId }, // ★ ここを RtcChannel に変更
      {
        connected() {
          log(`AC connected. room=${roomId} me=${myId}`);
          // 参加通知（既存メンバーが offer をくれる or こちらから投げる）
          send("join", {});
        },
        disconnected() {
          log("AC disconnected");
        },
        received(data) {
          const { type, from, to } = data || {};
          if (!type) return;

          // 自分宛でない指示はスキップ（宛先省略はブロードキャスト扱い）
          if (to && to !== myId) return;
          if (from === myId) return; // 自分のエコーバック無視

          switch (type) {
            case "join": {
              if (atCapacity()) {
                log(`room full. ignore join from ${from}`);
                break;
              }
              // 既存側が offer
              makeOfferTo(from);
              break;
            }
            case "offer": {
              const desc = new RTCSessionDescription(data.sdp);
              answerTo(from, desc);
              break;
            }
            case "answer": {
              const entry = peers.get(from);
              if (!entry) break;
              entry.pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
                .then(() => log(`remote answer set <- ${from}`))
                .catch((e) => log("setRemoteDescription(answer) err:", e));
              break;
            }
            case "ice": {
              const entry = peers.get(from);
              if (!entry) break;
              if (data.candidate) {
                entry.pc.addIceCandidate(new RTCIceCandidate(data.candidate))
                  .catch((e) => log("addIceCandidate err:", e));
              }
              break;
            }
            case "leave": {
              closePeer(from);
              break;
            }
          }
        },
      }
    );
  };

  const start = async () => {
    if (localStream) return;
    try {
      // 音声のみ
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      const localAudio = $("#localAudio");
      if (localAudio) {
        localAudio.srcObject = localStream;
        localAudio.muted = true;
        localAudio.playsInline = true;
      }
      connectCable();
      startBtn?.setAttribute("disabled", "disabled");
      hangupBtn?.removeAttribute("disabled");
      log("local audio ready, joined room");
    } catch (e) {
      log("getUserMedia failed:", e.message || e);
      alert("マイクへのアクセス許可が必要です。");
    }
  };

  const hangup = () => {
    // 退室通知
    send("leave", {});
    // ピア解放
    [...peers.keys()].forEach(closePeer);
    // ローカル停止
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      localStream = null;
    }
    // 購読解除
    try { sub?.unsubscribe(); } catch {}
    sub = null;
    startBtn?.removeAttribute("disabled");
    hangupBtn?.setAttribute("disabled", "disabled");
    log("left room");
  };

  // ====== Wire up ======
  startBtn?.addEventListener("click", start);
  hangupBtn?.addEventListener("click", hangup);
  window.addEventListener("beforeunload", () => {
    try { send("leave", {}); } catch {}
  });

  log(`loaded. room=${roomId} me=${myId}`);
})();
