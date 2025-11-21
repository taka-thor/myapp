class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :name
      t.text :avatar_url
      t.string :user_uuid

      t.timestamps
    end
  end
end
