require "rails_helper"

RSpec.describe "部屋入室フロー", type: :system do
  let(:icon_url) { "https://example.com/icon.png" }
  let!(:room) { Room.create!(topic: "今日の話題") }
  let!(:user) { User.create!(name: "たろう", icon_url: icon_url) }

  before do
    driven_by :selenium_chrome_headless
    allow(Icons::GetUrlFromS3).to receive(:call).and_return([ icon_url ])
    page.set_rack_session user_info: user.id
  end

  describe "初期表示" do
    it "部屋一覧にトピックが表示される" do
      visit rooms_path
      expect(page).to have_css("[data-topic-text]", text: "今日の話題")
    end

    it "部屋一覧に参加人数バッジが表示される" do
      other_user = User.create!(name: "はなこ", icon_url: icon_url)
      room.room_participants.create!(
        user: other_user, is_active: true,
        last_seen_at: Time.current, session_id: SecureRandom.uuid, muted: false
      )

      visit rooms_path
      expect(page).to have_css("[data-active-count]", text: "1")
    end
  end

  describe "リアルタイム更新" do
    it "別ユーザーが入室すると参加人数が増える" do
      visit rooms_path
      expect(page).to have_css("[data-active-count]", text: "0")

      other_user = User.create!(name: "はなこ", icon_url: icon_url)
      room.room_participants.create!(
        user: other_user, is_active: true,
        last_seen_at: Time.current, session_id: SecureRandom.uuid, muted: false
      )
      RoomParticipants::BroadcastPresenceChanges.call(room.reload)

      expect(page).to have_css("[data-active-count]", text: "1")
    end

    it "別ユーザーが退出すると参加人数が減る" do
      other_user = User.create!(name: "はなこ", icon_url: icon_url)
      rp = room.room_participants.create!(
        user: other_user, is_active: true,
        last_seen_at: Time.current, session_id: SecureRandom.uuid, muted: false
      )

      visit rooms_path
      expect(page).to have_css("[data-active-count]", text: "1")

      rp.update_column(:is_active, false)
      RoomParticipants::BroadcastPresenceChanges.call(room.reload)

      expect(page).to have_css("[data-active-count]", text: "0")
    end

    it "入室者がトピックを変更すると部屋一覧に反映される" do
      visit rooms_path
      expect(page).to have_css("[data-topic-text]", text: "今日の話題")

      room.update_column(:topic, "新しいトピック")
      AutoTopics::BroadcastTopic.call(room_id: room.id)

      expect(page).to have_css("[data-topic-text]", text: "新しいトピック")
    end
  end

  describe "入室・退出" do
    it "部屋をクリックすると入室できる" do
      visit rooms_path
      find("a[href='#{room_path(room)}']").click
      expect(page).to have_current_path(room_path(room))
    end

    it "入室後にトピックと参加中のメンバーが表示される" do
      visit room_path(room)
      expect(page).to have_css("[data-topic-text]", text: "今日の話題")
      expect(page).to have_text("参加中のメンバー")
    end

    it "退出ボタンで部屋一覧に戻れる" do
      visit room_path(room)
      click_link "退出"
      expect(page).to have_css("[data-page='rooms-index']", wait: 10)
    end
  end
end
