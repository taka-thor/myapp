require "rails_helper"

RSpec.describe "ユーザー登録フロー", type: :system do
  let(:icon_url) { "https://example.com/icon.png" }

  before do
    driven_by :rack_test
    allow(Icons::GetUrlFromS3).to receive(:call).and_return([ icon_url ])
  end

  it "ニックネームとアイコンを選択して登録完了する" do
    visit new_user_nicknames_path

    fill_in "user[name]", with: "たろう"
    click_button "決定"

    expect(page).to have_current_path(new_user_icons_path)

    find('[name="user[icon_url]"]', visible: :all).set(icon_url)
    click_button "決定"

    expect(page).to have_text("ユーザー登録が完了しました")
  end

  it "ニックネームが空のまま送信するとエラーが表示される" do
    visit new_user_nicknames_path
    click_button "決定"

    expect(page).to have_text("ニックネームを入力してください")
  end

  it "NGワードを含むニックネームを入力するとエラーが表示される" do
    NgWord.create!(word: "だめ")

    visit new_user_nicknames_path
    fill_in "user[name]", with: "だめ"
    click_button "決定"

    expect(page).to have_text("ニックネームに不適切な表現が含まれています")
  end
end
