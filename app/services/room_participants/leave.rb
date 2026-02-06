class RoomParticipants::Leave
  def self.call(room:, user:)
    rp = RoomParticipant.find_by(room_id: room, user_id: user)

    unless rp # もし〜でなければ
      Rails.logger.info("[RoomParticipants::Leave] not found room_id=#{room.id} user_id=#{user.id}")
      return nil
    end

    # update_all だと after_commit が発火しないため、update! へ
    rp.update!(is_active: false)
    rp
  end
end
