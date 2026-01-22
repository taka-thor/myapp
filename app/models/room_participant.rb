class RoomParticipant < ApplicationRecord
  belongs_to :user
  belongs_to :room
  after_commit -> { RoomParticipants::BroadcastPresenceChanges.call(self.room) },
                    if: :saved_change_to_is_active?

  scope :active, -> { where(is_active: true) }
end
