class RoomParticipants::DeactivateStale
  def self.call(ttl_seconds: 60, now: Time.current, batch_size: 500)
    cutoff = now - ttl_seconds

    RoomParticipant
      .where(is_active: true)
      .where("last_seen_at IS NULL OR last_seen_at < ?", cutoff)
      .in_batches(of: batch_size) do |rel|
        rel.select(:id).each do |row|
          rp = RoomParticipant.find_by(id: row.id, is_active: true)
          next unless rp
          # 競合対策：更新直前にもう一回チェック
          next unless rp.last_seen_at.nil? || rp.last_seen_at < cutoff

          rp.update!(is_active: false)
        end
      end
  end
end
