class User < ApplicationRecord
  validates :name,
              presence: true,
              uniqueness: true,
              length:  { maximum: 10 },
              format:  {
                with: /\A\p{Hiragana}+\z/
              }, on: :nickname_step
end
