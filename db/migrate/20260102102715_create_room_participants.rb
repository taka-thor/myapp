class CreateRoomParticipants < ActiveRecord::Migration[8.1]
  def change
    create_table :room_participants do |t|
      t.belongs_to :user, null: false, foreign_key: true
      t.belongs_to :room, null: false, foreign_key: true
      t.boolean :is_active
      t.datetime :joined_at
      t.datetime :left_at

      t.timestamps
    end
  end
end
