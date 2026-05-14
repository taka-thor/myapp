import { startSpeakingFromStream } from "./speaking_ring";
import { applyLocalMuteState } from "./mute_control";

// showアクションがよばれて参加者全員のアイコンなどをDOMに追加。同時進行でjsも処理され、DOM描画よりもstartSpeakingFromStreamメソッドが実行されると不具合が生じるため、DOMが描画されるまで待つ。ここは保険の処理。
const startMeSpeakingSafely = (ctx) => {
  const tryStart = (retry = 0) => {
    const el = document.querySelector(`[data-rtc-user-id="${ctx.myUserId}"]`);
    if (!el) {
      if (retry < 10) requestAnimationFrame(() => tryStart(retry + 1));// ブラウザに次の画面描画のタイミングで、実行する関数を指定できる。
      return;
    }

    startSpeakingFromStream(ctx, ctx.myUserId, ctx.localStream, {
      threshold: 0.01,
      holdMs: 600,
      debug: true,
      debugEveryMs: 250,
      isSuppressed: () => Boolean(ctx.isMuted),
    });
  };

  tryStart();
};

export const prepareLocalAudio = async (ctx) => { //ユーザーの音声ストリームを取得する処理
  console.log("[rtc] prepareLocalAudio called", {
    hasLocalStream: !!ctx.localStream, // !!で真偽値を返す
    myUserId: ctx.myUserId,
  });

  if (ctx.localStream) return ctx.localStream;

  ctx.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });//ユーザーのマイクから音声ストリームのみを取得
  console.log("[rtc] got local audio tracks:", ctx.localStream.getAudioTracks().length);//ctx.localStreamはMediaStreamオブジェクト。音声トラックは、自分のマイク１つにつき1

  applyLocalMuteState(ctx);//現在のミュート状態を検知
  startMeSpeakingSafely(ctx);

  return ctx.localStream;
};
