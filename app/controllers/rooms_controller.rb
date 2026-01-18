class RoomsController < ApplicationController
  before_action :set_room, only: %i[ show edit update ]

def index
  @rooms = Room.all
  @active_user_counts = RoomParticipant.active.group(:room_id).count
end

  # GET /rooms/1 or /rooms/1.json
  def show
  end

  def edit; end

  def update
  @room = Room.find(params[:id])
  @room.update!(room_params)

  Room::BroadcastTopic.call(room_id: @room.id) if @room.saved_change_to_topic?

  redirect_to @room
  end

  private

  def set_room
    @room = Room.find(params[:id])
  end

  def room_params
    params.require(:room).permit(:topic, :topic_updated, :user_id)
  end
end
