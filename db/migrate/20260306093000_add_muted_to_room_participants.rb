class AddMutedToRoomParticipants < ActiveRecord::Migration[7.2]
  def change
    add_column :room_participants, :muted, :boolean, default: false, null: false
  end
end
