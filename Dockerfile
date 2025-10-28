#slimはサイズが小さく、ビルドが早い
FROM ruby:3.2.3-slim
#このDocker fileは、バージョン指定されたRubyのコンテナの中にパッケージとして、sqlite3やnode.jsをインストールしている。
#また、Railsは、Gemfileに記載されているので、bundle installでインストールしている。

# 必要なパッケージをインストール
RUN apt-get update -qq \
&& apt-get install --no-install-recommends -y \
    build-essential libsqlite3-dev sqlite3 \
    nodejs npm tzdata git curl \
&& rm -rf /var/lib/apt/lists/*


#作業ディレクトリ（"コンテナ内の"カレントディレクトリ）を指定(名前はなんでもOK)　
#これ以降の相対パスの基準（カレントディレクトリ）はコンテナ内の/appになる。 cd myapp = /app/myappに移動ってこと
#このコンテナの中にDBなどが作られるので、ホスト側と分離される。
#compose側でnamed volumeやbind mountを指定して、データを永続化する作業が必要。

WORKDIR /app

#コンテナ内の/appにGemfileとGemfile.lockをコピーする。
ENV BUNDLE_PATH=/bundle \
    BUNDLE_BIN=/bundle/bin \
    BUNDLE_JOBS=4 \
    BUNDLE_RETRY=3
ENV PATH="$BUNDLE_BIN:$PATH"

#2つのファイルをコンテナのカレント（/app）へコピー。
COPY Gemfile Gemfile.lock ./
RUN bundle install

# JS依存（esbuild等）をインストール
COPY package.json package-lock.json ./
RUN npm ci

#COPY . /appと同じ意味　
#COPY . . はホスト側のカレントディレクトリ（docker-compose.ymlがあるディレクトリ[1つ目の.]）を
#コンテナ内のカレントディレクトリ（/app）[2つ目の.]にコピー
COPY . .

# 任意（速くなる）
RUN bundle exec bootsnap precompile app/ lib/ || true

# JSビルド（application.js → app/assets/builds/* を生成）
RUN npm run build

# ビルド時にアセットを生成（本番用）
RUN bash -lc 'RAILS_ENV=production SECRET_KEY_BASE=dummy bundle exec rails assets:clobber && bundle exec rails assets:precompile'

# コンテナはポート3000番を解放
EXPOSE 3000

# server.pid を消してから起動（再起動安定化）
CMD ["bash", "-lc", "rm -f tmp/pids/server.pid && bin/rails s -b 0.0.0.0 -p 3000"]
