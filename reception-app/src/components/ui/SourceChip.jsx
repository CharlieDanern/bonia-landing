import React from "react";

// Where Bonia found a fact: BOOKING.COM, TRANG WEB, GOOGLE MAPS, FACEBOOK,
// AGODA, TRAVELOKA. Mono 9.5px, 0.14em, 1px hairline, radius 4, 2 × 6.
export function SourceChip({ children, inline = false, style }) {
  return (
    <span
      style={{
        fontFamily: "var(--bn-mono)",
        fontSize: 9.5,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        border: "1px solid var(--bn-hairline)",
        borderRadius: 4,
        padding: "2px 6px",
        color: "var(--bn-ink-2)",
        whiteSpace: "nowrap",
        marginLeft: inline ? 6 : undefined,
        lineHeight: "normal",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
