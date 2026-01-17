class ForRoomIndexChannel < ApplicationCable::Channel
  def subscribed
    stream_from "for_room_index"
  end
end
