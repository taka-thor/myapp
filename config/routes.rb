Rails.application.routes.draw do
  # WebSocket
  mount ActionCable.server => "/cable"

  root "tops#index"
  # root "users#new"

  resources :rtc_tests, only: [ :show ]

  # ヘルスチェック
  get "/healthcheck", to: proc { [ 200, { "Content-Type"=>"text/plain" }, [ "ok" ] ] }
end
