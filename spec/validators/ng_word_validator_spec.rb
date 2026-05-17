require "rails_helper"

RSpec.describe NgWordValidator, type: :model do
  before do
    stub_const("DummyNgRecord", Class.new do
      include ActiveModel::Model
      include ActiveModel::Validations

      attr_accessor :text
      validates :text, ng_word: true
    end)

    stub_const("DummyContextualNgRecord", Class.new do
      include ActiveModel::Model
      include ActiveModel::Validations

      attr_accessor :text
      validates :text, ng_word: { contextual: true }
    end)
  end

  it "NgWord.ng?がtrueを返すとng_wordエラーが追加される" do
    allow(NgWord).to receive(:ng?).with("危険ワード").and_return(true)

    record = DummyNgRecord.new(text: "危険ワード")
    expect(record).to be_invalid
    expect(record.errors.added?(:text, :ng_word)).to be(true)
  end

  it "値が空の場合はエラーを追加しない" do
    record = DummyNgRecord.new(text: "")
    expect(record).to be_valid
  end

  it "NgWord.ng?がfalseを返すとng_wordエラーは追加されない" do
    allow(NgWord).to receive(:ng?).with("セーフ").and_return(false)

    record = DummyNgRecord.new(text: "セーフ")
    expect(record).to be_valid
  end

  it "contextualオプションが指定された場合はconversation_ng?で判定する" do
    allow(NgWord).to receive(:conversation_ng?).with("口座番号を教えてください").and_return(true)

    record = DummyContextualNgRecord.new(text: "口座番号を教えてください")
    expect(record).to be_invalid
    expect(record.errors.added?(:text, :ng_word)).to be(true)
  end
end
