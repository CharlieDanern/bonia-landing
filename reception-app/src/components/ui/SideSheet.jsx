import React from "react";
import { createPortal } from "react-dom";
import { useEscape, useIsMobile } from "../../lib/hooks.js";
import { CloseButton } from "./CloseButton.jsx";

// Side sheet (README): scrim rgba(31,27,22,0.32) over the main area (the
// sidebar stays clear), white panel 440–520 from the right, serif 26–28
// header + ✕, footer action. Below 768px it comes up from the bottom.
//
// `left` = where the scrim starts (default: after the 224px sidebar; the
// Yêu cầu sheet starts after the list pane, 680).
export function SideSheet({
  open,
  onClose,
  title,
  header, // custom header node (replaces title row)
  footer,
  width = 440,
  left = 224,
  children,
  bodyStyle,
  label,
}) {
  const mobile = useIsMobile();
  useEscape(open, onClose);
  if (!open) return null;

  const head = header ?? (
    <div style={{ padding: "26px 28px 14px", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
      <span style={{ fontFamily: "var(--bn-serif)", fontSize: 26 }}>{title}</span>
      <CloseButton onClick={onClose} />
    </div>
  );

  const panel = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label || (typeof title === "string" ? title : undefined)}
      className="tt-sheet-panel"
      onClick={(e) => e.stopPropagation()}
      style={
        mobile
          ? {
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: "90vh",
              background: "#fff",
              borderRadius: "20px 20px 0 0",
              display: "flex",
              flexDirection: "column",
              paddingBottom: "env(safe-area-inset-bottom)",
            }
          : {
              width,
              height: "100%",
              background: "#fff",
              borderLeft: "1px solid var(--bn-hairline)",
              display: "flex",
              flexDirection: "column",
            }
      }
    >
      {head}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 28px", ...bodyStyle }}>{children}</div>
      {footer && (
        <div
          style={{
            padding: "16px 28px",
            borderTop: "1px solid var(--bn-hairline-2)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );

  return createPortal(
    <div
      className="tt-scrim"
      onClick={onClose}
      style={{
        top: 0,
        bottom: 0,
        right: 0,
        left: mobile ? 0 : left,
        background: "var(--bn-scrim-side)",
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      {panel}
    </div>,
    document.body
  );
}
