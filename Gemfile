source "https://rubygems.org"

# Bundle edge Rails instead: gem "rails", github: "rails/rails", branch: "main"
gem "rails", "~> 7.2.2"

# The original asset pipeline for Rails [https://github.com/rails/sprockets-rails]
gem "sprockets-rails", "~> 3.5"

# Use Postgres (Neon) in production
gem "pg", "~> 1.6"

gem "psych", "< 5.3"

# Use the Puma web server [https://github.com/puma/puma]
gem "puma", "~> 6.4"

# Build JSON APIs with ease [https://github.com/rails/jbuilder]
gem "jbuilder", "~> 2.12"

gem "rails-i18n", "~> 7.0"

# Image processing
gem "mini_magick", "~> 4.13"

# Frontend
gem "jsbundling-rails", "~> 1.3"
gem "tailwindcss-rails", "~> 4.4"

gem "rqrcode", "~> 2.2"

gem "turbo-rails", "~> 2.0"
gem "redis", "~> 5.4.1"
# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem "tzinfo-data", platforms: %i[windows jruby]

# Reduces boot times through caching; required in config/boot.rb
gem "bootsnap", "~> 1.18", require: false

group :development, :test do
  gem "pry-rails"
  gem "pry-byebug"
  gem "byebug"
  gem "dotenv-rails"
  # Static analysis for security vulnerabilities [https://brakemanscanner.org/]
  gem "brakeman", require: false

  # Omakase Ruby styling [https://github.com/rails/rubocop-rails-omakase/]
  gem "rubocop-rails-omakase", require: false
end

group :development do
  # Use console on exceptions pages [https://github.com/rails/web-console]
  gem "web-console"
end
