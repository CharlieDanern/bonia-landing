import React from "react";

// Pill chips used for filters, answers and on/off choices.
//   filter   list type chips: h30, selected = ink fill (TT Request List)
//   answer   "Cần bạn điền" answers: h36, selected = clay outline + clay text
//   choice   on/off chips (§03 fields, bed types): h34, on = clay fill + "✓ "
//   custom   "Tự viết…": dashed, muted
export function Chip({ variant = "filter", selected = false, onClick, children, disabled, style, check = true }) {
  let css;
  if (variant === "filter") {
    css = {
      height: 30,
      padding: "0 11px",
      borderRadius: 15,
      fontSize: 12.5,
      border: `1px solid ${selected ? "var(--bn-ink)" : "var(--bn-hairline)"}`,
      background: selected ? "var(--bn-ink)" : "transparent",
      color: selected ? "var(--bn-cream-2)" : "var(--bn-ink)",
    };
  } else if (variant === "answer") {
    css = {
      height: 36,
      padding: "0 14px",
      borderRadius: 18,
      fontSize: 14,
      border: `1px solid ${selected ? "var(--bn-clay)" : "var(--bn-hairline)"}`,
      background: "#fff",
      color: selected ? "var(--bn-clay)" : "var(--bn-ink)",
    };
  } else if (variant === "custom") {
    css = {
      height: 36,
      padding: "0 14px",
      borderRadius: 18,
      fontSize: 14,
      border: "1px dashed var(--bn-dashed)",
      background: "transparent",
      color: "var(--bn-muted)",
    };
  } else {
    css = {
      height: 34,
      padding: "0 12px",
      borderRadius: 17,
      fontSize: 13,
      border: selected ? "0" : "1px solid var(--bn-hairline)",
      background: selected ? "var(--bn-clay)" : "#fff",
      color: selected ? "#fff" : "var(--bn-ink)",
    };
  }
  return (
    <button
      type="button"
      className="tt-chip"
      aria-pressed={variant === "custom" ? undefined : selected}
      disabled={disabled}
      onClick={onClick}
      style={{ ...css, ...style }}
    >
      {variant === "choice" && selected && check ? "✓ " : ""}
      {children}
    </button>
  );
}

/** Segmented control (Mới 6 · Đang xử lý 3 · Xong · Tất cả). */
export function Segmented({ options, value, onChange, height = 38, style }) {
  return (
    <div
      role="tablist"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${options.length},auto)`,
        border: "1px solid var(--bn-hairline)",
        borderRadius: 10,
        overflow: "hidden",
        background: "#fff",
        ...style,
      }}
    >
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange?.(o.value)}
            style={{
              height,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 13.5,
              background: on ? "var(--bn-clay)" : "#fff",
              color: on ? "#fff" : "var(--bn-ink)",
              fontWeight: on ? 600 : 400,
              borderLeft: i ? "1px solid var(--bn-hairline)" : 0,
              whiteSpace: "nowrap",
            }}
          >
            {o.label}
            {/* Always present (even empty) so the 6px gap matches the frames. */}
            <span style={{ fontFamily: "var(--bn-mono)", fontSize: 11 }}>{o.count ?? ""}</span>
          </button>
        );
      })}
    </div>
  );
}
