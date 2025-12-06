class UserSessionsController < ApplicationController
  def create
      uuid = cookies.encrypted[:user_uuid]
      @user = User.find_by(user_uuid: uuid) if uuid.present?
      # if uuid.present? && (@user = User.find_by(user_uuid: uuid))と同じ

      if @user
        session[:user_id] = @user.id
        redirect_to static_pages_home_path

      else
      redirect_to new_user_path

      end
  end
end
