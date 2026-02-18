class RoomsController < ApplicationController
  before_action :set_room, only: %i[ show edit update ]
  before_action :leave_room_for_index, only: %i[ index ]

  def index
    @rooms = Room.order(:id)
    @active_user_counts = RoomParticipant.active.group(:room_id).count
    # response.set_header("Turbo-Cache-Control", "no-cache")
  end

  def show
    @room = Room.find(params[:id])

    @room_participant = @room.room_participants.find_or_create_by!(user: current_user)
    @room_participant.update!(
      is_active: true,
      last_seen_at: Time.current,
      session_id: SecureRandom.uuid
    )
  end

  def edit; end

  def update; end

  private

  def set_room
    @room = Room.find(params[:id])
  end

  def leave_room_for_index
    leave_user = RoomParticipant.find_by(user_id: current_user.id, is_active: true)
    return unless leave_user
    room = leave_user&.room_id
    RoomParticipants::Leave.call(room: room, user: current_user.id)
  end
end
