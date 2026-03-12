require "simplecov"

SimpleCov.start do
  add_filter "/config/"
  add_filter "/db/"
  add_filter "/spec/"
  add_filter "/app/channels/"
  add_filter "/app/controllers/"
  add_filter "/app/javascript/"
  add_filter "/app/views/"
  add_filter "/app/jobs/"
  add_filter "/app/mailers/"

  minimum_coverage 80
end

RSpec.configure do |config|
  config.example_status_persistence_file_path = "tmp/rspec_examples.txt"
  config.disable_monkey_patching!
  config.order = :random
  Kernel.srand config.seed
end
