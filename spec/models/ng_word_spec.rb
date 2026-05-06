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

    it "keeps kanji while removing symbols and spaces" do
      text = "口座番号 を!! 教えて"
      expect(described_class.word_filter(text)).to eq("口座番号を教えて")
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

    it "matches kanji ng words too" do
      allow(described_class).to receive(:pluck).with(:word).and_return([ "口座番号" ])

      expect(described_class.ng?("口座番号について話そう")).to be(true)
    end
  end

  describe ".conversation_ng?" do
    before do
      allow(described_class).to receive(:pluck).with(:word).and_return([ "口座番号" ])
    end

    it "returns true when asking to disclose an ng word" do
      expect(described_class.conversation_ng?("口座番号を教えてください")).to be(true)
    end

    it "returns true when commanding to disclose an ng word" do
      expect(described_class.conversation_ng?("口座番号を教えろ")).to be(true)
    end

    it "returns false when the request is negated" do
      expect(described_class.conversation_ng?("口座番号を教えないてください")).to be(false)
    end

    it "returns false when the ng word is mentioned without a request context" do
      expect(described_class.conversation_ng?("口座番号の管理は大事だね")).to be(false)
    end
  end
end
