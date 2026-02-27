Rails.application.config.session_store :cookie_store,
  key: "_koetomo_session",
  expire_after: 90.days,
  httponly: true,                # JS から読ませない
  secure: Rails.env.production?, # HTTPS のときだけ送る
  same_site: :strict             # 他サイト経由でのリクエスト受け取らない
