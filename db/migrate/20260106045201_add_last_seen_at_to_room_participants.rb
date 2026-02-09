class AddLastSeenAtToRoomParticipants < ActiveRecord::Migration[7.2]
  def change
    add_column :room_participants, :last_seen_at, :datetime
  end
end
