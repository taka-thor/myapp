require "rails_helper"

RSpec.describe Room, type: :model do
  describe "バリデーション" do
    it "topicとspeakingが正常な値の場合、バリデーションが通るか" do
      allow(NgWord).to receive(:ng?).and_return(false)
      allow(NgWord).to receive(:conversation_ng?).and_return(false)

      room = described_class.new(topic: "雑談しよう", speaking: "こんにちは")
      expect(room).to be_valid, "正常な値でバリデーションが通るべき"
    end

    it "topicが空の場合、バリデーションエラーになるか" do
      allow(NgWord).to receive(:ng?).and_return(false)
      allow(NgWord).to receive(:conversation_ng?).and_return(false)

      room = described_class.new(topic: "", speaking: "")
      expect(room).to be_invalid, "topicが空の場合はバリデーションエラーになるべき"
      expect(room.errors.added?(:topic, :blank)).to be(true), ":blank エラーが追加されるべき"
    end

    it "topicが12文字を超える場合、バリデーションエラーになるか" do
      allow(NgWord).to receive(:ng?).and_return(false)
      allow(NgWord).to receive(:conversation_ng?).and_return(false)

      room = described_class.new(topic: "あいうえおかきくけこさしす")
      expect(room).to be_invalid, "topicが12文字超の場合はバリデーションエラーになるべき"
      expect(room.errors.added?(:topic, :too_long, count: 12)).to be(true), ":too_long エラーが追加されるべき"
    end

    it "topicにNGワードが含まれる場合、ng_wordエラーが追加されるか" do
      allow(NgWord).to receive(:ng?) { |value| value == "NG語" }

      room = described_class.new(topic: "NG語")
      expect(room).to be_invalid, "NGワードを含むtopicはバリデーションエラーになるべき"
      expect(room.errors.added?(:topic, :ng_word)).to be(true), ":ng_word エラーが追加されるべき"
    end

    it "speakingにNGワードが含まれる場合、ng_wordエラーが追加されるか" do
      allow(NgWord).to receive(:ng?).and_return(false)
      allow(NgWord).to receive(:conversation_ng?) { |value| value == "危険" }

      room = described_class.new(topic: "正常", speaking: "危険")
      expect(room).to be_invalid, "NGワードを含むspeakingはバリデーションエラーになるべき"
      expect(room.errors.added?(:speaking, :ng_word)).to be(true), ":ng_word エラーが追加されるべき"
    end
  end
end
