class TopicsController < ApplicationController
  before_action :set_room

  def update
    @room.update!(topic_params)
    Rooms::BroadcastTopic.call(room_id: @room.id) if @room.saved_change_to_topic?

    flash.now[:notice] = "話題を更新しました"
    Rooms::BroadcastTopicEditorAndFlash.call(room: @room, flash: flash)

    respond_to do |format|
      format.turbo_stream { head :ok }
      format.html { redirect_to room_path(@room), notice: "話題を更新しました" }
    end
  end
  #     respond_to do |format|
  #       format.turbo_stream do
  #         render turbo_stream: turbo_stream.replace(
  #           "room_topic_editor",
  #           partial: "topics/display",
  #           locals: { room: @room }
  #         )
  #       end
  #       format.html { redirect_to @room, notice: "話題を更新しました" }
  #     end

  #   else

  #     respond_to do |format|
  #       format.turbo_stream do
  #         render turbo_stream: turbo_stream.replace(
  #           "room_topic_editor",
  #           partial: "topics/form",
  #           locals: { room: @room }
  #         ), status: :unprocessable_entity
  #       end
  #       format.html { render "rooms/show", status: :unprocessable_entity }
  #     end
  #   end
  # end

  private

  def set_room
    @room = Room.find(params[:room_id])
  end

  def topic_params
    params.require(:room).permit(:topic)
  end
end
