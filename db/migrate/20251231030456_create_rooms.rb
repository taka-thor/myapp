class CreateRooms < ActiveRecord::Migration[7.2]
  def change
    create_table :rooms do |t|
      t.string :topic
      t.datetime :topic_updated

      t.timestamps
    end
  end
end
