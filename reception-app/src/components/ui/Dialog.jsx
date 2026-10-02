import React from "react";
import { createPortal } from "react-dom";
import { useEscape, useIsMobile } from "../../lib/hooks.js";
import { CloseButton } from "./CloseButton.jsx";

// Dialog (README): scrim rgba(31,27,22,0.42) over everything, white,
// radius 20, padding 28–40, width 560–820. Mobile: bottom sheet.
// With `eyebrow`/`title` it draws the standard header (mono eyebrow + ✕,
// serif 28 title); pass `bare` to lay the whole panel out yourself
// (e.g. the message sheet with its own header and footer strips).
export function Dialog({
  open,
  onClose,
  eyebrow,
  title,
  width = 640,
  padding = "28px 32px",
  gap = 18,
  bare = false,
  children,
  label,
  style,
}) {
  const mobile = useIsMobile();
  useEscape(open, onClose);
  if (!open) return null;

  const panelStyle = mobile
    ? {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        maxHeight: "92vh",
        overflowY: "auto",
        background: "#fff",
        borderRadius: "20px 20px 0 0",
        paddingBottom: "env(safe-area-inset-bottom)",
      }
    : { width, maxWidth: "calc(100vw - 32px)", maxHeight: "calc(100vh - 32px)", overflowY: "auto", background: "#fff", borderRadius: 20 };

  return createPortal(
    <div
      className="tt-scrim"
      onClick={onClose}
      style={{
        inset: 0,
        background: "var(--bn-scrim)",
        display: "flex",
        alignItems: mobile ? "flex-end" : "center",
        justifyContent: "center",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label || (typeof title === "string" ? title : undefined)}
        onClick={(e) => e.stopPropagation()}
        style={{
          ...panelStyle,
          ...(bare ? { display: "flex", flexDirection: "column", overflow: mobile ? "auto" : "hidden" } : { padding: mobile ? "24px 16px" : padding, display: "flex", flexDirection: "column", gap }),
          ...style,
        }}
      >
        {!bare && (eyebrow || onClose) && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
            <span style={{ fontFamily: "var(--bn-mono)", fontSize: 11, letterSpacing: "0.2em", color: "var(--bn-muted)", textTransform: "uppercase" }}>
              {eyebrow}
            </span>
            {onClose && <CloseButton onClick={onClose} />}
          </div>
        )}
        {!bare && title && <div style={{ fontFamily: "var(--bn-serif)", fontSize: 28, lineHeight: 1.2 }}>{title}</div>}
        {children}
      </div>
    </div>,
    document.body
  );
}
