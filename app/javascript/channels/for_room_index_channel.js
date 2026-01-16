import consumer from "./consumer";

let sub = null;

function updateActiveCount(roomId, activeCount) {
  const el = document.querySelector(
    `[data-room-id="${roomId}"] [data-active-count]`
  );
  if (el) el.textContent = String(activeCount);

  // const showEl = document.querySelector("[data-show-active-count]");
  // const showRoomId = document.querySelector("[data-show-room-id]")?.dataset
  //   ?.showRoomId;
  // if (showEl && String(showRoomId) === String(roomId)) {
  //   showEl.textContent = String(activeCount);
  // }
}

export function startForRoomIndexChannel() {
  if (sub) return sub;

  console.log("[cable] for_room_index_channel start");

  sub = consumer.subscriptions.create("ForRoomIndexChannel", {
    connected() {
      console.log("[ForRoomIndexChannel] connected");
    },
    disconnected() {
      console.log("[ForRoomIndexChannel] disconnected");
    },
    received(data) {
      console.log("[ForRoomIndexChannel] received", data);

      if (!data) return;
      const roomId = data.room_id;
      const activeCount = data.active_count;
      if (roomId == null || activeCount == null) return;

      updateActiveCount(roomId, activeCount);
    },
  });

  return sub;
}

export function stopForRoomIndexChannel() {
  if (!sub) return;

  console.log("[cable] for_room_index_channel stop");
  sub.unsubscribe();
  sub = null;
}
