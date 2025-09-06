import consumer from "./consumer";

export function subscribeRoom(roomId, handlers = {}) {
  return consumer.subscriptions.create(
    { channel: "RoomChannel", room: roomId },
    {
      received: (msg) => handlers.onSignal?.(msg),
      sendSignal(payload) { this.perform("signal", payload); },
    }
  );
}
