class RoomChannel < ApplicationCable::Channel
  def subscribed
    stream_from "room:#{params[:room]}"
  end

  def signal(data)
    # そのまま部屋に中継（送信者識別が必要なら data.merge(from: connection_identifier) 等で）
    ActionCable.server.broadcast("room:#{params[:room]}", data)
  end
end
