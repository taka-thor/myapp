class AddUniqueIndexToRoomParticipants < ActiveRecord::Migration[7.1]
  def change
    add_index :room_participants, :user_id,
              unique: true,
              where: "is_active = 1",
              name: "index_room_participants_unique_active_user" # user_idに対するis_activeは１つまでという制約
  end
end
