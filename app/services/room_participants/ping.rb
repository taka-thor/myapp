class RoomParticipants::Ping
  def self.call(room:, user:)
    rp = RoomParticipant.find_or_initialize_by(room_id: room.id, user_id: user.id) # 探す、なければ新規作成
    rp.is_active = true
    rp.last_seen_at = Time.current
    rp.save!
    rp
  end
end
