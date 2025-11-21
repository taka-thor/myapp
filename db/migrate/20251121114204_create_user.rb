class CreateUser < ActiveRecord::Migration[7.2]
  def change
    create_table :users do |t|
      t.string :name
      t.text :avatar_url
      t.string :user_uuid

      t.timestamps
    end
  end
end
