class UserNicknamesController < ApplicationController
  def new
    user_nickname = session[:name]
    if user_nickname.present?
      @user = User.new(name: user_nickname)
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
