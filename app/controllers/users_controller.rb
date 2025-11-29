class UsersController < ApplicationController
  def new
    @user = User.new;end

  def create
    # 既存ユーザーであれば、redirect to home
  end
end




# toppageから次へを押すと、新規ユーザーか既存ユーザーかを条件分岐
