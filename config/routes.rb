Rails.application.routes.draw do
  mount ActionCable.server => "/cable"

  root "static_pages#top"
  get "static_pages/home", to: "static_pages#home"
  get "active_users/index", to: "active_users#index"

  resources :users, only: %i[new create]
  resources :user_sessions, only: %i[create]
  resource :user_nicknames, only: %i[new create]
  resource :user_icons, only: %i[new create]
  resources :rtcs, only: %i[show]
  resources :rooms, only: %i[index show] do
    resource :presence, only: [] do
      post :ping
      post :leave
    end
  end



  # ヘルスチェック
  get "/healthcheck", to: proc { [ 200, { "Content-Type"=>"text/plain" }, [ "ok" ] ] }
end
