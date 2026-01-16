// console.log("[boot] channels/index.js loaded");
import {
  startForRoomIndexChannel,
  stopForRoomIndexChannel,
} from "./for_room_index_channel";

function syncSubscriptions() {
  const page = document.querySelector("[data-page]")?.dataset?.page;

  stopForRoomIndexChannel();

  if (page === "rooms-index") {
    startForRoomIndexChannel();
  }
}

document.addEventListener("turbo:load", syncSubscriptions);
document.addEventListener("turbo:before-cache", () => {
  stopForRoomIndexChannel();
});
