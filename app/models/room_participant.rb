class RoomParticipant < ApplicationRecord
  belongs_to :user
  belongs_to :room

  scope :active, -> { where(is_active: true) }
  # Room_participants.where(is_active: true) = Room_participants.activeとなる（エイリアスのようなもの）

  scope :active_recent, ->(ttl_seconds = 180) { # TTL(time to live)
    where(is_active: true)
      .where("last_seen_at >= ?", ttl_seconds.seconds.ago) # ttl_seconds(=180).seconds(=秒).ago(=前) =>180秒前 その基準はTime.current
  }                                                        # >=?の?にttl_seconds.seconds.agoの値を渡している Time.currentから180秒以内の値があるレコードを選択

  def self.enter!(room:, user:)
    rp = find_or_initialize_by(room_id: room.id, user_id: user.id)
    rp.is_active = true
    rp.last_seen_at = Time.current
    rp.save!
    rp
  end

  def self.touch!(room:, user:) # ブラウザからheartbeatを取得後にDBを更新するメソッド
    where(room_id: room.id, user_id: user.id)
      .update_all(is_active: true, last_seen_at: Time.current)
  end

  def self.leave!(room:, user:)
    where(room_id: room.id, user_id: user.id)
      .update_all(is_active: false)
  end
end
