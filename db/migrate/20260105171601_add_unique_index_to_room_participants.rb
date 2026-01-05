class AddUniqueIndexToRoomParticipants < ActiveRecord::Migration[7.1]
  def change
    add_index :room_participants, :user_id, unique: true
    add_index :room_participants, [ :room_id, :is_active ] # counts用
  end
end
