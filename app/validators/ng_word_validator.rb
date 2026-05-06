class NgWordValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    return if value.blank?

    checker = options[:contextual] ? :conversation_ng? : :ng?

    if NgWord.public_send(checker, value) # 会話文だけは文脈込みで判定
      record.errors.add(
        attribute, :ng_word
      )
    end
  end
end
