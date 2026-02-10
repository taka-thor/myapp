class CreateNgWords < ActiveRecord::Migration[7.2]
  def change
    create_table :ng_words do |t|
      t.string :word, null: false

      t.timestamps
    end

    add_index :ng_words, :word, unique: true
  end
end
