import React from "react";

// "Trả lời · Kiểm tra · Ghi yêu cầu · Báo ngay": independent toggles.
// On = clay fill, white, "✓ " · Off = white, hairline, muted.
// size "matrix" (h26, §04 table) or "form" (h34).
export const PERMISSIONS = [
  { id: "answer", label: "Trả lời" },
  { id: "check", label: "Kiểm tra" },
  { id: "record", label: "Ghi yêu cầu" },
  { id: "notify", label: "Báo ngay" },
];

export function PermissionChip({ on, label, onClick, size = "form", style }) {
  const matrix = size === "matrix";
  return (
    <button
      type="button"
      className="tt-chip"
      aria-pressed={on}
      onClick={onClick}
      style={{
        height: matrix ? 26 : 34,
        padding: matrix ? "0 9px" : "0 12px",
        borderRadius: matrix ? 13 : 17,
        fontSize: matrix ? 11.5 : 13,
        background: on ? "var(--bn-clay)" : "#fff",
        color: on ? "#fff" : "var(--bn-muted)",
        border: `1px solid ${on ? "var(--bn-clay)" : "var(--bn-hairline)"}`,
        justifySelf: "start",
        ...style,
      }}
    >
      {on ? `✓ ${label}` : label}
    </button>
  );
}

/**
 * value: { answer, check, record, notify } booleans.
 * only: which permission ids to show (the §04 matrix shows three).
 * asColumns: render bare chips (for grid cells) instead of a flex row.
 */
export function PermissionChips({ value = {}, onChange, only, size = "form", asColumns = false, style }) {
  const list = only ? PERMISSIONS.filter((p) => only.includes(p.id)) : PERMISSIONS;
  const chips = list.map((p) => (
    <PermissionChip
      key={p.id}
      on={!!value[p.id]}
      label={p.label}
      size={size}
      onClick={() => onChange?.({ ...value, [p.id]: !value[p.id] })}
    />
  ));
  if (asColumns) return <>{chips}</>;
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 6, ...style }}>{chips}</div>;
}
