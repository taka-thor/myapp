Rails.application.routes.draw do
  mount ActionCable.server => "/cable"

  root "static_pages#top"
  get "static_pages/home", to: "static_pages#home"
  get "qrcodes/index", to: "qrcodes#index"
  get "user_info", to: "users#edit", as: :user_info
  get "terms", to: "static_pages#terms"
  get "privacy_policy", to: "static_pages#privacy_policy"
  get "contact", to: "static_pages#contact"
  # get "test", to: "tests#test"
  get "how_to_talk", to: "static_pages#how_to_talk", as: :how_to_talk

  resources :users, only: %i[new create]
  resource :user, only: %i[edit update]
  resources :user_sessions, only: %i[create]
  resource :user_nicknames, only: %i[new create]
  resource :user_icons, only: %i[new create]
  resources :rtcs, only: %i[show]
  resources :rooms, only: %i[index show update] do
    resource :presence, only: [] do
      post :ping
      post :leave
    end
    resource :topic, only: %i[ update ]
  end

  get "/healthcheck", to: proc { [ 200, { "Content-Type"=>"text/plain" }, [ "ok" ] ] }
end
