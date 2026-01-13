class RoomParticipant < ApplicationRecord
  belongs_to :user
  belongs_to :room
  after_commit :broadcast_room_active_users, if: :saved_change_to_is_active?

  scope :active, -> { where(is_active: true) }
  # Room_participants.where(is_active: true) = Room_participants.activeとなる（エイリアスのようなもの）

  scope :active_recent, ->(ttl_seconds = 180) { # TTL(time to live)
    where(is_active: true)
      .where("last_seen_at >= ?", ttl_seconds.seconds.ago) # ttl_seconds(=180).seconds(=秒).ago(=前) =>180秒前 その基準はTime.current
  }                                                        # >=?の?にttl_seconds.seconds.agoの値を渡している Time.currentから180秒以内の値があるレコードを選択

  private
    def broadcast_room_active_users
      ActionCable.server.broadcast(
        "for_room_index",
        room_id: room_id,
        active_count: room.room_participants.active_recent.count
      )
    end
end
