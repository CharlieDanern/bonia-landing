import React from "react";

// "Đã nhắn khách 11:20" / "Chưa nhắn khách": separate from the status.
// Opening the SMS app never sets it; only the hotel's "Đã gửi" does.
export function MessageFlag({ messagedAt, size = "md", style }) {
  const sent = !!messagedAt;
  const sm = size === "sm";
  return (
    <span
      style={{
        fontFamily: "var(--bn-mono)",
        fontSize: sm ? 9.5 : 10,
        letterSpacing: "0.1em",
        padding: sm ? "3px 7px" : "4px 8px",
        borderRadius: sm ? 9 : 10,
        border: sent ? "1px solid var(--bn-ok)" : "1px dashed var(--bn-dashed)",
        color: sent ? "var(--bn-ok)" : "var(--bn-muted)",
        background: "transparent",
        whiteSpace: "nowrap",
        textTransform: "uppercase",
        flex: "none",
        ...style,
      }}
    >
      {sent ? `✓ Đã nhắn khách ${messagedAt}` : "Chưa nhắn khách"}
    </span>
  );
}
