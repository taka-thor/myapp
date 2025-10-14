Rails.application.routes.draw do
  # WebSocket
  mount ActionCable.server => "/cable"

  # 画面（id不要の固定ページにする）
  root "rtc_tests#show"
  resource :rtc_test, only: [ :show ]   # => /rtc_test
  # 古い /rtc_tests/show へ来たら 301 で /rtc_test に寄せる
  get "/rtc_tests/show", to: redirect("/rtc_test", status: 301)

  # 互換で /rtc_tests/show を残したいなら↓も追加
  # get "/rtc_tests/show", to: "rtc_tests#show"

  # ヘルスチェック
  get "/healthcheck", to: proc { [ 200, { "Content-Type"=>"text/plain" }, [ "ok" ] ] }
end
