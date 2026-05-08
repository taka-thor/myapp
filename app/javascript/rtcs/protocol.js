import { atCapacity, acceptIfToMe, discard } from "./utils";
import { newPeerConnection, flushPendingIce } from "./peer";
import { send } from "./send";

// makeOfferToで、全参加者１人ずつのuserid、sessionidをfor文で送っている。
export const makeOfferTo = async (ctx, peerUserId, peerSessionId) => {
  if (atCapacity(ctx)) return;

  const entry = ctx.peers.get(peerUserId);
  const pc = entry?.pc || newPeerConnection(ctx, peerUserId, peerSessionId); //自分だけが保有する各参加者とのRTC接続オブジェクト

  try {
<<<<<<< Updated upstream
    const offer = await pc.createOffer({ offerToReceiveAudio: true }); //通信条件の提案書作成(音声のみ受け取りたい希望含み)
    await pc.setLocalDescription(offer);// RTCオブジェクトに通信条件を乗せる
=======
    const offer = await pc.createOffer({ offerToReceiveAudio: true }); //SDPオブジェクト生成
    await pc.setLocalDescription(offer); //ICE候補の収集開始→onicecandidateが順次発火 RTCPeerConnectionオブジェクトにICEサーバー情報を渡した後にこのメソッドでICE候補を集める
>>>>>>> Stashed changes

    send(ctx, "offer", {
      to_user_id: peerUserId,
      to_session_id: peerSessionId,
      sdp: offer, //crateOfferで生成
    });

    console.debug("[rtc] offer sent ->", peerUserId);
  } catch (e) {
    console.warn("[rtc] offer error ->", peerUserId, e?.message || e);
  }
};
// type "offer"のsend後、相手ブラウザでanswerToが実行される
export const answerTo = async (ctx, peerUserId, peerSessionId, remoteDesc) => {
  const entry = ctx.peers.get(peerUserId);
  const pc = entry?.pc || newPeerConnection(ctx, peerUserId, peerSessionId);

  try {
    await pc.setRemoteDescription(remoteDesc);//相手(offer)からのSDPをRTCオブジェクトにのせる
    await flushPendingIce(ctx, peerUserId);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer); //既存ユーザも新規ユーザーのICE候補をRTC接続オブジェクトに保管

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

  if (data.from_user_id != null && Number(data.from_user_id) === ctx.myUserId) return;

  switch (type) {
    case "present": {
      if (!acceptIfToMe(ctx, data)) return;
      ///data.peersは自分以外の参加者のuserID,sessionIDを保持
      const list = Array.isArray(data.peers) ? data.peers : []; //Array.isArrayで配列かどうか調べるメソッド
      console.debug("[rtc] present", list);

      for (const p of list) {
        if (atCapacity(ctx)) break;//接続上限に余裕があるかどうかを確認する処理
        //適切な値を保持しているか確認する処理
        const peerUserId = Number(p.user_id);
        const peerSessionId = String(p.session_id || "");
        if (!peerUserId || !peerSessionId) continue;
        if (peerUserId === ctx.myUserId) continue;
        if (ctx.knownPeerSessions.has(peerUserId)) continue;

        ctx.knownPeerSessions.set(peerUserId, peerSessionId); //for文の中のctxは、同じオブジェクトのためatCapaciityのsizeが増えていく
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

      // offerに対してのanswer (offerのSDPをRTCセッション記述オブジェクトに変換)
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

    // 相手から自分宛に届いたICE候補をctxに保管(remoteDescription次第)
    case "ice": {
      if (!acceptIfToMe(ctx, data)) return;

      const fromUserId = Number(data.from_user_id); //data.from_user_idに値がなくても、NaNと処理され落ちない
      const fromSessionId = String(data.from_session_id || "");
      if (!fromUserId || !fromSessionId) return;

      const known = ctx.knownPeerSessions.get(fromUserId); //knownPeerSessionsは、context.jsで定めたMapオブジェクト
      if (known && known !== fromSessionId) {              //sessionIDでICE候補、シグナリング情報の一意性を管理
        discard(ctx, "from_session_id mismatch (known)", data);
        return;
      }

      const entry = ctx.peers.get(fromUserId);
      const c = data.candidate; //peer.jsのonicecandidateでブロードキャストされたもの
      if (!entry || !c || !c.candidate) return;

      if (!entry.pc.remoteDescription) {
        const arr = ctx.pendingIce.get(fromUserId) || [];
        arr.push(c);
        ctx.pendingIce.set(fromUserId, arr); //userIDとICE候補を保管。
        return;
      }

      entry.pc
        .addIceCandidate(new RTCIceCandidate(c)) //相手のICE候補をRTCpeerconnectionオブジェクトに登録
        .catch((e) => console.warn("[rtc] addIceCandidate err:", e, c));
      break;
    }

    default: //どのcaseにも該当しないときの処理
      break;
  }
};
