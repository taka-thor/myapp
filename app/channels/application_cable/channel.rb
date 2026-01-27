module ApplicationCable
  class Channel < ActionCable::Channel::Base
    def current_user
      return @current_user if @current_user
      @current_user = User.find_by(id: session[:user_info])
    end
  end
end
