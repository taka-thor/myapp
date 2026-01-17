class ActiveUsersController < ApplicationController
  def index
    counts = RoomParticipant.active.group(:room_id).count
    render json: counts
  end
end
