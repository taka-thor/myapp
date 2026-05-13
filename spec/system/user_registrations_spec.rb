require "rails_helper"

RSpec.describe "ユーザー登録フロー", type: :system do
  let(:icon_url) { "https://example.com/icon.png" }

  before do
    driven_by :selenium_chrome_headless
    allow(Icons::GetUrlFromS3).to receive(:call).and_return([ icon_url ])
  end

  it "ニックネームとアイコンを選択して登録完了する" do
    visit new_user_nicknames_path

    fill_in "user[name]", with: "たろう"
    click_button "決定"

    expect(page).to have_current_path(new_user_icons_path)
    expect(page).to have_css("[data-controller='user-icon']")

    # アイコン選択: hidden inputに値をセットしsubmitボタンを表示する
    # SeleniumとStimulusのクリックイベントの互換性問題を回避するためDOMを直接操作
    page.execute_script(<<~JS)
      document.querySelector('[data-user-icon-target="input"]').value = '#{icon_url}';
      document.querySelector('[data-user-icon-target="submit"]').classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
      document.querySelector('[data-user-icon-target="form"]').classList.remove('pointer-events-none');
    JS

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
