class Room::BroadcastTopic
  def self.call(room_id:)
    room = Room.find(room_id)
    topic = room.topic

    Turbo::StreamsChannel.broadcast_replace_to(
      room,
      target: "room_topic",
      partial: "rooms/topic_show",
      locals: { room: room, topic: topic }
    )

    Turbo::StreamsChannel.broadcast_replace_to(
      "for_room_index",
      target: "room_#{room.id}_topic",
      partial: "rooms/topic_index",
      locals: { room: room, topic: topic }
    )
  end
end
