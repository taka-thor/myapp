class NgWord < ApplicationRecord
  CLAUSE_SPLITTER = /(?<=。)|(?<=！)|(?<=？)|(?<=\n)|(?<=が)|(?<=けど)|(?<=けれど)/.freeze
  AFFIRMATIVE_DISCLOSURE_PATTERNS = [
    /教え(?:て(?:ください)?|てくれ|ろ|なさい|てよ)/,
    /言(?:って(?:ください)?|ってくれ|え|いなさい)/,
    /伝え(?:て(?:ください)?|てくれ|ろ|なさい)/,
    /送(?:って(?:ください)?|ってくれ|れ|りなさい)/,
    /見せ(?:て(?:ください)?|てくれ|ろ|なさい)/,
    /書(?:いて(?:ください)?|いてくれ|け|きなさい)/,
    /入力(?:して(?:ください)?|してくれ|しろ|しなさい)/
  ].freeze
  NEGATIVE_DISCLOSURE_PATTERNS = [
    /教え(?:ない(?:[でて](?:ください|下さい)?)?|ません|るな|てはいけません|てはだめ|ちゃだめ|なくていい)/,
    /言(?:わない(?:[でて](?:ください|下さい)?)?|いません|うな|ってはいけません|ってはだめ|わなくていい)/,
    /伝え(?:ない(?:[でて](?:ください|下さい)?)?|ません|るな|てはいけません|てはだめ|なくていい)/,
    /送(?:らない(?:[でて](?:ください|下さい)?)?|りません|るな|ってはいけません|ってはだめ|らなくていい)/,
    /見せ(?:ない(?:[でて](?:ください|下さい)?)?|ません|るな|てはいけません|てはだめ|なくていい)/,
    /書(?:かない(?:[でて](?:ください|下さい)?)?|きません|くな|いてはいけません|いてはだめ|かなくていい)/,
    /入力(?:しない(?:[でて](?:ください|下さい)?)?|しません|するな|してはいけません|してはだめ|しなくていい)/
  ].freeze

  before_validation :normalize_word

  validates :word, presence: true, uniqueness: true # before_validationで正規化されたself.wordが:wordに該当する
  validates :word, format: { with: /\A[a-zぁ-ん\p{Han}]+\z/ }

  # このネスト内のメソッド全てをクラスメソッドとして扱うよってこと。self.⚪︎⚪︎って書かなくてOK
  class << self
    def word_filter(text)
      return "" if text.blank?

      s = text.to_s.dup # dupメソッドで、元々のNgWordインスタンスの複製を作る。(非破壊)

      # 1) Unicode正規化（全角英数→半角など）
      s = s.unicode_normalize(:nfkc)

      # 2) 英字を小文字化
      s = s.downcase

      # 3) カタカナ → ひらがな
      s = s.tr("ァ-ン", "ぁ-ん")

      # 4) 記号・数字・空白をすべて削除
      s = s.gsub(/\d+/, "")             # 数字を削除
      s = s.gsub(/\s+/, "")             # 空白類を削除
      s = s.gsub(/[^a-zぁ-ん\p{Han}]+/, "") # 漢字は残しつつ、記号などを削除

      # 5) 英字の同じ文字連続を1文字に潰す
      s = s.gsub(/([a-z])\1+/, '\1')
    end
    # ?で終わるメソッドは、「真偽値」を確認。ng?メソッドをRoomモデルのカスタムバリデーションに入れて、エラーメッセージを出す設計
    def ng?(text)
      filtered_word = word_filter(text)
      return false if filtered_word.blank?

      matched_ng_words(filtered_word).any?
    end

    def conversation_ng?(text)
      return false if text.blank?

      ng_db_words = NgWord.pluck(:word).reject(&:blank?)
      return false if ng_db_words.empty?

      # 節ごとに分割して検査することで、NGワードと開示要求が同一節内にある場合のみ検知する
      split_into_clauses(text).any? do |clause|
        filtered = word_filter(clause)
        next false if filtered.blank?

        matched = ng_db_words.select { |w| filtered.include?(w) }
        next false if matched.empty?

        matched.any? { |w| disclosure_request_for?(filtered, w) }
      end
    end

    private

    def split_into_clauses(text)
      text.split(CLAUSE_SPLITTER).map(&:strip).reject(&:blank?)
    end

    def matched_ng_words(filtered_word)
      NgWord.pluck(:word).filter_map do |db_word| # filter_mapメソッドはmapと違い、nilやfalseを中身に含めない
        next if db_word.blank? # blankあればtrueで次の配列の中身を査定
        db_word if filtered_word.include?(db_word)
      end
    end

    def disclosure_request_for?(filtered_clause, matched_word)
      return false if negative_disclosure?(filtered_clause)
      affirmative_disclosure?(filtered_clause) || direct_disclosure_request?(filtered_clause, matched_word)
    end

    def negative_disclosure?(segment)
      NEGATIVE_DISCLOSURE_PATTERNS.any? { |pattern| pattern.match?(segment) }
    end

    def affirmative_disclosure?(segment)
      AFFIRMATIVE_DISCLOSURE_PATTERNS.any? { |pattern| pattern.match?(segment) }
    end

    def direct_disclosure_request?(segment, matched_word)
      escaped_word = Regexp.escape(matched_word)
      /(?:#{escaped_word})(?:を|は|も)?(?:ください|下さい|ちょうだい|頂戴|くれ)/.match?(segment)
    end
  end

  private
  # create用
  def normalize_word
    self.word = NgWord.word_filter(word)
  end
end
