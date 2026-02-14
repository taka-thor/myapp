class AutoTopics::BroadcastTopic
  def self.call(room_id:)
    room = Room.find(room_id)
    topic = room.topic

    Turbo::StreamsChannel.broadcast_replace_to(
      "for_room_index",
      target: "room_#{room.id}_topic",
      partial: "rooms/topic_index_and_show",
      locals: { room: room, topic: topic }
    )
  end
end
