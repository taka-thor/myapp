module QrcodesHelper
  require "chunky_png"

  def qrcode_tag(text, options = {})
      qr = ::RQRCode::QRCode.new(text)
      qr.as_svg().html_safe
  end
end
