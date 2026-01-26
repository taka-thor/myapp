class RoomsController < ApplicationController
  before_action :set_room, only: %i[ show edit update ]

def index
  @rooms = Room.all
  @active_user_counts = RoomParticipant.active.group(:room_id).count
  # response.set_header("Turbo-Cache-Control", "no-cache")
end

  # GET /rooms/1 or /rooms/1.json
  def show
  @room = Room.find(params[:id])

  rp = @room.room_participants.find_or_initialize_by(user: current_user)
  rp.is_active = true
  rp.last_seen_at = Time.current
  rp.save!
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
