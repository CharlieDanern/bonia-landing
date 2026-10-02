import React from "react";

// Status stepper (lost item 3.3 H): "✓ Mới — Đang tìm — Tìm thấy / Không
// thấy — Đã trả khách". done = hairline + ✓ · current = clay fill ·
// future = dashed muted. Steps can be clickable (onStep).
export function StepPills({ steps = [], onStep, style }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, flexWrap: "wrap", ...style }}>
      {steps.map((s, i) => {
        const css =
          s.state === "current"
            ? { background: "var(--bn-clay)", color: "#fff", fontWeight: 500, border: "1px solid var(--bn-clay)" }
            : s.state === "done"
              ? { border: "1px solid var(--bn-hairline)", color: "var(--bn-muted)" }
              : { border: "1px dashed var(--bn-dashed)", color: "var(--bn-muted)" };
        const El = onStep && s.state === "future" ? "button" : "span";
        return (
          <React.Fragment key={s.label}>
            {i > 0 && <span style={{ width: 16, height: 1, background: "var(--bn-hairline)", flex: "none" }} />}
            <El
              type={El === "button" ? "button" : undefined}
              onClick={El === "button" ? () => onStep(s, i) : undefined}
              aria-current={s.state === "current" ? "step" : undefined}
              style={{ padding: "6px 10px", borderRadius: 14, whiteSpace: "nowrap", ...css }}
            >
              {s.state === "done" ? `✓ ${s.label}` : s.label}
            </El>
          </React.Fragment>
        );
      })}
    </div>
  );
}
