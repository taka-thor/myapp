require "rails_helper"

RSpec.describe NgWordValidator, type: :model do
  before do
    stub_const("DummyNgRecord", Class.new do
      include ActiveModel::Model
      include ActiveModel::Validations

      attr_accessor :text
      validates :text, ng_word: true
    end)
  end

  it "adds ng_word error when NgWord.ng? returns true" do
    allow(NgWord).to receive(:ng?).with("危険ワード").and_return(true)

    record = DummyNgRecord.new(text: "危険ワード")
    expect(record).to be_invalid
    expect(record.errors.added?(:text, :ng_word)).to be(true)
  end

  it "does not add error when value is blank" do
    record = DummyNgRecord.new(text: "")
    expect(record).to be_valid
  end

  it "does not add ng_word error when NgWord.ng? returns false" do
    allow(NgWord).to receive(:ng?).with("セーフ").and_return(false)

    record = DummyNgRecord.new(text: "セーフ")
    expect(record).to be_valid
  end
end
