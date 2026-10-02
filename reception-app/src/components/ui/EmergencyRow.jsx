import React, { useState } from "react";

// Emergency row (README): grid 200 92 1fr 150: situation · number in a
// locked tile ("114 · khóa", system-held) or "không số" · the sentence
// Bonia says (editable) · who is notified.
export function EmergencyRow({ label, number, say, who, onSayChange, first = false, style }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(say);
  const locked = !!number;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "200px 92px minmax(0,1fr) 150px",
        gap: 12,
        alignItems: "center",
        minHeight: 54,
        padding: "6px 16px",
        borderTop: first ? 0 : "1px solid var(--bn-hairline-2)",
        ...style,
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
      <span
        title={locked ? "Số do hệ thống giữ" : undefined}
        style={{
          justifySelf: "start",
          display: "flex",
          alignItems: "center",
          gap: 6,
          height: 30,
          padding: "0 10px",
          borderRadius: 8,
          background: locked ? "var(--bn-cream-2)" : "#FFFFFF",
          border: "1px solid var(--bn-hairline)",
          fontFamily: "var(--bn-mono)",
          fontSize: 14,
          whiteSpace: "nowrap",
        }}
      >
        {locked ? `${number} · khóa` : "không số"}
      </span>
      {editing ? (
        <textarea
          autoFocus
          value={draft}
          rows={2}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setEditing(false);
            if (draft !== say) onSayChange?.(draft);
          }}
          style={{
            fontSize: 13,
            lineHeight: 1.45,
            border: "2px solid var(--bn-clay)",
            borderRadius: 8,
            padding: "4px 8px",
            resize: "none",
            outline: 0,
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => onSayChange && setEditing(true)}
          style={{ fontSize: 13, color: "var(--bn-ink-2)", lineHeight: 1.45, textAlign: "left", cursor: onSayChange ? "text" : "default" }}
        >
          “{say}”
        </button>
      )}
      <span style={{ fontSize: 12.5, color: "var(--bn-ink-2)" }}>{who}</span>
    </div>
  );
}
