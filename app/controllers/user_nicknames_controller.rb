class UserNicknamesController < ApplicationController
  skip_before_action :current_user, only: %i[new create]
  skip_before_action :require_login, only: %i[new create]

  def new
    user_name = session[:name]
    if user_name.present?
        @user = User.new(name: user_name)
    else
    @user = User.new
    end
  end

  def create
    @user = User.new(user_params)
    if @user.valid?(:nickname_step)
      session[:name] = @user.name
      redirect_to new_user_icons_path
    else
      render :new, status: :unprocessable_entity
    end
  end


private
  def user_params
    params.require(:user).permit(:name)
    # requireに渡すキーは、Railsがクラス名をsnake_caseにして、キーにする
    # クラス名＝クラスオブジェクト名＝クラスインスタンス名
  end
end
