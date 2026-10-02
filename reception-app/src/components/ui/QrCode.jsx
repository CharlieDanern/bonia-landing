import React, { useMemo } from "react";
import { qrMatrix } from "../../lib/qr.js";

// Real QR drawn as the span grid the frames use (box = outer size incl.
// padding; hairline border, radius 12). Short payloads are 25 × 25.
export function QrCode({ value, size = 200, padding = 12, border = true, style, label }) {
  const { size: n, cells } = useMemo(() => qrMatrix(value), [value]);
  return (
    <div
      role="img"
      aria-label={label || "Mã QR"}
      style={{
        width: size,
        height: size,
        padding,
        border: border ? "1px solid var(--bn-hairline)" : 0,
        borderRadius: 12,
        background: "#fff",
        display: "grid",
        gridTemplateColumns: `repeat(${n},1fr)`,
        gridTemplateRows: `repeat(${n},1fr)`,
        flex: "none",
        ...style,
      }}
    >
      {Array.from(cells, (on, i) => (
        <span key={i} style={{ background: on ? "var(--bn-ink)" : "transparent" }} />
      ))}
    </div>
  );
}
