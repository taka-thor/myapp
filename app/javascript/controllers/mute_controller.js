import { Controller } from "@hotwired/stimulus";
import {
  getActiveMuteCtx,
  markForceTapToPlayOnReconnect,
  setLocalMuted,
  syncMuteUi,
  syncMuteVisibilityForLocalUser,
} from "../rtcs/mute_control";

export default class extends Controller {
  connect() {
    this.boundTurboRender = this.sync.bind(this);
    this.boundBeforeStreamRender = this.handleBeforeStreamRender.bind(this);

    document.addEventListener("turbo:render", this.boundTurboRender);
    document.addEventListener("turbo:before-stream-render", this.boundBeforeStreamRender);
    this.sync();
  }

  disconnect() {
    document.removeEventListener("turbo:render", this.boundTurboRender);
    document.removeEventListener("turbo:before-stream-render", this.boundBeforeStreamRender);
  }

  //ライフサイクルメソッドのほか、任意のメソッドを定義して、
  //data-action="click->mute#toggle"のように呼べる。
  //この場合のイベントオブジェクトは、クリック
  toggle(event) {
    event?.preventDefault?.();
    const ctx = getActiveMuteCtx();
    if (!ctx) return;
    setLocalMuted(ctx, !ctx.isMuted);
    this.sync();
  }

  markReconnect() {
    markForceTapToPlayOnReconnect();
  }

  handleBeforeStreamRender(event) {
    const originalRender = event.detail?.render;
    if (typeof originalRender !== "function") return;

    event.detail.render = (streamElement) => {
      originalRender(streamElement);
      this.sync();
    };
  }

  sync() {
    const ctx = getActiveMuteCtx();
    if (!ctx) return;

    syncMuteVisibilityForLocalUser(ctx);
    syncMuteUi(ctx);
  }
}
