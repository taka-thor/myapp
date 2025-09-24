class PingChannel < ApplicationCable::Channel
  def subscribed
    stream_from "ping:#{connection.uuid}"
    transmit type: "hello", msg: "connected"
  end

  def speak(data)
    ActionCable.server.broadcast "ping:#{connection.uuid}", { type: "echo", msg: data["text"] }
  end
end
