import React from "react";

// The play / stop mark inside a round voice-sample button (Cài đặt, Thử Bonia). Drawn as an SVG, not the ▶ / ■
// characters: those fall back to a different font per browser and sat off-centre (founder 2026-10-07). The triangle
// is nudged 1 px right so it looks centred in the circle.
export default function PlayGlyph({ playing, size = 9 }) {
  return playing ? (
    <svg width={size - 1} height={size - 1} viewBox="0 0 8 8" aria-hidden="true">
      <rect width="8" height="8" rx="1" fill="currentColor" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 9 10" aria-hidden="true" style={{ marginLeft: 1 }}>
      <path d="M1 0.8 L8.4 5 L1 9.2 Z" fill="currentColor" />
    </svg>
  );
}

// The button around it: a circle with the mark in its middle (the app's base button style inherits text-align).
export const playCircle = (diameter) => ({
  width: diameter,
  height: diameter,
  borderRadius: diameter / 2,
  flex: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#7B4A2D",
});
