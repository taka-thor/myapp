import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static values = {
    timeout: { type: Number, default: 5000 },
  };

  connect() {
    this.timeoutId = window.setTimeout(() => {
      this.element.remove();
    }, this.timeoutValue);
  }

  disconnect() {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
