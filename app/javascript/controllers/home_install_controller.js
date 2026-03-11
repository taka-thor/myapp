import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["status", "iosSteps"];

  connect() {
    this.deferredPrompt = null;
    this.beforeInstallHandler = this.captureBeforeInstall.bind(this);
    this.appInstalledHandler = this.onAppInstalled.bind(this);

    window.addEventListener("beforeinstallprompt", this.beforeInstallHandler);
    window.addEventListener("appinstalled", this.appInstalledHandler);
  }

  disconnect() {
    window.removeEventListener("beforeinstallprompt", this.beforeInstallHandler);
    window.removeEventListener("appinstalled", this.appInstalledHandler);
  }

  async install() {
    if (!this.deferredPrompt) {
      if (this.hasStatusTarget) {
        this.statusTarget.textContent =
          "この端末では追加ダイアログを直接表示できません。ブラウザメニューからホーム画面に追加してください。";
      }
      return;
    }

    this.deferredPrompt.prompt();
    const choice = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;

    if (choice?.outcome === "accepted") {
      if (this.hasStatusTarget) {
        this.statusTarget.textContent = "ホーム画面に追加しました。";
      }
      return;
    }

    if (this.hasStatusTarget) {
      this.statusTarget.textContent = "ホーム画面追加はキャンセルされました。";
    }
  }

  toggleIosSteps() {
    if (!this.hasIosStepsTarget) return;
    this.iosStepsTarget.classList.toggle("hidden");
  }

  captureBeforeInstall(event) {
    event.preventDefault();
    this.deferredPrompt = event;
  }

  onAppInstalled() {
    this.deferredPrompt = null;
    if (this.hasStatusTarget) {
      this.statusTarget.textContent = "ホーム画面に追加しました。";
    }
  }
}
