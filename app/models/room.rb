class Room < ApplicationRecord
  validates :topic, length: { maximum: 12 }, presence: true, ng_word: true
end
