/**
 * Incoming-message chime for the RM portal.
 *
 * SYNTHESISED, not a file: two short sine tones through the Web Audio API.
 * No asset to ship, no CDN request (the artifact CSP would block one anyway),
 * no decode latency, and it cannot 404 the way a missing /notify.mp3 would.
 *
 * Browser autoplay policy: an AudioContext created before any user gesture
 * starts `suspended` and stays silent. The rep always clicks "Đăng nhập"
 * before any message can arrive, so by the time this fires the page has a
 * gesture — but we still resume() defensively and fail quietly, because a
 * chat that throws on a blocked sound is worse than a chat that is silent.
 */
const MUTE_KEY = "bonia_chat_chime_muted";
// A burst of messages should sound like one notification, not a fire alarm.
const MIN_GAP_MS = 1500;

let ctx = null;
let lastPlayedAt = 0;

export function isChimeMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false; // private mode / storage denied — default to audible
  }
}

export function setChimeMuted(muted) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* preference simply will not persist */
  }
}

/**
 * Two-note bell: a fifth apart, each a short sine with an exponential decay.
 * Deliberately quiet (peak gain 0.09) and under 400ms — this fires while the
 * rep may be on a call through the same speakers.
 */
export function playChime() {
  if (isChimeMuted()) return;
  const now = Date.now();
  if (now - lastPlayedAt < MIN_GAP_MS) return;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!ctx) ctx = new AudioCtx();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    if (ctx.state !== "running") return; // no gesture yet — stay silent

    lastPlayedAt = now;
    const t0 = ctx.currentTime;
    // 880Hz then 1318.5Hz (A5 → E6): a rising interval reads as "arrived"
    // rather than "error", which a falling one does.
    [
      { freq: 880.0, at: 0 },
      { freq: 1318.5, at: 0.09 },
    ].forEach(({ freq, at }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0 + at);
      gain.gain.exponentialRampToValueAtTime(0.09, t0 + at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0 + at);
      osc.stop(t0 + at + 0.3);
    });
  } catch {
    /* audio unavailable — never let a sound break the thread */
  }
}
