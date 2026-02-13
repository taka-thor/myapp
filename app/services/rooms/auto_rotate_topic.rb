class Rooms::AutoRotateTopic
  def self.call
    new.call
  end

  def call
    assign_topic
  end

  def find_vacant_room
    active_room_ids = RoomParticipant.active.distinct.pluck(:room_id)
    Room.where.not(id: active_room_ids)
  end

  def find_used_topic
    Room.pluck(:topic, :previous_topic).flatten.compact.uniq
  end

  def find_available_topic
    AutoTopic.where.not(topic: find_used_topic).pluck(:topic)
  end

  def assign_topic
    available_topic = find_available_topic.shuffle
    if available_topic.empty?
      Rails.logger.warn("[AutoRotateTopic] No available topics. Skip.")
      return
    end

    find_vacant_room.find_each do |room|
      new_topic = available_topic.shift
      break unless new_topic
      room.update!(
        previous_topic: room.topic,
        topic: new_topic
      )
    end
  end
end
