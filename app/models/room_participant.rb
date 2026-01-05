class RoomParticipant < ApplicationRecord
  scope :active, -> { where(is_active: true) }
  belongs_to :user
  belongs_to :room
end
