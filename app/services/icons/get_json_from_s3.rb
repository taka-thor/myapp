require "json"
require "url"
require "http"

class GetJsonFromS3
  def self.call(url: ENV["ICONS_JSON_URL"])
    new(url).check
  end

  def initialize(url)
    @url = url
  end

  def check
    raise "画像ファイルのURLが存在しません" if @url.blank?
    raise "画像ファイルのURLが適切ではありません" if @url != ENV["ICONS_JSON_URL"]
    JSON.parse(Net::HTTP.get(URI.parse(@url)))
  end
end
