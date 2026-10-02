import React, { useState } from "react";
import { SourceChip } from "./SourceChip.jsx";
import { groupVnd, parseVnd } from "../../lib/format.js";

// Price confirm row (README): name/meta · BOOKING.COM 690.000đ · [input] đ ·
// status. A price is confirmed only here, one room type at a time; the
// card's "Đúng hết" never confirms prices.
export function PriceConfirmRow({
  name,
  meta,
  source = "BOOKING.COM",
  otaPrice,
  value, // number
  confirmed = false,
  onChange, // (number|null) → void
  onConfirm, // () → void (Enter / blur after an edit)
  focused = false,
  style,
}) {
  const [hasFocus, setHasFocus] = useState(false);
  const border = hasFocus || focused ? "2px solid var(--bn-clay)" : confirmed ? "1px solid var(--bn-hairline)" : "1px dashed var(--bn-dashed)";
  const padX = hasFocus || focused ? 11 : 12;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 200px 220px 110px",
        gap: 16,
        alignItems: "center",
        minHeight: 68,
        borderBottom: "1px solid var(--bn-hairline)",
        ...style,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontSize: 15, fontWeight: 500 }}>{name}</span>
        {meta && <span style={{ fontSize: 12.5, color: "var(--bn-muted)" }}>{meta}</span>}
      </div>
      <span style={{ fontSize: 13, color: "var(--bn-muted)" }}>
        <SourceChip>{source}</SourceChip> {otaPrice != null ? `${groupVnd(otaPrice)}đ` : ""}
      </span>
      <label
        style={{
          height: 44,
          border,
          borderRadius: 10,
          background: "#fff",
          padding: `0 ${padX}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <input
          value={value == null ? "" : groupVnd(value)}
          inputMode="numeric"
          aria-label={`Giá bán qua điện thoại · ${name}`}
          onChange={(e) => onChange?.(parseVnd(e.target.value))}
          onFocus={() => setHasFocus(true)}
          onBlur={() => {
            setHasFocus(false);
            onConfirm?.();
          }}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          style={{
            border: 0,
            outline: 0,
            background: "transparent",
            fontFamily: "var(--bn-mono)",
            fontSize: 15,
            minWidth: 0,
            flex: 1,
            padding: 0,
          }}
        />
        <span style={{ color: "var(--bn-muted)", fontSize: 13 }}>đ</span>
      </label>
      <span
        style={{
          fontFamily: "var(--bn-mono)",
          fontSize: 10.5,
          letterSpacing: "0.12em",
          color: confirmed ? "var(--bn-ok)" : "var(--bn-urgent)",
        }}
      >
        {confirmed ? "✓ ĐÃ XÁC NHẬN" : "CHƯA XÁC NHẬN"}
      </span>
    </div>
  );
}
