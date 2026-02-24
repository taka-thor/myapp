class User < ApplicationRecord
  has_many :room_participants, dependent: :destroy
  has_many :rooms, through: :room_participants
  validates :name,
            presence:   true,
            uniqueness: true,
            length:     { maximum: 10 },
            format:     { with: /\A[\p{Hiragana}\p{Katakana}ー〜!！?？]+\z/ },
            ng_word:    true,
            on:         :nickname_step
end
