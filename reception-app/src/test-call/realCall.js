// The real test call (founder 2026-10-05): Thử Bonia talks to the same receptionist as the phone line, on the
// Cài đặt on screen. The browser plays the phone: the mic goes up as 8 kHz PCM, Bonia's voice comes down the same
// way (voice agent lab/web-call.js, mod_audio_stream's protocol), with the transcript and the requests she records.
// Local test for now: the call server listens on the voice-agent box and is reached through an ssh tunnel.

export const WEBCALL_URL = import.meta.env.VITE_WEBCALL_URL || (typeof location !== "undefined" && location.hostname === "localhost" ? "ws://localhost:5291" : "");

// mic → 8 kHz 16-bit frames of 20 ms (box-filtered when the context runs faster than 8 kHz), with the input level
const WORKLET = `
class Up8k extends AudioWorkletProcessor {
  constructor() { super(); this.step = sampleRate / 8000; this.pos = 0; this.acc = 0; this.cnt = 0; this.out = new Int16Array(160); this.n = 0; this.lv = 0; this.lvN = 0; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      const x = ch[i];
      this.acc += x; this.cnt += 1; this.lv += x * x; this.lvN += 1; this.pos += 1;
      if (this.pos < this.step) continue;
      this.pos -= this.step;
      const v = Math.max(-1, Math.min(1, this.acc / this.cnt));
      this.acc = 0; this.cnt = 0;
      this.out[this.n++] = v < 0 ? v * 32768 : v * 32767;
      if (this.n === 160) {
        this.port.postMessage({ pcm: this.out.buffer.slice(0), level: Math.sqrt(this.lv / this.lvN) });
        this.n = 0; this.lv = 0; this.lvN = 0;
      }
    }
    return true;
  }
}
registerProcessor("up8k", Up8k);
`;

/**
 * Starts a call. on: { state(phase: connecting | speaking | listening), level(rms), transcript(who, text),
 * request({ id, card, withdrawn }), end(), error(message) }. Resolves to { stop }.
 */
export async function startRealCall({ profile, on }) {
  let ac;
  try {
    ac = new AudioContext({ sampleRate: 8000 });
  } catch {
    ac = new AudioContext(); // the worklet resamples
  }
  if (ac.state === "suspended") await ac.resume().catch(() => {});
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
  } catch (e) {
    ac.close().catch(() => {});
    throw e;
  }
  const blob = URL.createObjectURL(new Blob([WORKLET], { type: "application/javascript" }));
  await ac.audioWorklet.addModule(blob);
  URL.revokeObjectURL(blob);

  const ws = new WebSocket(WEBCALL_URL);
  ws.binaryType = "arraybuffer";
  const src = ac.createMediaStreamSource(stream);
  const up = new AudioWorkletNode(ac, "up8k");
  const sink = ac.createGain();
  sink.gain.value = 0; // pulls the worklet without playing the mic back
  src.connect(up);
  up.connect(sink);
  sink.connect(ac.destination);
  const stats = { rate: ac.sampleRate, sent: 0, maxLevel: 0, got: 0 };
  if (import.meta.env.DEV) window.__boniaCall = stats; // local debugging only
  up.port.onmessage = (e) => {
    on.level?.(e.data.level);
    stats.maxLevel = Math.max(stats.maxLevel, e.data.level);
    if (ws.readyState === 1) {
      ws.send(e.data.pcm);
      stats.sent += 1;
    }
  };

  // Bonia's voice: 8 kHz frames queued back to back; clearAudio (the guest talked over her) drops the queue
  let playhead = 0;
  let voicedUntil = 0; // the session pads with silence: only frames with sound mean she is talking
  let heard = false;
  const playing = new Set();
  const play = (buf) => {
    const i16 = new Int16Array(buf);
    if (!i16.length) return;
    const f = new Float32Array(i16.length);
    let e = 0;
    for (let i = 0; i < i16.length; i++) {
      f[i] = i16[i] / 32768;
      e += f[i] * f[i];
    }
    const ab = ac.createBuffer(1, f.length, 8000);
    ab.copyToChannel(f, 0);
    const s = ac.createBufferSource();
    s.buffer = ab;
    s.connect(ac.destination);
    const at = Math.max(playhead, ac.currentTime + 0.05);
    s.start(at);
    playhead = at + ab.duration;
    if (Math.sqrt(e / f.length) > 0.01) voicedUntil = playhead;
    playing.add(s);
    s.onended = () => playing.delete(s);
    if (!heard && ws.readyState === 1) {
      heard = true;
      ws.send(JSON.stringify({ type: "playback", event: "started" }));
    }
  };
  const clear = () => {
    for (const s of playing) {
      try { s.stop(); } catch { /* ended */ }
    }
    playing.clear();
    playhead = ac.currentTime;
    voicedUntil = 0;
  };

  let stopped = false;
  const tick = setInterval(() => {
    if (stopped) return;
    on.state?.(ws.readyState === 0 ? "connecting" : voicedUntil > ac.currentTime ? "speaking" : "listening");
  }, 120);
  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearInterval(tick);
    try { ws.close(); } catch { /* closed */ }
    stream.getTracks().forEach((t) => t.stop());
    try { src.disconnect(); up.disconnect(); } catch { /* gone */ }
    clear();
    ac.close().catch(() => {});
  };

  ws.onopen = () => ws.send(JSON.stringify({ type: "start", profile }));
  ws.onmessage = (e) => {
    if (typeof e.data !== "string") {
      stats.got += 1;
      return play(e.data);
    }
    let m;
    try { m = JSON.parse(e.data); } catch { return undefined; }
    if (m.type === "clearAudio") clear();
    else if (m.type === "transcript") on.transcript?.(m.who, m.text);
    else if (m.type === "request") on.request?.(m);
    return undefined;
  };
  ws.onerror = () => { if (!stopped) on.error?.("Không kết nối được tới Bonia. Thử lại sau ít phút."); };
  // Bonia hung up (or the line dropped): let her last words play out, then end
  ws.onclose = () => {
    if (stopped) return;
    const left = Math.max(0, playhead - ac.currentTime);
    setTimeout(() => {
      if (stopped) return;
      stop();
      on.end?.();
    }, left * 1000 + 300);
  };
  return { stop };
}
