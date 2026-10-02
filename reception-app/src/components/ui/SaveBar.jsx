import React from "react";
import { Button } from "./Button.jsx";

// Sticky save bar (README): only while there are unsaved changes.
// White, top hairline, padding 14 40: summary left, Bỏ thay đổi + Lưu right.
// Error variant: urgent wash, urgent sentence, "Thử lưu lại" (urgent).
export function SaveBar({
  message, // "1 thay đổi chưa lưu · giá theo giờ 220.000 → 240.000"
  onDiscard,
  onSave,
  saving = false,
  error = null, // string: "Chưa lưu được. Máy đang mất mạng; thay đổi vẫn còn trên máy này."
  sticky = true,
  style,
}) {
  const base = {
    position: sticky ? "sticky" : "relative",
    bottom: 0,
    zIndex: 5,
    padding: "14px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flex: "none",
  };
  if (error) {
    return (
      <div
        role="alert"
        style={{ ...base, borderTop: "1px solid var(--bn-urgent-line)", background: "var(--bn-urgent-bg)", ...style }}
      >
        <span style={{ fontSize: 14, color: "var(--bn-urgent)", fontWeight: 500 }}>{error}</span>
        <Button variant="danger" size="sm" loading={saving} onClick={onSave} style={{ padding: "0 26px" }}>
          Thử lưu lại
        </Button>
      </div>
    );
  }
  return (
    <div style={{ ...base, borderTop: "1px solid var(--bn-hairline)", background: "#fff", ...style }}>
      <span style={{ fontSize: 14, color: "var(--bn-ink-2)" }}>{message}</span>
      <span style={{ display: "flex", gap: 8 }}>
        <Button variant="secondary" size="sm" onClick={onDiscard} style={{ padding: "0 18px" }} disabled={saving}>
          Bỏ thay đổi
        </Button>
        <Button variant="primary" size="sm" loading={saving} onClick={onSave} style={{ padding: "0 26px" }}>
          Lưu
        </Button>
      </span>
    </div>
  );
}

/** "1 thay đổi chưa lưu" / "3 thay đổi chưa lưu" (+ optional detail). */
export function unsavedLabel(count, detail) {
  return `${count} thay đổi chưa lưu${detail ? ` · ${detail}` : ""}`;
}
