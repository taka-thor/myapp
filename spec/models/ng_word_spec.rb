require "rails_helper"

RSpec.describe NgWord, type: :model do
  describe ".word_filter" do
    it "returns empty string for blank input" do
      expect(described_class.word_filter(nil)).to eq("")
      expect(described_class.word_filter("")).to eq("")
    end

    it "normalizes unicode, removes spaces/symbols/digits and squeezes repeated ascii letters" do
      text = "ＡＡＡ!! カタカナー １２３"
      expect(described_class.word_filter(text)).to eq("aかたかな")
    end
  end

  describe ".ng?" do
    it "returns true when filtered text includes an ng word from DB" do
      allow(described_class).to receive(:pluck).with(:word).and_return([ "ちんこ" ])

      expect(described_class.ng?("これは ちんこ です！")).to be(true)
    end

    it "returns false when text is blank" do
      expect(described_class.ng?(nil)).to be(false)
      expect(described_class.ng?("")).to be(false)
    end

    it "returns false when there is no ng word match" do
      allow(described_class).to receive(:pluck).with(:word).and_return([ "だめ" ])

      expect(described_class.ng?("こんにちは")).to be(false)
    end
  end
end
