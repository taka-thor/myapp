# This file is used by Rack-based servers to start the application.

require_relative 'config/environment'

run Rails.application

Rails.application.routes.draw do
  get "rooms/:id", to: "rooms#show", as: :room
  mount ActionCable.server => "/cable"
end
