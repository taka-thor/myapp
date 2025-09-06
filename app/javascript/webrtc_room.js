// app/javascript/room.js
import consumer from "/assets/channels/consumer.js";

const ROOM_ID = "test1"; // URL から動的に取るなら location.pathname.split("/").pop() など
let pc;
let localStream;
let remoteStream;

// ===== TURN/STUN 設定（あなたの coturn サーバーに合わせる） =====
const TURN_HOST = "turn.turn-kt.com";
const TURN_USER = "aaa";
const TURN_PASS = "bbb";

const iceServers = [
  { urls: [`stun:${TURN_HOST}:3478`] },
  { urls: [`turn:${TURN_HOST}:3478?transport=udp`], username: TURN_USER, credential: TURN_PASS },
  { urls: [`turn:${TURN_HOST}:3478?transport=tcp`], username: TURN_USER, credential: TURN_PASS },
  { urls: [`turns:${TURN_HOST}:5349?transport=tcp`], username: TURN_USER, credential: TURN_PASS },
];

// ===== DOM =====
const localAudio = document.getElementById("localAudio");
const remoteAudio = document.getElementById("remoteAudio");
const btnJoin = document.getElementById("btnJoin");
const btnCall = document.getElementById("btnCall");
const btnHangup = document.getElementById("btnHangup");
const logArea = document.getElementById("log");
const log = (...a) => {
  logArea.textContent += a.join(" ") + "\n";
  logArea.scrollTop = logArea.scrollHeight;
};

// ===== Cable 接続 =====
const sub = consumer.subscriptions.create(
  { channel: "RoomChannel", room: ROOM_ID },
  {
    received: async (msg) => {
      if (!pc) return;

      if (msg.type === "offer") {
        log("← offer 受信");
        await pc.setRemoteDescription(msg.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sub.perform("signal", { room: ROOM_ID, type: "answer", sdp: pc.localDescription });
        log("→ answer 送信");
      } else if (msg.type === "answer") {
        log("← answer 受信");
        await pc.setRemoteDescription(msg.sdp);
      } else if (msg.type === "candidate") {
        try {
          await pc.addIceCandidate(msg.candidate);
          log("← candidate 追加");
        } catch (e) {
          log("ICE candidate エラー:", e.message);
        }
      }
    },
  }
);

// ===== PeerConnection 作成 =====
function newPC() {
  pc = new RTCPeerConnection({ iceServers });
  pc.addEventListener("icecandidate", (e) => {
    if (e.candidate) {
      sub.perform("signal", { room: ROOM_ID, type: "candidate", candidate: e.candidate });
      log("→ candidate 送信");
    }
  });
  pc.addEventListener("connectionstatechange", () => log("connection:", pc.connectionState));
  pc.addEventListener("iceconnectionstatechange", () => log("ice:", pc.iceConnectionState));

  remoteStream = new MediaStream();
  remoteAudio.srcObject = remoteStream;
  pc.addEventListener("track", (ev) => {
    remoteStream.addTrack(ev.track);
    remoteAudio.play().catch(() => log("iOS 対策: 画面をタップしてください"));
  });

  if (localStream) {
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
  }
  return pc;
}

// ===== ボタン操作 =====
btnJoin.addEventListener("click", async () => {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localAudio.srcObject = localStream;
    localAudio.muted = true;
    log("マイク取得 OK");
    if (!pc) newPC();
  } catch (e) {
    log("getUserMedia エラー:", e.message);
  }
});

btnCall.addEventListener("click", async () => {
  if (!pc) newPC();
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  sub.perform("signal", { room: ROOM_ID, type: "offer", sdp: pc.localDescription });
  log("→ offer 送信");
});

btnHangup.addEventListener("click", () => {
  try { pc?.close(); } catch(_) {}
  pc = null;
  localStream?.getTracks().forEach((t) => t.stop());
  remoteStream?.getTracks().forEach((t) => t.stop());
  log("切断しました");
});
