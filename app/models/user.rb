class User < ApplicationRecord
  validates :name,
            presence:   true,
            uniqueness: true,
            length:     { maximum: 10 },
            format:     { with: /\A\p{Hiragana}+\z/ },
            ng_word:    true,
            on:         :nickname_step
end
