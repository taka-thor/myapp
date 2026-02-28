import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["option", "input", "submit", "form"];

  connect() {
    this.boundOptionClick = this.onOptionClick.bind(this);
    this.optionTargets.forEach((option) => {
      option.addEventListener("click", this.boundOptionClick);
    });
  }

  disconnect() {
    this.optionTargets.forEach((option) => {
      option.removeEventListener("click", this.boundOptionClick);
    });
  }

  onOptionClick(event) {
    const selected = event.currentTarget;
    this.optionTargets.forEach((option) => {
      option.classList.remove("ring-4", "ring-sky-400");
    });

    selected.classList.add("ring-4", "ring-sky-400");
    this.inputTarget.value = selected.dataset.iconId || "";

    this.submitTarget.classList.remove(
      "opacity-0",
      "translate-y-4",
      "pointer-events-none"
    );
    this.formTarget.classList.remove("pointer-events-none");
  }
}
