class NgWordValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    return if value.blank?

    checker = options[:contextual] ? :conversation_ng? : :ng?

    if NgWord.public_send(checker, value) # NgWordクラスのpablicメソッドを呼ぶ
      record.errors.add(
        attribute, :ng_word
      )
    end
  end
end
