class RoomParticipants::BroadcastPresenceChanges
  def self.call(room)
    Turbo::StreamsChannel.broadcast_replace_to(
      "for_room_index",
      target: "room_#{room.id}_active_count",
      partial: "rooms/active_count",
      locals: { room: room, active_user_count: room.room_participants.active.count }
    )

    Turbo::StreamsChannel.broadcast_replace_to(
      room,
      target: "room_#{room.id}_participants",
      partial: "rooms/participants",
      locals: { room: room }
    )
  end
end
