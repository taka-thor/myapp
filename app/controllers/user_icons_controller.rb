class UserIconsController < ApplicationController
  skip_before_action :current_user, only: %i[new create]
  skip_before_action :require_login, only: %i[new create]

  def new
    @user = User.new
    @icons = Icons::GetUrlFromS3.call
  end

  def create
    name = session[:name] # 仮にニックネーム設定後、ブラウザから離脱するとセッションは残るが、ここで再度セッションを上書きするため問題なし

    icon_url = user_params[:icon_url] # user_paramsの素の状態は、ハッシュなので、その中の取得したい値を指定する必要がある。icon_urlの中身がハッシュにならないように。

    @user = User.new(name: name, icon_url: icon_url)

    if @user.save
      reset_session
      session[:user_info] = @user.id

      redirect_to static_pages_home_path
    else
      redirect_to root_path

    end
  end

  private
    def user_params
      params.require(:user).permit(:icon_url)
    end
end
