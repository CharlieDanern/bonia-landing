import React from "react";

// Status pill (README). Kinds:
//   new         Mới (also ĐÃ BÁO): white, 1px clay, clay text
//   processing  Chờ cọc · Đã giao · Đang tìm · Tìm thấy: #EFE9DD, ink-2
//   done        ✓ Đã xác nhận · ✓ Xong · Không thấy · ✓ Đã trả khách · Đã từ chối
//   urgent      Gấp: urgent text on urgent bg
//   overdue     Quá hạn: white, 1px urgent
//   conflict    ⚠: white, 1px #EBCFC4, urgent
//   type        ĐẶT PHÒNG, KHÁCH ĐANG Ở…: 1px hairline, ink-2
// size "sm" = list rows (9.5px, 3×7, r9) · "md" = detail/Hôm nay (10px, 4×8, r10).
const KINDS = {
  new: { bg: "#FFFFFF", color: "var(--bn-clay)", border: "var(--bn-clay)" },
  reported: { bg: "#FFFFFF", color: "var(--bn-clay)", border: "var(--bn-clay)" },
  processing: { bg: "var(--bn-processing-bg)", color: "var(--bn-ink-2)", border: null },
  done: { bg: "transparent", color: "var(--bn-muted)", border: "var(--bn-hairline)" },
  urgent: { bg: "var(--bn-urgent-bg)", color: "var(--bn-urgent)", border: null },
  overdue: { bg: "#FFFFFF", color: "var(--bn-urgent)", border: "var(--bn-urgent)" },
  conflict: { bg: "#FFFFFF", color: "var(--bn-urgent)", border: "var(--bn-urgent-line)" },
  type: { bg: "transparent", color: "var(--bn-ink-2)", border: "var(--bn-hairline)" },
};

const SIZES = {
  sm: { fontSize: 9.5, padding: "3px 7px", borderRadius: 9, letterSpacing: "0.1em" },
  md: { fontSize: 10, padding: "4px 8px", borderRadius: 10, letterSpacing: "0.1em" },
};

export function StatusPill({ kind = "type", size = "md", children, style, title }) {
  const k = KINDS[kind] || KINDS.type;
  const s = SIZES[size] || SIZES.md;
  // List pills carry a 1px border in the fill colour so every pill in a row
  // has the same height; detail pills draw fills without one.
  const border = k.border ? `1px solid ${k.border}` : size === "sm" ? `1px solid ${k.bg}` : 0;
  return (
    <span
      title={title}
      style={{
        fontFamily: "var(--bn-mono)",
        fontSize: s.fontSize,
        letterSpacing: s.letterSpacing,
        padding: s.padding,
        borderRadius: s.borderRadius,
        background: k.bg,
        color: k.color,
        border,
        whiteSpace: "nowrap",
        lineHeight: "normal",
        flex: "none",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** A row of pills from selector output ([{ kind, text }]). */
export function PillRow({ pills, size = "md", gap, style }) {
  return (
    <span style={{ display: "flex", gap: gap ?? (size === "sm" ? 4 : 6), flex: "none", ...style }}>
      {pills.map((p, i) => (
        <StatusPill key={`${p.text}-${i}`} kind={p.kind} size={size}>
          {p.text}
        </StatusPill>
      ))}
    </span>
  );
}
