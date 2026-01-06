class AddLastSeenAtToRoomParticipants < ActiveRecord::Migration[8.1]
  def change
    add_column :room_participants, :last_seen_at, :datetime
  end
end
