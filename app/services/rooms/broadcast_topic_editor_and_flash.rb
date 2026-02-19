class Rooms::BroadcastTopicEditorAndFlash
  def self.call(room:, flash:)
    flash_messages = flash.to_hash

    streams = [
      Turbo::StreamsChannel.turbo_stream_action_tag(
        :replace,
        target: "topic_editor",
        template: ApplicationController.render(
          partial: "rooms/topic_editor",
          locals: { room: room },
          formats: [ :html ]
        )
      ),
      Turbo::StreamsChannel.turbo_stream_action_tag(
        :replace,
        target: "flash",
        template: ApplicationController.render(
          partial: "shared/flash_messages",
          locals: { flash_messages: flash_messages },
          formats: [ :html ]
        )
      )
    ].join

    Turbo::StreamsChannel.broadcast_stream_to(room, content: streams)
  end
end
