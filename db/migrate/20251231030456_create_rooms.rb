class CreateRooms < ActiveRecord::Migration[8.1]
  def change
    create_table :rooms do |t|
      t.string :topic
      t.datetime :topic_updated

      t.timestamps
    end
  end
end
