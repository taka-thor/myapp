import consumer from "../channels/consumer";
import { prepareLocalAudio } from "./audio_local";
import { handleReceived } from "./protocol";
import { closePeer } from "./peer";
import { send } from "./send";

export const connectCable = (ctx) => {
  if (ctx.sub) return;

  ctx.sub = consumer.subscriptions.create(
    { channel: "RtcChannel", room: ctx.roomId },
    {
      async connected() { //接続が確立したら自動で呼ぶconnectedメソッド
        console.debug("[rtc] AC connected", {
          roomId: ctx.roomId,
          myUserId: ctx.myUserId,
          mySessionId: ctx.mySessionId,
        });

        try {
          await prepareLocalAudio(ctx);
        } catch (e) {
          console.warn("[rtc] getUserMedia failed:", e);
        }

        send(ctx, "join", {});
        if (ctx.pendingMuteBroadcast) {
          send(ctx, "mute_changed", { muted: ctx.isMuted });
          ctx.pendingMuteBroadcast = false;
        }
      },

      disconnected() {
        console.debug("[rtc] AC disconnected");
      },
      // サーバー側からのデータを受け取るとき、つまりブロードキャストの時
      received(data) {
        const type = data?.type; //data?は、もしdataに値がなくてもエラーにならない
        if (!type) return;

        if (type === "mute_changed") return;

        const fromMe =
          data.from_user_id != null && //&&は左がfalsyなら右を評価せずに左を返す。 data.from_user_id != nullが１つの評価する式。これがfalseだと全体がfalseになる。
          Number(data.from_user_id) === ctx.myUserId &&
          String(data.from_session_id || "") === ctx.mySessionId;
        if (fromMe) return;

        if (type === "leave") {
          const fromUserId = Number(data.from_user_id);
          if (!fromUserId) return;
          closePeer(ctx, fromUserId);
          return;
        }

        handleReceived(ctx, data);
      },
    }
  );
};
