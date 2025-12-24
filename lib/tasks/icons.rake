require "mini_magick"

namespace :icons do
  desc "app/icons_src の画像をリサイズ＆圧縮して tmp/icons_build に出力"
  task build: :environment do
    src_dir  = Rails.root.join("app/icons_src")
    dest_dir = Rails.root.join("tmp/icons_build")

    # いったんビルド先を掃除しておくと古いファイルが残らない
    FileUtils.rm_rf(dest_dir)
    FileUtils.mkdir_p(dest_dir)

    Dir.glob(src_dir.join("**/*.{png,jpg,jpeg,svg}"), File::FNM_CASEFOLD).each do |path|
      rel_path = Pathname.new(path).relative_path_from(src_dir)
      ext      = File.extname(path).downcase

      if ext == ".svg"
        # ✅ SVGはそのままコピー（拡張子も中身も変えない）
        out_path = dest_dir.join(rel_path)
        FileUtils.mkdir_p(out_path.dirname)
        puts "Copy SVG as-is: #{rel_path}"
        FileUtils.cp(path, out_path)
      else
        # ✅ それ以外はこれまで通り JPG に変換
        out_path = dest_dir.join(rel_path).sub_ext(".jpg")
        FileUtils.mkdir_p(out_path.dirname)
        puts "Processing raster image: #{rel_path}"

        image = MiniMagick::Image.open(path)

        image.combine_options do |i|
          i.resize  "256x256^"
          i.gravity "center"
          i.extent  "256x256"
          i.quality "80"
        end

        image.write(out_path.to_s)
      end
    end

    puts "Done. Built icons into: #{dest_dir}"
  end
end
