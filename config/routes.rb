Rails.application.routes.draw do
  # WebSocket
  mount ActionCable.server => "/cable"

  root "static_pages#top"
  get "static_pages/home", to: "static_pages#home"

  resources :users, only: %i[new create]
  resources :user_sessions, only: %i[create]
  resources :rtcs, only: %i[show]


  # ヘルスチェック
  get "/healthcheck", to: proc { [ 200, { "Content-Type"=>"text/plain" }, [ "ok" ] ] }
end
