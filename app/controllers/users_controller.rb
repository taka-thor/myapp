class UsersController < ApplicationController
  def new; end

  def edit
    @user = current_user
    @icons = Icons::GetUrlFromS3.call
    redirect_to root_path and return if @user.blank?
  end

  def update
    @user = current_user
    @icons = Icons::GetUrlFromS3.call
    redirect_to root_path and return if @user.blank?

    @user.assign_attributes(user_params)

    if @user.save(context: :nickname_step)
      redirect_to edit_user_path, notice: "ユーザー情報を更新しました"
    else
      @user.restore_attributes([ :name ])
      render :edit, status: :unprocessable_entity
    end
  end

  private

  def user_params
    params.require(:user).permit(:name, :icon_url)
  end
end
