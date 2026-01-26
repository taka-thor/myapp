class RoomsController < ApplicationController
  before_action :set_room, only: %i[ show edit update ]

def index
  @rooms = Room.all
  @active_user_counts = RoomParticipant.active.group(:room_id).count
  # response.set_header("Turbo-Cache-Control", "no-cache")
end

  def show
  @room = Room.find(params[:id])

  user_status = @room.room_participants.find_or_initialize_by(user: current_user)
  user_status.is_active = true
  user_status.last_seen_at = Time.current
  user_status.save!
end

  def edit; end

  def update
  @room = Room.find(params[:id])
  @room.update!(room_params)

  Rooms::BroadcastTopic.call(room_id: @room.id) if @room.saved_change_to_topic?

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
