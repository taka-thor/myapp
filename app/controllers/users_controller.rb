class UsersController < ApplicationController
  def new; end

  def edit
    @user = current_user
    @icons = Icons::GetUrlFromS3.call
  end

  def update
    @user = current_user
    @icons = Icons::GetUrlFromS3.call

    # 保存せずメモリ上でformオブジェクトを更新
    @user.assign_attributes(user_params) # バリデーションエラー時に、入力欄に値を保持させるため

    if @user.save(context: :nickname_step)
      redirect_to edit_user_path, notice: "ユーザー情報を更新しました" # flashオブジェクト{"type" => "中身"}を一時的にセッションへ保管。
    else
      @user.restore_attributes([ :name ])
      render :edit, status: :unprocessable_entity, alert: "エンジニアっていいよね"
    end
  end

  private

  def user_params
    params.require(:user).permit(:name, :icon_url)
  end
end
