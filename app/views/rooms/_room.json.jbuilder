json.extract! room, :id, :topic, :topic_updated, :user_id, :created_at, :updated_at
json.url room_url(room, format: :json)
