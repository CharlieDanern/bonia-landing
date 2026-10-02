import React from "react";

// The ✕ used by sheets and dialogs (muted glyph, 44px hit area).
export function CloseButton({ onClick, label = "Đóng", style }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        color: "var(--bn-muted)",
        width: 28,
        height: 28,
        margin: -8,
        padding: 8,
        boxSizing: "content-box",
        lineHeight: "28px",
        textAlign: "center",
        flex: "none",
        ...style,
      }}
    >
      ✕
    </button>
  );
}
