export const createRtcContext = () => {
  const root = document.getElementById("presence-hook");
  if (!root) return null;

  const roomId = String(root.dataset.roomId || "");
  const myUserId = Number(root.dataset.userId);
  const mySessionId = String(root.dataset.sessionId || "");

  if (!roomId || !myUserId || !mySessionId) {
    console.warn("[rtc] missing dataset", { roomId, myUserId, mySessionId });
    return null;
  }

  // 多重 init ガード（roomIdごと / Turbo等で二重起動しがち）
  const initKey = `__rtc_init_room_${roomId}`;
  if (window[initKey]) return null;
  window[initKey] = true;

  const ctx = {
    // dataset
    roomId,
    myUserId,
    mySessionId,
    initKey,

    MAX_PEERS: 4,
    ICE_SERVERS: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:turn.turn-kt.com:3478" },
    ],


    // cable subscription
    sub: null,

    // state
    peers: new Map(),             // peerUserId -> { pc, audioEl }
    knownPeerSessions: new Map(), // peerUserId -> session_id
    pendingIce: new Map(),        // peerUserId -> [candidateInit,...]

    // local audio
    localStream: null,
  };

  console.debug("[rtc] boot", {
    roomId,
    myUserId,
    mySessionId,
    initKey,
    already: !!window[initKey],
    hasRoot: !!root,
  });

  return ctx;
};
