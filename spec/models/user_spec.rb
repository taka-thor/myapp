require "rails_helper"

RSpec.describe User, type: :model do
  describe "バリデーション" do
    context ":nickname_step コンテキスト" do
      before { allow(NgWord).to receive(:ng?).and_return(false) }

      it "正常な値でバリデーションが通るか" do
        user = described_class.new(name: "さくら")
        expect(user).to be_valid(:nickname_step), "正常な名前でバリデーションが通るべき"
      end

      it "nameが空の場合、バリデーションエラーになるか" do
        user = described_class.new(name: "")
        expect(user).to be_invalid(:nickname_step), "nameが空の場合はバリデーションエラーになるべき"
        expect(user.errors.added?(:name, :blank)).to be(true), ":blank エラーが追加されるべき"
      end

      it "nameが11文字以上の場合、バリデーションエラーになるか" do
        user = described_class.new(name: "あ" * 11)
        expect(user).to be_invalid(:nickname_step), "nameが10文字超の場合はバリデーションエラーになるべき"
        expect(user.errors.added?(:name, :too_long, count: 10)).to be(true), ":too_long エラーが追加されるべき"
      end

      it "nameに使用できない文字が含まれる場合、バリデーションエラーになるか" do
        user = described_class.new(name: "田中太郎")
        expect(user).to be_invalid(:nickname_step), "漢字を含む名前はバリデーションエラーになるべき"
        # Rails 7.2のadded?はstrict_match?を使うため、:on等のoptionが完全一致しないとfalseになる。whereで代替
        expect(user.errors.where(:name, :invalid).any?).to be(true), ":invalid エラーが追加されるべき"
      end

      it "nameが重複している場合、バリデーションエラーになるか" do
        described_class.create!(name: "たろう")
        user = described_class.new(name: "たろう")
        expect(user).to be_invalid(:nickname_step), "重複した名前はバリデーションエラーになるべき"
        # Rails 7.2のadded?はstrict_match?を使うため、:on等のoptionが完全一致しないとfalseになる。whereで代替
        expect(user.errors.where(:name, :taken).any?).to be(true), ":taken エラーが追加されるべき"
      end

      it "nameにNGワードが含まれる場合、バリデーションエラーになるか" do
        allow(NgWord).to receive(:ng?).and_return(true)
        user = described_class.new(name: "NGワード名")
        expect(user).to be_invalid(:nickname_step), "NGワードを含む名前はバリデーションエラーになるべき"
        expect(user.errors.added?(:name, :ng_word)).to be(true), ":ng_word エラーが追加されるべき"
      end
    end
  end
end
