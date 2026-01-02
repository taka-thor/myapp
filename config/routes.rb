Rails.application.routes.draw do
  resources :rooms
  # WebSocket
  mount ActionCable.server => "/cable"

  root "static_pages#top"
  get "static_pages/home", to: "static_pages#home"
  get "rooms_path", to: "rooms#index"

  resources :users, only: %i[new create]
  resources :user_sessions, only: %i[create]
  resource :user_nicknames, only: %i[new create]
  resource :user_icons, only: %i[new create]
  resources :rtcs, only: %i[show]
  resources :room, only: %i[index show]


  # ヘルスチェック
  get "/healthcheck", to: proc { [ 200, { "Content-Type"=>"text/plain" }, [ "ok" ] ] }
end
