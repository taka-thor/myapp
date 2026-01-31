export const atCapacity = (ctx) => ctx.peers.size >= (ctx.MAX_PEERS - 1);

export const discard = (_ctx, reason, data) => {
  console.debug("[rtc] discard:", reason, data);
};

export const acceptIfToMe = (ctx, data) => {
  if (data.to_user_id != null && Number(data.to_user_id) !== ctx.myUserId) {
    discard(ctx, "to_user_id mismatch", data);
    return false;
  }
  if (data.to_session_id != null && String(data.to_session_id) !== ctx.mySessionId) {
    discard(ctx, "to_session_id mismatch", data);
    return false;
  }
  return true;
};
