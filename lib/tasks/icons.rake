require "mini_magick"

namespace :icons do
  desc "app/icons_src の画像をリサイズ＆圧縮して tmp/icons_build に出力"
  task build: :environment do
    src_dir   = Rails.root.join("app/icons_src")
    dest_dir  = Rails.root.join("tmp/icons_build")

    FileUtils.mkdir_p(dest_dir)

    Dir.glob(src_dir.join("**/*.{png,jpg,jpeg}")).each do |path|
      rel_path = Pathname.new(path).relative_path_from(src_dir)
      out_path = dest_dir.join(rel_path).sub_ext(".jpg") # すべてjpgに統一したい場合

      FileUtils.mkdir_p(out_path.dirname)

      puts "Processing: #{rel_path}"

      image = MiniMagick::Image.open(path)

      image.combine_options do |i|
        i.resize "256x256^"
        i.gravity "center"
        i.extent "256x256"
        i.quality "80"
      end

      image.write(out_path.to_s)
    end

    puts "Done. Built icons into: #{dest_dir}"
  end
end
