class RoomParticipants::Ping
  def self.call(room:, user:, muted: nil)
    rp = RoomParticipant.find_or_initialize_by(room_id: room.id, user_id: user.id) # 探す、なければ新規作成
    rp.is_active = true
    rp.last_seen_at = Time.current
    rp.muted = ActiveModel::Type::Boolean.new.cast(muted) unless muted.nil?
    rp.save!
    RoomParticipants::BroadcastPresenceChanges.call(room) if rp.saved_change_to_muted?
    rp
  end
end
