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
    when "ng_word_detected"
      transcript = String(data["transcript"] || "")
      normalized = NgWord.word_filter(transcript)
      Rails.logger.info("[rtc:ng] detected from_user_id=#{current_user.id} room_id=#{@room_id} normalized='#{normalized}'")
      if normalized.present?
        validation_room = Room.new(speaking: normalized)
        validation_room.validate

        if validation_room.errors.added?(:speaking, :ng_word)
          ng_message = validation_room.errors.full_message(
            :speaking,
            validation_room.errors.generate_message(:speaking, :ng_word)
          )

          Rooms::BroadcastFlash.call(
            room: Room.find(@room_id),
            flash_messages: { alert: ng_message }
          )
          Rails.logger.info("[rtc:ng] broadcasted alert room_id=#{@room_id} message='#{ng_message}'")
        else
          Rails.logger.info("[rtc:ng] no_match room_id=#{@room_id}")
        end
      end
    else
      ActionCable.server.broadcast(signaling_info, data) # data["type"]がjoinやmute_changedでなければ、ここでブロードキャスト。シグナリング情報が入る。
    end
  end

  private

  def signaling_info
    "rtc_room:#{@room_id}"
  end
end
