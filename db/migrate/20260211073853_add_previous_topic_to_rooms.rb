class AddPreviousTopicToRooms < ActiveRecord::Migration[7.2]
  def change
    add_column :rooms, :previous_topic, :string
  end
end
