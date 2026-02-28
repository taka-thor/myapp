class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern
  before_action :current_user
  before_action :require_login

  private

  def current_user
    return @current_user if defined?(@current_user)

    @current_user = User.find_by(id: session[:user_info])
  end

  def require_login
    return if @current_user.present?

    redirect_to root_path, alert: "「始める」からページを進めてください"
  end
end
