class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern
  before_action :current_user

  private
  def current_user
  return @current_user if @current_user

  @current_user = User.find_by(id: session[:user_info])
  end
end
