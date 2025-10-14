# app/channels/rtc_channel.rb
class RtcChannel < ApplicationCable::Channel
  def subscribed
    raw_room = params[:room].presence || "rtc_room"
    # ハイフンをアンダースコアに変換して正規化
    @room = raw_room.to_s.tr("-", "_")  
    stream_from stream_key
  end

  def unsubscribed
    # no-op
  end

  def signal(data)
    ActionCable.server.broadcast(stream_key, data)
  end

  private

  def stream_key
    "rtc_room:#{@room}"
  end
end
