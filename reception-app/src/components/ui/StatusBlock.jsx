import React from "react";

// Hôm nay status block (README). Always present: it is the first thing
// support asks about.
//   ok    green dot + "Bonia hoạt động bình thường" + facts line
//   warn  border #EBCFC4, tag (CẦN KIỂM TRA / LỊCH CŨ) + context, 17/600
//         sentence, explanation, actions
export function StatusBlock({
  kind = "ok",
  title = "Bonia hoạt động bình thường",
  facts = [], // ["Chuyển cuộc gọi ✓", "Cuộc gọi gần nhất 14:05", …]
  tag, // "CẦN KIỂM TRA"
  context, // "Số điện thoại"
  body,
  actions,
  style,
}) {
  if (kind === "warn") {
    return (
      <div
        role="status"
        style={{
          background: "#fff",
          border: "1px solid var(--bn-urgent-line)",
          borderRadius: 14,
          padding: "20px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          ...style,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span
            style={{
              fontFamily: "var(--bn-mono)",
              fontSize: 10,
              letterSpacing: "0.14em",
              padding: "4px 8px",
              borderRadius: 10,
              background: "var(--bn-urgent-bg)",
              color: "var(--bn-urgent)",
              whiteSpace: "nowrap",
            }}
          >
            {tag}
          </span>
          {context && <span style={{ fontSize: 13, color: "var(--bn-muted)" }}>{context}</span>}
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.4 }}>{title}</div>
        {body && <div style={{ fontSize: 13, color: "var(--bn-ink-2)", lineHeight: 1.5 }}>{body}</div>}
        {actions && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>}
      </div>
    );
  }
  return (
    <div
      role="status"
      style={{
        background: "#fff",
        border: "1px solid var(--bn-hairline)",
        borderRadius: 14,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span style={{ width: 9, height: 9, borderRadius: 5, background: "var(--bn-ok)", flex: "none" }} />
        <span style={{ fontSize: 14.5, fontWeight: 600 }}>{title}</span>
      </div>
      {facts.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", fontSize: 12.5, color: "var(--bn-ink-2)" }}>
          {facts.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </div>
      )}
    </div>
  );
}
