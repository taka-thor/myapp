class RoomParticipants::BroadcastActiveUserCount
  def self.call(room_id:)
    room = Room.find(room_id)
    active_count = room.room_participants.active.count

    Turbo::StreamsChannel.broadcast_replace_to(
      "for_room_index",
      target: "room_#{room.id}_active_count",
      partial: "rooms/active_count",
      locals: { room: room, active_count: active_count }
    )
  end
end
