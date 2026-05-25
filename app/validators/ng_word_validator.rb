class NgWordValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    return if value.blank?

    checker = options[:contextual] ? :conversation_ng? : :ng?

    if NgWord.public_send(checker, value) # publicメソッドは第一引数にメソッドを渡せるため、checkerで条件分岐されたメソッドをフレキシブルに渡せる。
      record.errors.add(
        attribute, :ng_word
      )
    end
  end
end
