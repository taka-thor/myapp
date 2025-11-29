Rails.application.routes.draw do
  # WebSocket
  mount ActionCable.server => "/cable"

  root "static_pages#top"
  # root "users#new"

  resources :users,only: %i[new create]
  resources :rtcs, only: %i[show]

  # ヘルスチェック
  get "/healthcheck", to: proc { [ 200, { "Content-Type"=>"text/plain" }, [ "ok" ] ] }
end
