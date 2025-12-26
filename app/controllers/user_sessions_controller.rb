class UserSessionsController < ApplicationController
  def create
      user_id = session[:id] # 読み取りだけ
      @user = User.find_by(id: user_id)
      if user_id.present?

        session[:user_id] = @user.id
        redirect_to static_pages_home_path

      else
      redirect_to new_user_nicknames_path
      end
  end
end
