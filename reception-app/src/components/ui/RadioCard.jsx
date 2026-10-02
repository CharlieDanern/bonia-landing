import React from "react";

// Choose-one card (§03 "Cách nhận đặt", report reasons, Giao cho …).
// Selected = 2px clay border + filled radio ring.
export function Radio({ on }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 18,
        height: 18,
        borderRadius: 9,
        border: on ? "5px solid var(--bn-clay)" : "1px solid var(--bn-dashed)",
        flex: "none",
        background: "#fff",
      }}
    />
  );
}

export function RadioCard({ selected = false, onSelect, title, sub, right, radius = 12, padding = "14px 16px", minHeight, style }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        width: "100%",
        textAlign: "left",
        padding,
        minHeight,
        background: "#fff",
        border: selected ? "2px solid var(--bn-clay)" : "1px solid var(--bn-hairline)",
        borderRadius: radius,
        ...style,
      }}
    >
      <Radio on={selected} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 14.5, fontWeight: selected ? 600 : 500 }}>{title}</span>
        {sub && <span style={{ fontSize: 12.5, color: "var(--bn-ink-2)" }}>{sub}</span>}
      </div>
      {right}
    </button>
  );
}
