import { send } from "./send";

const recognitionCtor = () => window.SpeechRecognition || window.webkitSpeechRecognition;

const normalize = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/\s+/g, "");

const notifyRoomNgDetected = (ctx, transcript) => {
  send(ctx, "ng_word_detected", { transcript });
};

export const startLocalNgDetector = (ctx) => {
  console.info("[rtc:ng] startLocalNgDetector called");
  const SpeechRecognition = recognitionCtor();
  if (!SpeechRecognition) {
    console.warn("[rtc:ng] SpeechRecognition is not supported");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "ja-JP";
  recognition.continuous = true;
  recognition.interimResults = true;

  ctx.ngDetector = {
    recognition,
    active: true,
    visibleHandler: null,
    lastSentAt: 0,
    lastSentText: "",
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

  recognition.onresult = (event) => {
    let text = "";
    for (let i = 0; i < event.results.length; i += 1) {
      text += event.results[i][0]?.transcript || "";
    }
    const normText = normalize(text);
    if (!normText) return;
    if (!ctx.sub) return;

    const now = Date.now();
    if (now - ctx.ngDetector.lastSentAt < 1200) return;
    if (ctx.ngDetector.lastSentText === normText) return;
    ctx.ngDetector.lastSentAt = now;
    ctx.ngDetector.lastSentText = normText;
    console.info("[rtc:ng] sending ng_word_detected", { transcript: text, normalized: normText });
    notifyRoomNgDetected(ctx, text);
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

export const stopLocalNgDetector = (ctx) => {
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
