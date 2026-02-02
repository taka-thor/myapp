const setSpeaking = (userId, speaking) => {
  const el = document.querySelector(`[data-rtc-user-id="${userId}"]`);
  if (!el) return;
  el.classList.toggle("rtc-speaking", speaking);
};

export const startSpeakingFromStream = (ctx, peerUserId, stream, opts = {}) => {
  ctx._speakingAudio ||= new Map();
  if (ctx._speakingAudio.has(peerUserId)) return;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  const threshold = opts.threshold ?? 0.02;
  const holdMs = opts.holdMs ?? 450;

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
  let offTimer = null;
  let stopped = false;

  const stop = () => {
    stopped = true;
    if (rafId) cancelAnimationFrame(rafId);
    if (offTimer) clearTimeout(offTimer);

    setSpeaking(peerUserId, false);

    try { source.disconnect(); } catch {}
    try { analyser.disconnect(); } catch {}
    try { audioCtx.close(); } catch {}

    ctx._speakingAudio.delete(peerUserId);
  };

  ctx._speakingAudio.set(peerUserId, { stop });

  const tick = () => {
    if (stopped) return;

    analyser.getByteTimeDomainData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);

    if (rms > threshold) {
      setSpeaking(peerUserId, true);
      if (offTimer) clearTimeout(offTimer);
      offTimer = setTimeout(() => setSpeaking(peerUserId, false), holdMs);
    }

    rafId = requestAnimationFrame(tick);
  };

  tick();
};

export const stopSpeaking = (ctx, peerUserId) => {
  try { ctx._speakingAudio?.get(peerUserId)?.stop?.(); } catch {}
};
