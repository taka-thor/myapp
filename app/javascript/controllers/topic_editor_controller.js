import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["area", "input"]

  open() {
    this.areaTarget.classList.remove("hidden")
    this.inputTarget.focus()
    this.inputTarget.select()
  }

  cancel() {
    this.closeAndReset()
  }

  afterSubmit(event) {
    // turbo:submit-end の event.detail は { formSubmission, fetchResponse, ... }
    // 成功したときだけ閉じる（バリデーション失敗時は開いたままにできる）
    if (event.detail.success) {
      this.closeAndReset()
    }
  }

  closeAndReset() {
    this.areaTarget.classList.add("hidden")

    // 「次に変更押したらプレイスホルダーが見える」状態にしたいなら value を空にする
    this.inputTarget.value = ""

    // もし「前回の入力が残っててほしい」なら ↑ を消してOK
  }
}
