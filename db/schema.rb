# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_01_05_171601) do
  create_table "ng_words", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "word", null: false
    t.index ["word"], name: "index_ng_words_on_word", unique: true
  end

  create_table "room_participants", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "is_active"
    t.datetime "joined_at"
    t.datetime "left_at"
    t.integer "room_id", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["room_id"], name: "index_room_participants_on_room_id"
    t.index ["user_id"], name: "index_room_participants_on_user_id"
    t.index ["user_id"], name: "index_room_participants_unique_active_user", unique: true, where: "is_active = 1"
  end

  create_table "rooms", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "topic"
    t.datetime "topic_updated"
    t.datetime "updated_at", null: false
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "icon_url"
    t.string "name"
    t.datetime "updated_at", null: false
    t.string "user_uuid"
  end

  add_foreign_key "room_participants", "rooms"
  add_foreign_key "room_participants", "users"
end
