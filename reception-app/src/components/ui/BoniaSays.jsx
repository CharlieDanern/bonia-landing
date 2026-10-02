import React from "react";

// "Bonia sẽ nói…" (README): what Bonia will say with the current settings.
//   card    white, 1px #EFE9DD, radius 14, padding 18 20; quote serif italic 17–19
//   inline  #FAF7F1 strip with the label in front of the quote (Hôm nay)
export function BoniaSays({
  quote,
  context,
  label = "Bonia sẽ nói…",
  variant = "card",
  size = 17,
  padding,
  style,
  children,
}) {
  if (variant === "inline") {
    return (
      <div
        style={{
          background: "var(--bn-cream-3)",
          border: "1px solid var(--bn-hairline-2)",
          borderRadius: 10,
          padding: padding ?? "10px 12px",
          fontSize: 13,
          lineHeight: 1.5,
          ...style,
        }}
      >
        <span
          style={{
            fontFamily: "var(--bn-mono)",
            fontSize: 9.5,
            letterSpacing: "0.18em",
            color: "var(--bn-muted)",
            textTransform: "uppercase",
          }}
        >
          {label.replace(/…$/, "")} ·{" "}
        </span>
        <span style={{ fontFamily: "var(--bn-serif)", fontStyle: "italic", fontSize: 15 }}>{quote}</span>
      </div>
    );
  }
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--bn-hairline-2)",
        borderRadius: 14,
        padding: padding ?? "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: "var(--bn-mono)",
          fontSize: size >= 19 ? 10.5 : 10,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--bn-muted)",
        }}
      >
        {label}
      </div>
      {context && <div style={{ fontSize: 12.5, color: "var(--bn-muted)" }}>{context}</div>}
      {quote && (
        <div style={{ fontFamily: "var(--bn-serif)", fontStyle: "italic", fontSize: size, lineHeight: size >= 19 ? 1.45 : 1.5 }}>
          {quote}
        </div>
      )}
      {children}
    </div>
  );
}
