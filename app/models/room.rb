class Room < ApplicationRecord
  validates :topic, length: { maximum: 12 }
end
