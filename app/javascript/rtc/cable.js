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
      async connected() {
        console.debug("[rtc] AC connected", {
          roomId: ctx.roomId,
          myUserId: ctx.myUserId,
          mySessionId: ctx.mySessionId,
        });

        // マイク取得（失敗しても recvonly で進む）
        try {
          await prepareLocalAudio(ctx);
        } catch (e) {
          console.warn("[rtc] getUserMedia failed:", e);
        }

        send(ctx, "join", {}); // server → present
      },

      disconnected() {
        console.debug("[rtc] AC disconnected");
      },

      received(data) {
        const type = data?.type;
        if (!type) return;

        // 自分のエコー無視
        if (data.from_user_id != null && Number(data.from_user_id) === ctx.myUserId) return;

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
