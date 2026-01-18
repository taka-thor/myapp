class TopicsController < ApplicationController
  before_action :set_room

  def update
    if @room.update(topic_params)
      Room::BroadcastTopic.call(room_id: @room.id)

      respond_to do |format|
        format.turbo_stream do
          render turbo_stream: turbo_stream.replace(
            "room_topic_editor",
            partial: "topics/display",
            locals: { room: @room }
          )
        end
        format.html { redirect_to @room, notice: "話題を更新しました" }
      end

    else

      respond_to do |format|
        format.turbo_stream do
          render turbo_stream: turbo_stream.replace(
            "room_topic_editor",
            partial: "topics/form",
            locals: { room: @room }
          ), status: :unprocessable_entity
        end
        format.html { render "rooms/show", status: :unprocessable_entity }
      end
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
