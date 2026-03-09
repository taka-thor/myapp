class NgWordValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
      return if value.blank?

      if NgWord.ng?(value) # .ngは、valueがNgWordと一致するかを真偽値で返すクラスメソッド
        record.errors.add(
          attribute, :ng_word
        )
      end
  end
end
