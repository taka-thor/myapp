class StaticPagesController < ApplicationController
  skip_before_action :current_user, only: %i[top]
  skip_before_action :require_login, only: %i[top]

  def top; end
  def home; end
  def user_info; end
  def terms; end
  def privacy_policy; end
  def contact; end
end
