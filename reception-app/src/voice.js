// Voice previews for Giọng 1–6. A recorded sample per voice when present
// (public/voices/giong-N.mp3, the engine's real voices), else the browser's
// Vietnamese voice so the button still answers.

export function playVoice(i, text, onEnd) {
  const audio = new Audio(`${import.meta.env.BASE_URL}voices/giong-${i}.mp3`);
  audio.onended = onEnd;
  audio.play().catch(() => {
    const ss = window.speechSynthesis;
    if (!ss) return onEnd();
    ss.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = ss.getVoices().find((x) => x.lang?.toLowerCase().startsWith("vi"));
    if (v) u.voice = v;
    u.lang = "vi-VN";
    u.onend = onEnd;
    u.onerror = onEnd;
    ss.speak(u);
    return undefined;
  });
  return () => {
    audio.pause();
    window.speechSynthesis?.cancel();
  };
}
