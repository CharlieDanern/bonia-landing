import React, { useEffect, useMemo, useState } from "react";

// Recording player (README): #F7F3EC radius 12; 38px clay play button;
// 80-bar waveform (played clay, rest #C9BCA5); "0:52 / 2:36" mono.
// Sample data has no audio, so play advances a simulated position.
const toSec = (s) => {
  const [m, ss] = String(s || "0:00").split(":").map(Number);
  return m * 60 + (ss || 0);
};
const fmt = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

/** Deterministic bar heights (same seed as the canvas: 6–30px). */
function bars(seed = 3, n = 80) {
  let s = seed;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  return Array.from({ length: n }, () => Math.round(6 + rnd() * 24));
}

export function RecordingPlayer({ duration = "2:36", position = "0:00", seed = 3, bars: count = 80, style }) {
  const total = toSec(duration);
  const [pos, setPos] = useState(toSec(position));
  const [playing, setPlaying] = useState(false);
  const heights = useMemo(() => bars(seed, count), [seed, count]);

  useEffect(() => setPos(toSec(position)), [position]);
  useEffect(() => {
    if (!playing) return undefined;
    const t = setInterval(() => {
      setPos((p) => {
        if (p + 1 >= total) {
          setPlaying(false);
          return total;
        }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [playing, total]);

  // Frame: 0:52 of 2:36 → 27 of 80 bars played.
  const played = total ? Math.round((pos / total) * count) : 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 14px",
        background: "var(--bn-cream-2)",
        borderRadius: 12,
        ...style,
      }}
    >
      <button
        type="button"
        aria-label={playing ? "Dừng" : "Nghe"}
        onClick={() => setPlaying((p) => !p)}
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          background: "var(--bn-clay)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          flex: "none",
        }}
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <div
        className="tt-wave"
        role="slider"
        aria-label="Vị trí ghi âm"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={pos}
        tabIndex={0}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPos(Math.round(((e.clientX - r.left) / r.width) * total));
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setPos((p) => Math.min(total, p + 5));
          if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5));
        }}
        style={{ flex: 1, height: 32, display: "flex", alignItems: "center", gap: 2 }}
      >
        {heights.map((h, i) => (
          <span
            key={i}
            style={{ flex: 1, height: h, borderRadius: 1, background: i < played ? "var(--bn-clay)" : "var(--bn-dashed)" }}
          />
        ))}
      </div>
      <span style={{ fontFamily: "var(--bn-mono)", fontSize: 12, color: "var(--bn-ink-2)", whiteSpace: "nowrap" }}>
        {fmt(pos)} / {duration}
      </span>
    </div>
  );
}
