// シグナリングの部分　typeはシグナリング種別 offerなど
export const send = (ctx, type, payload = {}) => {
  if (!ctx.sub) return;
  //performは、クライアント側からサーバー側のチャネルアクションを呼ぶ標準メソッド。
  //rtc_channelにdata変数として渡す
  //cable.jsでctx.subを代入している
  ctx.sub.perform("signal", {
    type,
    room: ctx.roomId,
    from_user_id: ctx.myUserId,
    from_session_id: ctx.mySessionId,
    ...payload,
  });
};
