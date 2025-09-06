class RoomsController < ApplicationController
  def show
    @room_id = params[:id]
    @client_id = SecureRandom.uuid
  end
end
