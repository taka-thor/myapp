class TopicsController < ApplicationController
  before_action :set_room

  def update
    if @room.update(topic_params)
        Rooms::BroadcastTopic.call(room_id: @room.id) if @room.saved_change_to_topic?

        flash.now[:notice] = "話題を更新しました"
        Rooms::BroadcastTopicEditorAndFlash.call(room: @room, flash: flash)
    else
      @room.restore_attributes([ :topic ])
      render turbo_stream: turbo_stream.replace(
        "topic_editor",
        partial: "rooms/topic_editor",
        locals: { room: @room }
      ),
      status: :unprocessable_entity

    end
  end

  private

  def set_room
    @room = Room.find(params[:room_id])
  end

  def topic_params
    params.require(:room).permit(:topic)
  end
end
