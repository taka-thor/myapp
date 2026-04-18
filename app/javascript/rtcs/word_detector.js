import { send } from "./send";

const recognitionCtor = () => window.SpeechRecognition || window.webkitSpeechRecognition;
// 一部のブラウザへの互換性を保つためにwindow.webkitSpeechRecognitionを記載
// windowオブジェクトに音声認識があるかどうか確認するための準備
const normalize = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/\s+/g, "");

const notifyRoomNgDetected = (ctx, transcript) => {
  send(ctx, "ng_word_detected", { transcript });
};

export const startWordDetector = (ctx) => {
  console.info("[rtc:ng] startWordDetector called");
  const SpeechRecognition = recognitionCtor();
  if (!SpeechRecognition) {
    console.warn("[rtc:ng] SpeechRecognition is not supported");
    return;
  }

  const recognition = new SpeechRecognition(); //音声認識のインスタンス作成
  recognition.lang = "ja-JP";
  // recognition.continuous = true;//音声認識の単発ではなく連続して行う設定
  recognition.interimResults = true;

  ctx.ngDetector = {
    recognition,
    active: true,
    visibleHandler: null,
    lastSentAt: 0,
    lastSentText: "",
    lastFinalTranscript: "",
    retryTimer: null,
  };

  const scheduleRetryStart = () => {
    if (!ctx.ngDetector?.active) return;
    if (ctx.ngDetector.retryTimer) clearTimeout(ctx.ngDetector.retryTimer);
    ctx.ngDetector.retryTimer = setTimeout(() => {
      ctx.ngDetector.retryTimer = null;
      startRecognition();
    }, 1500);
  };

  const startRecognition = () => {
    if (!ctx.ngDetector?.active) return;
    if (document.visibilityState !== "visible") return;
    try {
      console.info("[rtc:ng] recognition.start");
      recognition.start();
    } catch (e) {
      console.warn("[rtc:ng] recognition.start failed", e);
      scheduleRetryStart();
    }
  };

 //ブラウザの音声認識の結果が返ると、onresultが呼ばれる。そのときイベントオブジェクトが返される。
 //
  recognition.onresult = (event) => {
    const latestResult = event.results[event.results.length - 1];//一番最後の結果のみを取得
    if (!latestResult?.isFinal) return;

    const fullText = latestResult?.[0]?.transcript || "";
    if (!fullText) return;

    const previous = ctx.ngDetector.lastFinalTranscript || "";
    let text = fullText;
    if (previous && fullText.startsWith(previous)) {
      text = fullText.slice(previous.length).trim();
    }
    ctx.ngDetector.lastFinalTranscript = fullText;

    const normText = normalize(text);
    if (!normText) return;
    if (!ctx.sub) return;

    const now = Date.now();
    if (now - ctx.ngDetector.lastSentAt < 100) return;
    if (ctx.ngDetector.lastSentText === normText) return;
    ctx.ngDetector.lastSentAt = now;
    ctx.ngDetector.lastSentText = normText;
    console.info("[rtc:ng] sending ng_word_detected", { transcript: text, normalized: normText });
    notifyRoomNgDetected(ctx, text);
    recognition.stop();
  };

  recognition.onerror = (event) => {
    console.warn("[rtc:ng] recognition error", event?.error || event);
    scheduleRetryStart();
  };

  recognition.onend = () => {
    if (!ctx.ngDetector?.active) return;
    if (document.visibilityState !== "visible") return;
    startRecognition();
  };

  ctx.ngDetector.visibleHandler = () => {
    if (!ctx.ngDetector?.active) return;
    if (document.visibilityState !== "visible") return;
    startRecognition();
  };
  document.addEventListener("visibilitychange", ctx.ngDetector.visibleHandler);

  startRecognition();
};

export const stopWordDetector = (ctx) => {
  const detector = ctx.ngDetector;
  if (!detector) return;

  detector.active = false;
  if (detector.visibleHandler) {
    document.removeEventListener("visibilitychange", detector.visibleHandler);
  }
  if (detector.retryTimer) {
    clearTimeout(detector.retryTimer);
    detector.retryTimer = null;
  }

  try {
    detector.recognition?.stop?.();
  } catch {}

  ctx.ngDetector = null;
};
