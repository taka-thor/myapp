class RtcChannel < ApplicationCable::Channel
  def subscribed
    @room_id = params[:room].presence
    reject unless @room_id

    stream_from signaling_info
  end

  # data変数はsend.jsからperformメソッドで送られる。
  #
  def signal(data)
    case data["type"]
    when "join"

      peers = RoomParticipant
        .where(room_id: @room_id, is_active: true)
        .where.not(user_id: current_user.id)
        .pluck(:user_id, :session_id)
        .map { |uid, sid| { user_id: uid, session_id: sid } }

      transmit({
        type: "present",
        peers: peers,
        to_user_id: current_user.id,
        to_session_id: data["from_session_id"]
      })
    when "mute_changed" # payloadのtypeがmute_changeの時だけ
      muted = ActiveModel::Type::Boolean.new.cast(data["muted"]) # data["muted"]はクライアントから送られてきた値。これをRails仕様の真偽値に変換し、安全にDBに入れることを目的としている。
      participant = RoomParticipant.find_by(
        room_id: @room_id,
        user_id: current_user.id,
        is_active: true,
        session_id: data["from_session_id"]
      )
      participant&.update!(muted: muted)
      RoomParticipants::BroadcastPresenceChanges.call(Room.find(@room_id))
      ActionCable.server.broadcast(signaling_info, {
        type: "mute_changed",
        room: @room_id,
        from_user_id: current_user.id,
        from_session_id: data["from_session_id"],
        muted: muted
      })
    else
      ActionCable.server.broadcast(signaling_info, data)
    end
  end

  private

  def signaling_info
    "rtc_room:#{@room_id}"
  end
end
