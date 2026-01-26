class RoomParticipants::BroadcastPresenceChanges
  def self.call(room)
    rid = room&.id
    Rails.logger.info("[presence:broadcast] start room_id=#{rid}")

    active_count = room.room_participants.active.count
    Rails.logger.info("[presence:broadcast] active_count=#{active_count} room_id=#{rid}")

    Turbo::StreamsChannel.broadcast_replace_to(
      "for_room_index",
      target: "room_#{rid}_active_count",
      partial: "rooms/active_count",
      locals: { room: room, active_user_count: active_count }
    )
    Rails.logger.info("[presence:broadcast] sent active_count room_id=#{rid}")

    Turbo::StreamsChannel.broadcast_replace_to(
      room,
      target: "room_#{rid}_participants",
      partial: "rooms/participants",
      locals: { room: room }
    )
    Rails.logger.info("[presence:broadcast] sent participants room_id=#{rid}")

  rescue => e
    Rails.logger.error("[presence:broadcast] FAILED room_id=#{rid} #{e.class}: #{e.message}")
    Rails.logger.error(e.backtrace.take(30).join("\n"))
    raise
  end
end
