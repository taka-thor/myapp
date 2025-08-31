FROM ruby:3.2

# 必要パッケージ（NodeはRailsのJS実行用、SQLiteはDB用）
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends nodejs sqlite3 libsqlite3-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 先にGemfile系だけコピーしてbundleのキャッシュを効かせる
COPY Gemfile Gemfile.lock ./
RUN bundle install

# その後、アプリ本体をコピー
COPY . .

# Railsがlistenするポート
EXPOSE 3000

# 起動時にPIDファイルを掃除してからrails serverを起動
CMD ["bash", "-lc", "rm -f tmp/pids/server.pid && bundle exec rails s -p 3000 -b 0.0.0.0"]
