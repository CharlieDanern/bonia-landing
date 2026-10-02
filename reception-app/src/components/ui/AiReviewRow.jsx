import React, { useState } from "react";
import { SourceChip } from "./SourceChip.jsx";

// One fact Bonia found (README "AI review row"): white, radius 10, padding
// 12 16, grid 170px 1fr auto. Unconfirmed = 1px dashed #C9BCA5 with
// Đúng (clay) · Sửa · Bỏ; confirmed = solid hairline + "✓ ĐÚNG" in green.
const mini = {
  height: 32,
  padding: "0 12px",
  borderRadius: 16,
  fontSize: 13,
  display: "flex",
  alignItems: "center",
  whiteSpace: "nowrap",
  flex: "none",
};

export function AiReviewRow({
  label,
  value,
  source,
  mono = false,
  confirmed = false,
  onConfirm,
  onEdit, // (newValue) → void; omitted = no Sửa button
  onRemove,
  style,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(typeof value === "string" ? value : "");

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "170px 1fr auto",
        gap: 16,
        alignItems: "center",
        padding: "12px 16px",
        background: "#fff",
        border: confirmed ? "1px solid var(--bn-hairline)" : "1px dashed var(--bn-dashed)",
        borderRadius: 10,
        ...style,
      }}
    >
      <span style={{ fontSize: 13, color: "var(--bn-muted)" }}>{label}</span>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onEdit?.(draft);
              setEditing(false);
            }
            if (e.key === "Escape") setEditing(false);
          }}
          style={{
            height: 36,
            border: "2px solid var(--bn-clay)",
            borderRadius: 8,
            padding: "0 10px",
            fontSize: 15,
            fontFamily: mono ? "var(--bn-mono)" : "var(--bn-sans)",
            outline: 0,
            minWidth: 0,
          }}
        />
      ) : (
        <span style={{ fontSize: 15, fontFamily: mono ? "var(--bn-mono)" : undefined }}>
          {value}
          {source && <SourceChip inline>{source}</SourceChip>}
        </span>
      )}
      {confirmed && !editing ? (
        <span style={{ fontFamily: "var(--bn-mono)", fontSize: 10.5, letterSpacing: "0.12em", color: "var(--bn-ok)" }}>
          ✓ ĐÚNG
        </span>
      ) : editing ? (
        <span style={{ display: "flex", gap: 4 }}>
          <button
            type="button"
            className="tt-chip"
            style={{ ...mini, background: "var(--bn-clay)", color: "#fff" }}
            onClick={() => {
              onEdit?.(draft);
              setEditing(false);
            }}
          >
            Lưu
          </button>
          <button type="button" className="tt-chip" style={{ ...mini, border: "1px solid var(--bn-hairline)" }} onClick={() => setEditing(false)}>
            Hủy
          </button>
        </span>
      ) : (
        <span style={{ display: "flex", gap: 4 }}>
          <button type="button" className="tt-chip" style={{ ...mini, background: "var(--bn-clay)", color: "#fff" }} onClick={onConfirm}>
            Đúng
          </button>
          {onEdit !== null && (
            <button
              type="button"
              className="tt-chip"
              style={{ ...mini, border: "1px solid var(--bn-hairline)" }}
              onClick={() => setEditing(true)}
            >
              Sửa
            </button>
          )}
          <button
            type="button"
            className="tt-chip"
            style={{ ...mini, border: "1px solid var(--bn-hairline)", color: "var(--bn-muted)" }}
            onClick={onRemove}
          >
            Bỏ
          </button>
        </span>
      )}
    </div>
  );
}
