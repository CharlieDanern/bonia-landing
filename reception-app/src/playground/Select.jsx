import React, { useEffect, useId, useRef, useState } from "react";
import { EASE } from "../ui.js";

// A dropdown in the app's look (founder 2026-10-13: "put ngành in a drop list (make it nice). same for giọng"): the
// pick on a white field with its hint, the list in a card below. Mouse, touch and keyboard (↑ ↓ Enter Esc).

/** options: [{ value, label, hint? }]. */
export function Select({ d, value, options, onChange, disabled = false, label }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef(null);
  const list = useRef(null);
  const id = useId();
  const cur = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("touchstart", away);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("touchstart", away); };
  }, [open]);
  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const show = () => { setActive(Math.max(0, options.findIndex((o) => o.value === value))); setOpen(true); };
  const pick = (o) => { setOpen(false); if (o.value !== value) onChange(o.value); };
  const key = (e) => {
    if (disabled) return;
    if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); show(); return; }
    if (!open) return;
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(options.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(options[active]); }
    else if (e.key === "Tab") setOpen(false);
  };

  const hinted = options.some((o) => o.hint);
  return (
    <div ref={box} style={{ position: "relative" }}>
      <button
        type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} aria-controls={id} aria-label={label}
        onClick={() => (open ? setOpen(false) : show())} onKeyDown={key}
        style={{
          width: "100%", minHeight: hinted ? d.input + 14 : d.input, display: "flex", alignItems: "center", gap: 10, padding: "6px 12px",
          border: `1px solid ${open ? "#7B4A2D" : "#D9D0BF"}`, borderRadius: 10, background: "#fff", textAlign: "left", color: "#1F1B16",
          boxShadow: open ? "0 0 0 3px rgba(123,74,45,0.10)" : "none", transition: "border-color 150ms ease, box-shadow 150ms ease", opacity: disabled ? 0.6 : 1,
        }}
      >
        <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ fontSize: d.fs.body + 0.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cur?.label}</span>
          {cur?.hint && <span style={{ fontSize: d.fs.tiny, color: "#6E6255", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cur.hint}</span>}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style={{ flex: "none", transform: open ? "rotate(180deg)" : "none", transition: `transform 200ms ${EASE}` }}>
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="#7B4A2D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div
        ref={list} id={id} role="listbox" aria-label={label}
        style={{
          position: "absolute", left: 0, right: 0, top: "calc(100% + 6px)", zIndex: 30, maxHeight: 340, overflowY: "auto", padding: 4,
          background: "#fff", border: "1px solid #E4DCCB", borderRadius: 12, boxShadow: "0 12px 32px rgba(31,27,22,0.16)",
          opacity: open ? 1 : 0, transform: open ? "translateY(0)" : "translateY(-4px)", pointerEvents: open ? "auto" : "none",
          visibility: open ? "visible" : "hidden", transition: `opacity 140ms ease, transform 180ms ${EASE}, visibility 0s ${open ? "0s" : "180ms"}`,
        }}
      >
        {options.map((o, i) => {
          const on = o.value === value;
          return (
            <div
              key={o.value} role="option" aria-selected={on}
              onMouseEnter={() => setActive(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(o)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: hinted ? "8px 10px" : "7px 10px", borderRadius: 8, cursor: "pointer",
                background: i === active ? "#F7F3EC" : on ? "#FBF5EC" : "transparent",
              }}
            >
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: d.fs.body, fontWeight: on ? 600 : 500, color: on ? "#7B4A2D" : "#1F1B16" }}>{o.label}</span>
                {o.hint && <span style={{ fontSize: d.fs.tiny, color: "#6E6255", lineHeight: 1.35 }}>{o.hint}</span>}
              </span>
              <span aria-hidden="true" style={{ width: 14, flex: "none", color: "#7B4A2D", fontSize: 13 }}>{on ? "✓" : ""}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
