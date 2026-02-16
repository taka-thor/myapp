class CreateAutoTopics < ActiveRecord::Migration[7.2]
  def change
    create_table :auto_topics do |t|
      t.string :topic

      t.timestamps
    end
  end
end
