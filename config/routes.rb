Rails.application.routes.draw do
  # WebSocket
  mount ActionCable.server => "/cable"

  root "home#index"

  resources :rtc_tests, only: [ :show ]

  # ヘルスチェック
  get "/healthcheck", to: proc { [ 200, { "Content-Type"=>"text/plain" }, [ "ok" ] ] }
end
