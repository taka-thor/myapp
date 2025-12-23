class UserIconsController < ApplicationController
  def new
    @user = User.new
    @icons = Icons::GetJsonFromS3.call
  end

  def create
    if @icon.save?
      redirect_to "static_pages_home_path"
    end
  end
end
