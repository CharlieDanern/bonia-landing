import React from "react";

// Switch (README): 40 × 24 (md) or 48 × 28 (lg), knob white, 3px inset.
// On = clay, knob right · Off = hairline, knob left.
const SIZES = {
  md: { w: 40, h: 24, knob: 18 },
  lg: { w: 48, h: 28, knob: 22 },
};

export function Toggle({ on = false, onChange, size = "md", label, disabled = false, style }) {
  const s = SIZES[size] || SIZES.md;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      className="tt-toggle"
      onClick={(e) => {
        e.stopPropagation();
        onChange?.(!on);
      }}
      style={{ width: s.w, height: s.h, ...style }}
    >
      <span className="tt-toggle__knob" style={{ width: s.knob, height: s.knob, left: on ? s.w - s.knob - 3 : 3 }} />
    </button>
  );
}

/** Label + switch row ("Không nhận khách theo giờ sau 20:00"). */
export function ToggleRow({ label, on, onChange, size = "md", labelStyle, style, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, ...style }}>
      <span style={{ fontSize: 14, fontWeight: 500, ...labelStyle }}>{label}</span>
      {children}
      <Toggle on={on} onChange={onChange} size={size} label={typeof label === "string" ? label : undefined} />
    </div>
  );
}
