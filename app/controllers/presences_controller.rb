class PresencesController < ApplicationController
  before_action :set_room

  def ping
    RoomParticipant.touch!(room: @room, user: current_user)
    head :no_content # bodyを空にしてレスポンス(特段返すものない)
  end

  def leave
    RoomParticipant.leave!(room: @room, user: current_user)
    head :no_content
  end

  private
  def set_room
    @room = Room.find(params[:room_id])
  end
end
