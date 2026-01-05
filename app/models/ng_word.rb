class NgWord < ApplicationRecord
  validates :word, presence: true, uniqueness: true
  # このネスト内のメソッド全てをクラスメソッドとして扱うよってこと。self.⚪︎⚪︎って書かなくてOK
  class << self
    def word_filter(text)
      return "" if text.blank?

      s = text.to_s.dup

      # 1) Unicode正規化（全角英数→半角など）
      s = s.unicode_normalize(:nfkc)

      # 2) 英字を小文字化
      s = s.downcase

      # 3) カタカナ → ひらがな
      s = s.tr("ァ-ン", "ぁ-ん")

      # 4) 記号・数字・空白をすべて削除
      s = s.gsub(/\d+/, "")             # 数字を削除
      s = s.gsub(/\s+/, "")             # 空白類を削除
      s = s.gsub(/[^a-zぁ-ん]+/, "")    # 上記以外の記号などを削除

      # 5) 英字の同じ文字連続を1文字に潰す
      s = s.gsub(/([a-z])\1+/, '\1')

      s
    end
    # ?で終わるメソッドは、「真偽値」を確認。ng?メソッドをRoomモデルのカスタムバリデーションに入れて、エラーメッセージを出す設計
    def ng?(text)
      filtered_word = word_filter(text)
      return false if filtered_word.blank?

      NgWord.pluck(:word).any? do |db_word|
        filtered_db_word = word_filter(db_word)
        filtered_word.include?(filtered_db_word)
      end
    end
  end
end
