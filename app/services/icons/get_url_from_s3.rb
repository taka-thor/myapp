# require "json"
# require "uri"
# require "http"

class Icons::GetUrlFromS3
  def self.call(url: ENV["ICONS_JSON_URL"])
    new(url).call
  end

  def initialize(url)
    @url = url
  end

  def call
    raise "画像ファイルのURLが存在しません" if @url.blank?
    raise "画像ファイルのURLが適切ではありません" if @url != ENV["ICONS_JSON_URL"]
    json = JSON.parse(Net::HTTP.get(URI.parse(@url)))
    Array(json["icons"]).map { |icon| icon["url"] }
  end
end
