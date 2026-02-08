export const setSpeakingIndicator = (userId, speaking) => {
  const el = document.querySelector(`[data-rtc-user-id="${userId}"]`);
  if (!el) return;
  el.classList.toggle("rtc-speaking", speaking);
};

export const startSpeakingFromStream = (ctx, userId, stream, opts = {}) => {
  ctx._speakingAudio ||= new Map();
  if (ctx._speakingAudio.has(userId)) return;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  const tracks = stream?.getAudioTracks?.() ?? [];
  if (tracks.length === 0) return;

  const threshold = opts.threshold ?? 0.02;
  const holdMs = opts.holdMs ?? 450;
  const debug = opts.debug ?? false;
  const debugEveryMs = opts.debugEveryMs ?? 250;
  const isSuppressed = opts.isSuppressed;

  const audioCtx = new AudioCtx();
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }

  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);

  const data = new Uint8Array(analyser.fftSize);

  let rafId = null;
  let stopped = false;

  let isSpeaking = false;
  let lastAboveAt = 0;

  let lastDebugAt = 0;

  const stop = () => {
    stopped = true;
    if (rafId) cancelAnimationFrame(rafId);

    setSpeakingIndicator(userId, false);

    try { source.disconnect(); } catch {}
    try { analyser.disconnect(); } catch {}
    try { audioCtx.close(); } catch {}

    ctx._speakingAudio.delete(userId);
  };

  ctx._speakingAudio.set(userId, { stop });

  const tick = () => {
    if (stopped) return;

    analyser.getByteTimeDomainData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);

    if (debug) {
      const now = performance.now();
      if (now - lastDebugAt > debugEveryMs) {
        console.log("[speaking] rms", { userId, rms, threshold, audioState: audioCtx.state });
        lastDebugAt = now;
      }
    }

    const now = performance.now();

    if (typeof isSuppressed === "function" && isSuppressed()) {
      if (isSpeaking) {
        isSpeaking = false;
        setSpeakingIndicator(userId, false);
      }

      rafId = requestAnimationFrame(tick);
      return;
    }

    if (rms > threshold) {
      lastAboveAt = now;
      if (!isSpeaking) {
        isSpeaking = true;
        setSpeakingIndicator(userId, true);
      }
    } else {
      if (isSpeaking && now - lastAboveAt > holdMs) {
        isSpeaking = false;
        setSpeakingIndicator(userId, false);
      }
    }

    rafId = requestAnimationFrame(tick);
  };

  tick();
};

export const stopSpeaking = (ctx, userId) => {
  try { ctx._speakingAudio?.get(userId)?.stop?.(); } catch {}
};
