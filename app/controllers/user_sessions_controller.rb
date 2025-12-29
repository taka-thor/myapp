class UserSessionsController < ApplicationController
  skip_before_action :current_user, only: %i[create]

  def create
      user_id = session[:user_info] # 読み取りだけ
      @user = User.find_by(id: user_id)
      if user_id.present?

        session[:user_info] = @user.id
        redirect_to static_pages_home_path

      else
      redirect_to new_user_nicknames_path
      end
  end
end
