import consumer from "./consumer";

function updateActiveCount(roomId, activeCount) {
  // 1) 一覧（rooms/index）向け：data-room-id + data-active-count
  const el = document.querySelector(
    `[data-room-id="${roomId}"] [data-active-count]`
  );
  if (el) el.textContent = String(activeCount);

  // 2) 詳細（rooms/show）向け：任意（後述のshow.html.erbで置く）
  const showEl = document.querySelector("[data-show-active-count]");
  const showRoomId = document.querySelector("[data-show-room-id]")?.dataset
    ?.showRoomId;
  if (showEl && String(showRoomId) === String(roomId)) {
    showEl.textContent = String(activeCount);
  }
}

consumer.subscriptions.create("ForRoomIndexChannel", {
  connected() {
    // eslint-disable-next-line no-console
    console.log("[ForRoomIndexChannel] connected");
  },

  disconnected() {
    // eslint-disable-next-line no-console
    console.log("[ForRoomIndexChannel] disconnected");
  },

  received(data) {
    // data: { room_id: 1, active_count: 3 }
    // eslint-disable-next-line no-console
    console.log("[ForRoomIndexChannel] received", data);

    if (!data) return;
    const roomId = data.room_id;
    const activeCount = data.active_count;
    if (roomId == null || activeCount == null) return;

    updateActiveCount(roomId, activeCount);
  },
});
