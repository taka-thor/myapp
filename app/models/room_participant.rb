class RoomParticipant < ApplicationRecord
  belongs_to :user
  belongs_to :room
  after_commit :broadcast_room_active_users, if: :saved_change_to_is_active?

  scope :active, -> { where(is_active: true) }
  # Room_participants.where(is_active: true) = Room_participants.activeとなる（エイリアスのようなもの）

  # 購読先にdataオブジェクトを送る。中身はbroadcastした分
  private
    def broadcast_room_active_users
        ActionCable.server.broadcast(
        "for_room_index",
        { room_id: room_id, active_count: room.room_participants.active.count } # =self.room.room_participants.active.count
        )
    end
end
