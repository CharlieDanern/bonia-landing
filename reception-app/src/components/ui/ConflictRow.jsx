import React from "react";
import { SourceChip } from "./SourceChip.jsx";

// Two sources disagree (README "Conflict row"): urgent sentence + one tile
// per source (mono 20 value + source chip); the chosen tile gets 2px clay.
export function ConflictRow({
  label,
  options = [], // [{ value, source }]
  selected = null,
  onSelect,
  message = "Hai nguồn ghi khác nhau. Chọn một, hoặc sửa.",
  style,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "14px 16px",
        background: "#fff",
        border: "1px dashed var(--bn-dashed)",
        borderRadius: 10,
        ...style,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "170px 1fr", gap: 16, alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "var(--bn-muted)" }}>{label}</span>
        <span style={{ fontSize: 14, color: "var(--bn-urgent)", fontWeight: 500 }}>{message}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `170px repeat(${options.length},1fr)`, gap: 10 }} role="radiogroup">
        <span />
        {options.map((o, i) => {
          const on = selected === i;
          return (
            <button
              key={`${o.value}-${o.source}`}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onSelect?.(i)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                border: on ? "2px solid var(--bn-clay)" : "1px solid var(--bn-hairline)",
                borderRadius: 10,
                background: "#fff",
                textAlign: "left",
              }}
            >
              <span style={{ fontFamily: "var(--bn-mono)", fontSize: 20 }}>{o.value}</span>
              {o.source && <SourceChip>{o.source}</SourceChip>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
