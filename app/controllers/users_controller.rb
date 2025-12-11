class UsersController < ApplicationController
  def new
    @user = User.new
  end

  def create
    @user = User.new(user_params)
    if @user.valid?
      redirect_to users_update_path
    else
      render :new, status: :unprocessable_entity
    end
  end
end

private

def user_params
  params.require(:user).permit(:name, :avatar_url)
end
