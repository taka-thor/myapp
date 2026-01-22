class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern
  before_action :current_user

  private
  def current_user
      return @current_user if defined?(@current_user) # returnは呼び出し元に値を渡して、returnと書いた部分以降の処理を終了する。definedは「定義されている」

      @current_user = User.find_by(id: session[:user_info]) # このsession[:user_info]が最新になってないと、ヘッダに反映されない。編集でもsession[:user_info]を更新する処理を入れる
  end
end
