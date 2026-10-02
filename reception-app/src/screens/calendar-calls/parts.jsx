import React, { useEffect } from "react";
import { Link } from "wouter";

// Small pieces shared by the Lịch phòng and Cuộc gọi screens.

/**
 * ✕ that takes only its glyph's height in the layout (the shared
 * CloseButton is 28px tall, which pushes the sheet headers down) while
 * keeping a 44px hit area through padding + negative margin.
 */
export function SheetClose({ onClick, label = "Đóng" }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{ color: "var(--bn-muted)", padding: 12, margin: -12, lineHeight: "normal", flex: "none" }}
    >
      ✕
    </button>
  );
}

/**
 * Dark confirmation bar (3.5 C): "✓ Đội Bonia đã nhận…" + optional link.
 * Auto-hides after `timeout` ms when given.
 */
export function DarkNote({ children, link, linkTo, onHide, timeout, style }) {
  useEffect(() => {
    if (!timeout || !onHide) return undefined;
    const t = setTimeout(onHide, timeout);
    return () => clearTimeout(t);
  }, [timeout, onHide]);
  return (
    <div
      role="status"
      style={{
        padding: "14px 18px",
        background: "var(--bn-ink)",
        color: "var(--bn-cream-2)",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 12,
        flex: "none",
        ...style,
      }}
    >
      <span style={{ color: "#B9D3A6" }} aria-hidden="true">
        ✓
      </span>
      <span style={{ flex: 1, fontSize: 14.5 }}>{children}</span>
      {link && (
        <Link href={linkTo} style={{ fontSize: 14, color: "#F2E2D2", whiteSpace: "nowrap" }}>
          {link}
        </Link>
      )}
    </div>
  );
}
