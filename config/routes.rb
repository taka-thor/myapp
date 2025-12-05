Rails.application.routes.draw do
  # WebSocket
  mount ActionCable.server => "/cable"

  root "static_pages#top"


  resources :users, only: %i[new create]
  resources :user_sessions, only: %i[create]
  resources :rtcs, only: %i[show]


  # ヘルスチェック
  get "/healthcheck", to: proc { [ 200, { "Content-Type"=>"text/plain" }, [ "ok" ] ] }
end
