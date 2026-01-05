class User < ApplicationRecord
  has_many :room_participants
  has_many :rooms, through: :room_participants
  validates :name,
            presence:   true,
            uniqueness: true,
            length:     { maximum: 10 },
            format:     { with: /\A\p{Hiragana}+\z/ },
            ng_word:    true,
            on:         :nickname_step
end
