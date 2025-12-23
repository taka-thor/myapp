# lib/tasks/icons.rake
require "mini_magick"

namespace :icons do
  desc "app/icons_src の画像を正方形にリサイズして連番で tmp/icons_build に出力"
  task build: :environment do
    src_dir  = Rails.root.join("app/icons_src")
    dest_dir = Rails.root.join("tmp/icons_build")

    FileUtils.rm_rf(dest_dir) # 一旦まるごと消す（上書き事故防止）
    FileUtils.mkdir_p(dest_dir)

    # png / jpg / jpeg / svg を全部対象
    paths = Dir.glob(src_dir.join("**/*.{png,jpg,jpeg,svg}"), File::FNM_CASEFOLD).sort

    if paths.empty?
      puts "画像が見つかりませんでした: #{src_dir}"
      next
    end

    puts "変換開始: #{paths.size} ファイル"

    paths.each_with_index do |path, idx|
      rel_path = Pathname.new(path).relative_path_from(src_dir)
      ext      = File.extname(path).downcase

      begin
        image = MiniMagick::Image.open(path) # SVG もここでラスタライズされる想定

        # 正方形 + 中央トリミング（円に入れてもバランス良く見えるように）
        image.combine_options do |i|
          i.resize  "256x256^"   # 短い辺が256になるよう拡大縮小（はみ出しOK）
          i.gravity "center"     # 中央基準
          i.extent  "256x256"    # 256x256 で切り抜き
          i.quality "80"         # 圧縮率（JPG時）
        end

        # 出力は連番ファイル名に統一
        num      = (idx + 1).to_s.rjust(3, "0") # 001, 002, 003…
        out_name = "user_icon#{num}.jpg"        # ここを .png にしてもOK
        out_path = dest_dir.join(out_name)

        image.format "jpg" # ← PNG にしたいなら "png"

        image.write(out_path.to_s)

        puts "Processed: #{rel_path} => #{out_name}"
      rescue => e
        puts "エラー: #{rel_path} - #{e.class}: #{e.message}"
      end
    end

    puts "Done. Built icons into: #{dest_dir}"
  end
end
