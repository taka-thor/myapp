export const createRtcContext = () => {
  const root = document.getElementById("presence-hook");
  if (!root) return null;//presence-hookが見つからない時にnull(null=falsy扱い) → entry.jsのctxがfalsy判定。
  // rootでない場合、nullを返すように指定しない場合は、undefinedを返す仕様。
  // nullでもundefinedでも結果だけど、意図的に何も返さないことを明示するためにnullを使う

  const roomId = String(root.dataset.roomId || "");
  const myUserId = Number(root.dataset.userId);
  const mySessionId = String(root.dataset.sessionId || "");
  // datasetから取得できる値は文字列なので、String型を指定。

  if (!roomId || !myUserId || !mySessionId) {
    console.warn("[rtc] missing dataset", { roomId, myUserId, mySessionId });
    return null;
  }

  const initKey = `__rtc_init_room_${roomId}`;
  if (window[initKey]) return null;
  window[initKey] = true;

  const ctx = {
    roomId, //const roomId関数などをここで呼んでいる
    myUserId,
    mySessionId,
    initKey,

    MAX_PEERS: 4,
    ICE_SERVERS: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:turn.turn-kt.com:3478" },
    ],

    sub: null,

    peers: new Map(),
    knownPeerSessions: new Map(), // キーと値で表現するコレクションがMap
    pendingIce: new Map(),

    localStream: null,
    isMuted: false,
    pendingMuteBroadcast: false,
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
