class PresencesController < ApplicationController
  before_action :set_room, only: %i[ping leave]

  def ping
    RoomParticipants::Ping.call(room: @room, user: current_user)
    head :no_content
  end

  def leave
    RoomParticipants::Leave.call(room: @room, user: current_user)
    head :no_content
  end

  private
  def set_room
    @room = Room.find(params[:room_id]) # pingやleaveでfetchするときにdocumentから取得するURLからのparameter =>rooms/id/presence/ping
  end
end
