FROM ruby:3.3.10

RUN apt-get update -qq \
&& apt-get install --no-install-recommends -y \
    build-essential libsqlite3-dev sqlite3 \
    nodejs npm tzdata git curl rsync \
    vim nano less \
&& rm -rf /var/lib/apt/lists/*


WORKDIR /app

ENV BUNDLE_PATH=/vendor/bundle \
    BUNDLE_BIN=/bundle/bin \
    BUNDLE_JOBS=4 \
    BUNDLE_RETRY=3
ENV PATH="$BUNDLE_BIN:$PATH"

COPY Gemfile Gemfile.lock ./
RUN bundle install

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN bundle exec bootsnap precompile app/ lib/ || true

RUN bash -lc 'rm -rf app/assets/builds/*'
RUN npm run build

RUN bash -lc 'rm -rf tmp/cache/assets/* && RAILS_ENV=production SECRET_KEY_BASE=dummy bundle exec rails assets:clobber && bundle exec rails assets:precompile'

EXPOSE 3000

CMD ["bash", "-lc", "rm -f tmp/pids/server.pid && bin/rails s -b 0.0.0.0 -p 3000"]
