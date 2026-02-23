class Rooms::BroadcastTopicEditorAndFlash
  def self.call(room:, flash:)
    flash_messages = flash.to_hash

    Turbo::StreamsChannel.broadcast_replace_to(
      room,
      target: "topic_editor",
      partial: "rooms/topic_editor",
      locals: { room: room }
    )

    Turbo::StreamsChannel.broadcast_replace_to(
      room,
      target: "flash",
      partial: "shared/flash_messages",
      locals: { flash_messages: flash_messages }
    )
  end
end
