import React from "react";

// Inline notices with a mono tag in front.
//   error  urgent wash + urgent text, tag outlined urgent ("LỖI", "HẾT HẠN")
//   info   white + hairline, muted tag ("MẠNG")
//   dashed conflict banner: #FBF8F2, 1px dashed urgent (⚠ …)
export function Banner({ tone = "error", tag, children, action, style }) {
  const tones = {
    error: { bg: "var(--bn-urgent-bg)", color: "var(--bn-urgent)", border: "0", tagBorder: "var(--bn-urgent)", weight: 500 },
    info: { bg: "#fff", color: "var(--bn-ink-2)", border: "1px solid var(--bn-hairline)", tagBorder: "var(--bn-hairline)", weight: 400 },
    conflict: { bg: "var(--bn-urgent-wash)", color: "var(--bn-ink-2)", border: "1px dashed var(--bn-urgent)", tagBorder: "var(--bn-urgent)", weight: 400 },
  };
  const t = tones[tone] || tones.error;
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        padding: "12px 14px",
        borderRadius: 10,
        background: t.bg,
        border: t.border,
        color: t.color,
        fontSize: 14,
        fontWeight: t.weight,
        lineHeight: 1.5,
        ...style,
      }}
    >
      {tag && (
        <span
          style={{
            fontFamily: "var(--bn-mono)",
            fontSize: 10,
            letterSpacing: "0.14em",
            border: `1px solid ${t.tagBorder}`,
            color: tone === "info" ? "var(--bn-muted)" : "inherit",
            borderRadius: 4,
            padding: "2px 6px",
            whiteSpace: "nowrap",
            fontWeight: 400,
          }}
        >
          {tag}
        </span>
      )}
      <span style={{ flex: 1 }}>{children}</span>
      {action}
    </div>
  );
}
