class StaticPagesController < ApplicationController
  skip_before_action :current_user, only: %i[top]

  def top;end
  def home;end
end
