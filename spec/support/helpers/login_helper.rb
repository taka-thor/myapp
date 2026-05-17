module LoginHelper
  def register_and_login(icon_url:)
    visit new_user_nicknames_path
    fill_in "user[name]", with: "たろう"
    click_button "決定"
    expect(page).to have_css("[data-controller='user-icon']")
    page.execute_script(<<~JS)
      document.querySelector('[data-user-icon-target="input"]').value = '#{icon_url}';
      document.querySelector('#icon-form').requestSubmit();
    JS
    expect(page).to have_text("ユーザー登録が完了しました")
  end
end
