import React from "react";

// Small mono tags: KHÓA, LỖI, MẠNG, HẾT HẠN, CẦN BẠN ĐIỀN, LỊCH CŨ…
// shape "box" = radius 4 outline (KHÓA, LỖI) · "pill" = radius 10 filled.
const TONES = {
  muted: { color: "var(--bn-muted)", border: "var(--bn-hairline)", bg: "transparent" },
  locked: { color: "var(--bn-muted)", border: "var(--bn-muted)", bg: "transparent" },
  ink: { color: "var(--bn-ink-2)", border: "var(--bn-hairline)", bg: "transparent" },
  urgent: { color: "var(--bn-urgent)", border: "var(--bn-urgent)", bg: "transparent" },
  "urgent-fill": { color: "var(--bn-urgent)", border: "var(--bn-urgent-bg)", bg: "var(--bn-urgent-bg)" },
  clay: { color: "var(--bn-clay)", border: "var(--bn-clay)", bg: "transparent" },
  ok: { color: "var(--bn-ok)", border: "var(--bn-ok)", bg: "transparent" },
};

export function Tag({ children, tone = "muted", shape = "box", dashed = false, size = 9.5, style }) {
  const t = TONES[tone] || TONES.muted;
  const box = shape === "box";
  return (
    <span
      style={{
        fontFamily: "var(--bn-mono)",
        fontSize: size,
        letterSpacing: "0.14em",
        lineHeight: "normal",
        color: t.color,
        background: t.bg,
        border: box || t.bg === "transparent" ? `1px ${dashed ? "dashed" : "solid"} ${t.border}` : 0,
        borderRadius: box ? 4 : 10,
        padding: box ? "2px 6px" : "4px 8px",
        whiteSpace: "nowrap",
        textTransform: "uppercase",
        flex: "none",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** The KHÓA tag on locked options (mono 9.5, 1px #6E6255, radius 4). */
export function LockTag({ style }) {
  return (
    <Tag tone="locked" style={style}>
      Khóa
    </Tag>
  );
}

/** Mono uppercase section label ("CÁCH NHẬN ĐẶT · CHỌN MỘT"). */
export function Label({ children, size = 10, tracking = "0.2em", color = "var(--bn-muted)", style, as: As = "div" }) {
  return (
    <As
      style={{
        fontFamily: "var(--bn-mono)",
        fontSize: size,
        letterSpacing: tracking,
        textTransform: "uppercase",
        color,
        ...style,
      }}
    >
      {children}
    </As>
  );
}
