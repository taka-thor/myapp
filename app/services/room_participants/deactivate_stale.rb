class RoomParticipants::DeactivateStale
  def self.call(ttl_seconds: 60, now: Time.current, batch_size: 500)
    cutoff = now - ttl_seconds

    RoomParticipant
      .where(is_active: true)
      .where("last_seen_at IS NULL OR last_seen_at < ?", cutoff)
      .find_each(batch_size: batch_size) do |rp|
        next unless rp.last_seen_at.nil? || rp.last_seen_at < cutoff

        rp.update!(is_active: false)
      end
  end
end
