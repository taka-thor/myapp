class Rooms::BroadcastFlash
  def self.call(room:, flash_messages:)
    Turbo::StreamsChannel.broadcast_replace_to(
      room,
      target: "flash",
      partial: "shared/flash_messages",
      locals: { flash_messages: flash_messages }
    )
  end
end
