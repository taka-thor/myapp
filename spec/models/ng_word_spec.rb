require "rails_helper"

RSpec.describe NgWord, type: :model do
  describe "def word_filter(text)" do
    it "正規化後に、いかなる値でも\"\"が返されているか" do
      expect(described_class.word_filter(nil)).to eq(""), "nil を渡した場合 '' が返るべき"
      expect(described_class.word_filter("")).to eq(""), "空文字を渡した場合 '' が返るべき"
    end

    it "unicode正規化・記号/空白/数字の削除・英字連続の圧縮が行われているか" do
      text = "ＡＡＡ!! カタカナー １２３"
      expect(described_class.word_filter(text)).to eq("aかたかな"), "入力: #{text} → 期待値: 'aかたかな'"
    end

    it "漢字を残しつつ記号・空白が削除されているか" do
      text = "口座番号 を!! 教えて"
      expect(described_class.word_filter(text)).to eq("口座番号を教えて"), "入力: #{text} → 期待値: '口座番号を教えて'"
    end
  end

  describe "def ng?(text)" do
    it "DBのNGワードがテキストに含まれる場合、trueが返されているか" do
      allow(described_class).to receive(:pluck).with(:word).and_return([ "口座番号" ])

      expect(described_class.ng?("口座番号を教えてください")).to be(true), "NGワードを含む発言は true を返すべき"
      expect(described_class.ng?("普通のメッセージです")).to be(false), "NGワードを含まない発言は false を返すべき"
    end

    it "テキストが空の場合、falseが返されているか" do
      expect(described_class.ng?(nil)).to be(false), "nil を渡した場合 false を返すべき"
      expect(described_class.ng?("")).to be(false), "空文字を渡した場合 false を返すべき"
    end

    it "NGワードと一致しない場合、falseが返されているか" do
      allow(described_class).to receive(:pluck).with(:word).and_return([ "だめ" ])

      expect(described_class.ng?("こんにちは")).to be(false), "'こんにちは' はNGワードを含まないため false を返すべき"
    end

    it "漢字のNGワードも一致するか" do
      allow(described_class).to receive(:pluck).with(:word).and_return([ "口座番号" ])

      expect(described_class.ng?("口座番号について話そう")).to be(true), "漢字のNGワードを含む場合も true を返すべき"
    end
  end

  describe "def conversation_ng?(text)" do
    before do
      allow(described_class).to receive(:pluck).with(:word).and_return([ "口座番号" ])
    end

    it "NGワードの開示を求める発言にtrueが返されているか" do
      expect(described_class.conversation_ng?("口座番号を教えてください")).to be(true), "開示要求を含む発言は true を返すべき"
    end

    it "NGワードの開示を命令する発言にtrueが返されているか" do
      expect(described_class.conversation_ng?("口座番号を教えろ")).to be(true), "開示命令を含む発言は true を返すべき"
    end

    it "否定された開示要求にfalseが返されているか" do
      expect(described_class.conversation_ng?("口座番号を教えないてください")).to be(false), "否定された開示要求は false を返すべき"
    end

    it "開示要求なくNGワードが言及された場合にfalseが返されているか" do
      expect(described_class.conversation_ng?("口座番号の管理は大事だね")).to be(false), "開示要求のない言及は false を返すべき"
    end
  end
end
