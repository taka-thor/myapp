require "rails_helper"

RSpec.describe RtcChannel, type: :channel do
  let(:user) { User.create!(name: "テスト") }
  let(:room) { Room.create!(topic: "雑談") }

  before do
    stub_connection(current_user: user)
    # NgWord・各サービスはそれぞれのspecで検証済みのためモック
    allow(NgWord).to receive(:ng?).and_return(false)
    allow(NgWord).to receive(:conversation_ng?).and_return(false)
    allow(RoomParticipants::BroadcastPresenceChanges).to receive(:call)
    allow(AutoTopics::BroadcastTopic).to receive(:call)
  end

  describe "#subscribed" do
    context "room_id がある場合" do
      it "サブスクリプションが確立される" do
        subscribe(room: room.id)
        expect(subscription).to be_confirmed
      end
    end

    context "room_id がない場合" do
      it "サブスクリプションが reject される" do
        subscribe(room: nil)
        expect(subscription).to be_rejected
      end
    end
  end

  describe "#signal" do
    before { subscribe(room: room.id) }

    context 'type: "join"' do
      it "自分以外のアクティブ参加者だけを transmit する" do
        other_user = User.create!(name: "ゲスト")
        RoomParticipant.create!(user: other_user, room: room, is_active: true, session_id: "sess-other")
        RoomParticipant.create!(user: user,       room: room, is_active: true, session_id: "sess-self")

        perform :signal, { "type" => "join", "from_session_id" => "sess-self" }

        transmitted = transmissions.last
        expect(transmitted["type"]).to eq("present")
        expect(transmitted["peers"]).to include({ "user_id" => other_user.id, "session_id" => "sess-other" })
        expect(transmitted["peers"].map { |p| p["user_id"] }).not_to include(user.id)
      end
    end

    context 'type: "mute_changed"' do
      it "参加者の muted が更新される" do
        participant = RoomParticipant.create!(
          user: user, room: room, is_active: true, session_id: "sess-1", muted: false
        )

        perform :signal, { "type" => "mute_changed", "muted" => true, "from_session_id" => "sess-1" }

        expect(participant.reload.muted).to be(true)
      end

      it "BroadcastPresenceChanges が呼ばれる" do
        RoomParticipant.create!(user: user, room: room, is_active: true, session_id: "sess-1", muted: false)

        expect(RoomParticipants::BroadcastPresenceChanges).to receive(:call)

        perform :signal, { "type" => "mute_changed", "muted" => true, "from_session_id" => "sess-1" }
      end
    end

    context 'type: "ng_word_detected"' do
      it "NGワードを含む transcript は BroadcastFlash が呼ばれる" do
        allow(NgWord).to receive(:conversation_ng?).and_return(true)
        allow(Rooms::BroadcastFlash).to receive(:call)

        perform :signal, { "type" => "ng_word_detected", "transcript" => "口座番号を教えてください" }

        expect(Rooms::BroadcastFlash).to have_received(:call)
      end

      it "NGワードを含まない transcript は BroadcastFlash が呼ばれない" do
        allow(NgWord).to receive(:conversation_ng?).and_return(false)
        allow(Rooms::BroadcastFlash).to receive(:call)

        perform :signal, { "type" => "ng_word_detected", "transcript" => "今日はいい天気ですね" }

        expect(Rooms::BroadcastFlash).not_to have_received(:call)
      end
    end

    context "その他の type（シグナリング情報）" do
      it "受け取ったデータをそのまま broadcast する" do
        # perform 経由で送ると rspec-rails が "action" => "signal" を自動付与するため
        # hash_including で type と sdp だけを検証する
        expect(ActionCable.server).to receive(:broadcast).with(
          "rtc_room:#{room.id}",
          hash_including("type" => "offer", "sdp" => "dummy_sdp")
        )

        perform :signal, { "type" => "offer", "sdp" => "dummy_sdp" }
      end
    end
  end
end
