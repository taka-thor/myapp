class AddSessionIdToRoomParticipants < ActiveRecord::Migration[7.2]
  def change
    add_column :room_participants, :session_id, :string
    add_index :room_participants, :session_id
  end
end
