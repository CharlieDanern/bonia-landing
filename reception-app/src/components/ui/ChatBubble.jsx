import React from "react";

// Transcript bubbles (README). Bonia left: white, 1px hairline. Guest
// right: #EFE4D6, 1px #E4D5C1. Label mono 9.5 BONIA / KHÁCH.
//   md  call detail: max 520, padding 10 14, radius 14, 14px
//   lg  live test call: max 560, padding 12 16, radius 16, 15.5px
const SIZES = {
  md: { max: 520, pad: "10px 14px", radius: 14, font: 14, label: 9.5, gap: 3 },
  lg: { max: 560, pad: "12px 16px", radius: 16, font: 15.5, label: 10, gap: 4 },
};

export function ChatBubble({ who = "bonia", text, size = "md", style }) {
  const s = SIZES[size] || SIZES.md;
  const guest = who === "guest";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: guest ? "flex-end" : "flex-start", gap: s.gap, ...style }}>
      <span style={{ fontFamily: "var(--bn-mono)", fontSize: s.label, letterSpacing: "0.14em", color: "var(--bn-muted)" }}>
        {guest ? "KHÁCH" : "BONIA"}
      </span>
      <div
        style={{
          maxWidth: s.max,
          padding: s.pad,
          borderRadius: s.radius,
          fontSize: s.font,
          lineHeight: 1.5,
          background: guest ? "var(--bn-guest-bubble)" : "#FFFFFF",
          border: `1px solid ${guest ? "var(--bn-guest-bubble-line)" : "var(--bn-hairline)"}`,
          color: "var(--bn-ink)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

/** Live "Bonia is speaking" dots: 6px, ink → muted → dashed. */
export function TypingBubble({ style }) {
  const dot = (bg) => <span style={{ width: 6, height: 6, borderRadius: 3, background: bg, display: "block" }} />;
  return (
    <div
      className="tt-typing"
      aria-label="Bonia đang nói"
      style={{
        display: "flex",
        gap: 5,
        padding: "14px 16px",
        background: "#fff",
        border: "1px solid var(--bn-hairline)",
        borderRadius: 16,
        alignSelf: "flex-start",
        ...style,
      }}
    >
      {dot("var(--bn-muted)")}
      {dot("var(--bn-typing-mid)")}
      {dot("var(--bn-dashed)")}
    </div>
  );
}

/** A whole transcript (list of { who, text }). */
export function Transcript({ lines = [], size = "md", gap = 10, typing = false, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>
      {lines.map((l, i) => (
        <ChatBubble key={i} who={l.who} text={l.text} size={size} />
      ))}
      {typing && <TypingBubble />}
    </div>
  );
}
