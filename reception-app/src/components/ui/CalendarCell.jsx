import React from "react";

// Room calendar cell (README), 84px tall:
//   free      white, mono 20 count + "/total" mono 10
//   full      #EFE9DD, "hết" muted
//   pending   tag "+1 CHỜ" dashed clay
//   conflict  inset 2px urgent, #FBF8F2, tag "⚠ +2 CHỜ" solid urgent
//   closed    135° stripes, "Đóng" + reason tag
//   manual    tag "ĐÃ CHỈNH TAY" hairline
// Pass the selector output (select.cellView) straight in.
export function CalendarCell({
  remaining = 0,
  total = 0,
  pending = 0,
  conflict = false,
  closed = false,
  closedReason = "",
  manual = false,
  dimmed = false,
  onClick,
  label,
  height = 84,
  style,
}) {
  const full = !closed && remaining <= 0;
  let bg = full ? "var(--bn-processing-bg)" : "#FFFFFF";
  let shadow = "none";
  let tag = null; // { text, color, border }
  if (closed) {
    bg = "repeating-linear-gradient(135deg,#EFE9DD 0 6px,#FFFFFF 6px 12px)";
    tag = closedReason ? { text: closedReason, color: "var(--bn-ink-2)", border: "1px solid var(--bn-hairline)" } : null;
  } else if (pending > 0) {
    tag = conflict
      ? { text: `⚠ +${pending} CHỜ`, color: "var(--bn-urgent)", border: "1px solid var(--bn-urgent)" }
      : { text: `+${pending} CHỜ`, color: "var(--bn-clay)", border: "1px dashed var(--bn-clay)" };
    if (conflict) {
      shadow = "inset 0 0 0 2px var(--bn-urgent)";
      bg = "var(--bn-urgent-wash)";
    }
  }
  if (manual && !closed) tag = { text: "ĐÃ CHỈNH TAY", color: "var(--bn-ink-2)", border: "1px solid var(--bn-hairline)" };

  // Overbooked (a confirmed booking past the last room) shows "−1" in urgent.
  const over = !closed && remaining < 0;
  const n = closed ? "Đóng" : over ? `−${Math.abs(remaining)}` : full ? "hết" : String(remaining);
  const nColor = closed ? "var(--bn-ink-2)" : over ? "var(--bn-urgent)" : full ? "var(--bn-muted)" : "var(--bn-ink)";
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-label={label}
      style={{
        height,
        borderRight: "1px solid var(--bn-hairline-2)",
        borderBottom: "1px solid var(--bn-hairline-2)",
        padding: 7,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: bg,
        boxShadow: shadow,
        textAlign: "left",
        width: "100%",
        minWidth: 0,
        opacity: dimmed ? 0.55 : 1,
        overflow: "hidden",
        ...style,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: "var(--bn-mono)", fontSize: 20, color: nColor }}>{n}</span>
        <span style={{ fontFamily: "var(--bn-mono)", fontSize: 10, color: "var(--bn-muted)" }}>
          {closed || full ? "" : `/${total}`}
        </span>
      </div>
      {tag && (
        <span
          style={{
            fontFamily: "var(--bn-mono)",
            fontSize: 9,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            color: tag.color,
            border: tag.border,
            borderRadius: 4,
            padding: "2px 4px",
            alignSelf: "flex-start",
          }}
        >
          {tag.text}
        </span>
      )}
    </Tag>
  );
}

/** Day header: today inverted (ink), weekend nights (T6, T7) cream. */
export function CalendarDayHeader({ w, d, today = false, weekend = false, height = 52, style }) {
  const c = today ? "var(--bn-cream-2)" : "var(--bn-ink)";
  return (
    <div
      style={{
        height,
        borderRight: "1px solid var(--bn-hairline-2)",
        borderBottom: "1px solid var(--bn-hairline)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        background: today ? "var(--bn-ink)" : weekend ? "var(--bn-cream-2)" : "#FFFFFF",
        ...style,
      }}
    >
      <span style={{ fontFamily: "var(--bn-mono)", fontSize: 10, letterSpacing: "0.1em", color: c }}>{w}</span>
      <span style={{ fontFamily: "var(--bn-mono)", fontSize: 13, color: c }}>{d}</span>
    </div>
  );
}
