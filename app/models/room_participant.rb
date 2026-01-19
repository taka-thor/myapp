class RoomParticipant < ApplicationRecord
  belongs_to :user
  belongs_to :room
  after_commit :broadcast_room_active_users, if: :saved_change_to_is_active?

  scope :active, -> { where(is_active: true) }
  # Room_participants.where(is_active: true) = Room_participants.activeとなる（エイリアスのようなもの）

  # 購読先にdataオブジェクトを送る。中身はbroadcastした分
  private
    def broadcast_room_active_users
        active_user_count = self.room.room_participants.active.count

        Turbo::StreamsChannel.broadcast_replace_to(
        "for_room_index",
        target: "room_#{room.id}_active_count",
        partial: "rooms/active_count",
        locals: { room: room,
                  active_user_count: active_user_count }
      )
    end
end
