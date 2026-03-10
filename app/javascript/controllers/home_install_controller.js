import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = [
    "androidPanel",
    "iosPanel",
    "installedPanel",
    "status",
    "iosSteps",
  ];

  connect() {
    this.deferredPrompt = null;
    this.beforeInstallHandler = this.captureBeforeInstall.bind(this);
    this.appInstalledHandler = this.onAppInstalled.bind(this);

    window.addEventListener("beforeinstallprompt", this.beforeInstallHandler);
    window.addEventListener("appinstalled", this.appInstalledHandler);
    this.renderByPlatform();
  }

  disconnect() {
    window.removeEventListener("beforeinstallprompt", this.beforeInstallHandler);
    window.removeEventListener("appinstalled", this.appInstalledHandler);
  }

  async install() {
    if (!this.deferredPrompt) {
      // 既に追加済み、またはブラウザ都合でプロンプト不可の場合のフォールバック。
      // 要望に合わせ、押下後は追加済み表示へ切り替える。
      this.showInstalledPanel();
      if (this.hasStatusTarget) {
        this.statusTarget.textContent =
          "ホーム画面に追加済みの可能性があります。";
      }
      return;
    }

    this.deferredPrompt.prompt();
    const choice = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;

    if (choice?.outcome === "accepted") {
      this.showInstalledPanel();
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
    this.showAndroidPanel();
  }

  onAppInstalled() {
    this.deferredPrompt = null;
    this.showInstalledPanel();
  }

  renderByPlatform() {
    if (this.isStandalone()) {
      this.showInstalledPanel();
      return;
    }

    if (this.isIos()) {
      this.showIosPanel();
      return;
    }

    this.showAndroidPanel();
  }

  showAndroidPanel() {
    this.hideAll();
    if (this.hasAndroidPanelTarget) this.androidPanelTarget.classList.remove("hidden");
  }

  showIosPanel() {
    this.hideAll();
    if (this.hasIosPanelTarget) this.iosPanelTarget.classList.remove("hidden");
  }

  showInstalledPanel() {
    this.hideAll();
    if (this.hasInstalledPanelTarget) this.installedPanelTarget.classList.remove("hidden");
  }

  hideAll() {
    if (this.hasAndroidPanelTarget) this.androidPanelTarget.classList.add("hidden");
    if (this.hasIosPanelTarget) this.iosPanelTarget.classList.add("hidden");
    if (this.hasInstalledPanelTarget) this.installedPanelTarget.classList.add("hidden");
  }

  isStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  isIos() {
    const ua = window.navigator.userAgent || "";
    return /iPhone|iPad|iPod/.test(ua);
  }
}
