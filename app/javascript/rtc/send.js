export const send = (ctx, type, payload = {}) => {
  if (!ctx.sub) return;

  ctx.sub.perform("signal", {
    type,
    room: ctx.roomId,
    from_user_id: ctx.myUserId,
    from_session_id: ctx.mySessionId,
    ...payload,
  });
};
