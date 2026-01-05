class Room < ApplicationRecord
  has_many :room_participants
  has_many :users, through: :room_participants

  has_many :active_room_participants,
          -> { where(is_active: true) },
          class_name: "RoomParticipant"

  has_many :active_users,
          through: :active_room_participants,
          source: :user

  validates :topic, length: { maximum: 12 }, presence: true, ng_word: true
end
