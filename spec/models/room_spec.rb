require "rails_helper"

RSpec.describe Room, type: :model do
  describe "validations" do
    it "is valid with normal topic and speaking" do
      allow(NgWord).to receive(:ng?).and_return(false)

      room = described_class.new(topic: "雑談しよう", speaking: "こんにちは")
      expect(room).to be_valid
    end

    it "is invalid when topic is blank" do
      allow(NgWord).to receive(:ng?).and_return(false)

      room = described_class.new(topic: "", speaking: "")
      expect(room).to be_invalid
      expect(room.errors.added?(:topic, :blank)).to be(true)
    end

    it "is invalid when topic is longer than 12 chars" do
      allow(NgWord).to receive(:ng?).and_return(false)

      room = described_class.new(topic: "あいうえおかきくけこさしす")
      expect(room).to be_invalid
      expect(room.errors.added?(:topic, :too_long, count: 12)).to be(true)
    end

    it "adds ng_word error on topic when topic includes ng word" do
      allow(NgWord).to receive(:ng?) { |value| value == "NG語" }

      room = described_class.new(topic: "NG語")
      expect(room).to be_invalid
      expect(room.errors.added?(:topic, :ng_word)).to be(true)
    end

    it "adds ng_word error on speaking when speaking includes ng word" do
      allow(NgWord).to receive(:ng?) { |value| value == "危険" }

      room = described_class.new(topic: "正常", speaking: "危険")
      expect(room).to be_invalid
      expect(room.errors.added?(:speaking, :ng_word)).to be(true)
    end
  end
end
