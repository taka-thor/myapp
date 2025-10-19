FROM ruby:3.2.3-slim

RUN apt-get update -qq \
  && apt-get install --no-install-recommends -y \
     build-essential libsqlite3-dev sqlite3 \
     nodejs tzdata git curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV BUNDLE_PATH=/bundle \
    BUNDLE_BIN=/bundle/bin \
    BUNDLE_JOBS=4 \
    BUNDLE_RETRY=3
ENV PATH="$BUNDLE_BIN:$PATH"

COPY Gemfile Gemfile.lock ./
RUN bundle install

COPY . .

# 任意（速くなる）
RUN bundle exec bootsnap precompile app/ lib/ || true

EXPOSE 3000

# ★ server.pid を消してから起動（再起動安定化）
CMD ["bash", "-lc", "rm -f tmp/pids/server.pid && bin/rails s -b 0.0.0.0 -p 3000"]
