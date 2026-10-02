import React from "react";
import { LockTag } from "./Tag.jsx";

// Things Bonia will never do, shown so the owner sees the limit.
//   card  radio option that can't be chosen ("Tự đặt phòng — Cần kết nối…")
//   row   row inside a settings card ("Tự hứa nhận sớm, trả trễ")
//   note  inline rule with the tag first ("Bonia chỉ ghi lại; …")
export function LockedOption({ variant = "card", title, sub, children, style }) {
  if (variant === "row") {
    return (
      <div
        aria-disabled="true"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: 52,
          padding: "0 16px",
          background: "var(--bn-cream-2)",
          color: "var(--bn-muted)",
          ...style,
        }}
      >
        <span style={{ fontSize: 14.5 }}>{title ?? children}</span>
        <LockTag />
      </div>
    );
  }
  if (variant === "note") {
    return (
      <div
        style={{
          padding: "12px 16px",
          background: "var(--bn-cream-3)",
          border: "1px solid var(--bn-hairline-2)",
          borderRadius: 10,
          fontSize: 13.5,
          color: "var(--bn-ink-2)",
          display: "flex",
          gap: 10,
          alignItems: "center",
          ...style,
        }}
      >
        <LockTag style={{ border: "1px solid var(--bn-hairline)" }} />
        {title ?? children}
      </div>
    );
  }
  return (
    <div
      aria-disabled="true"
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: "14px 16px",
        background: "var(--bn-cream-2)",
        border: "1px dashed var(--bn-dashed)",
        borderRadius: 12,
        color: "var(--bn-muted)",
        ...style,
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          border: "1px solid var(--bn-hairline)",
          background: "var(--bn-hairline-2)",
          flex: "none",
        }}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 14.5, fontWeight: 500 }}>{title}</span>
        {sub && <span style={{ fontSize: 12.5 }}>{sub}</span>}
      </div>
      <LockTag />
    </div>
  );
}
