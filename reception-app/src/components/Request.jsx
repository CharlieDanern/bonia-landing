import React from "react";
import { title as titleOf } from "../data/sample.js";

// TT3 Request Card + TT3 Request Detail (handoff 13). A request shows what the
// caller wants (Bonia's fields), what Bonia promised, and two actions:
// Sao chép (paste into any channel) and Đã xử lý ("I handled it").

const MONO = "'JetBrains Mono', monospace";
export const telOf = (n) => `tel:${String(n).replace(/\s/g, "")}`;

const pill = { fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.1em", padding: "3px 7px", borderRadius: 9, whiteSpace: "nowrap" };
export const UrgentPill = ({ style }) => <span style={{ ...pill, background: "#F6E7E1", color: "#A0412D", ...style }}>GẤP</span>;
export const TypePill = ({ children, style }) => (
  <span style={{ ...pill, border: "1px solid #D9D0BF", color: "#4A4239", textTransform: "uppercase", ...style }}>{children}</span>
);

/**
 * r: a request; flash: just filed (warm) · selected: open in the panel ·
 * actions: false in Thử Bonia's "Yêu cầu Bonia sẽ ghi".
 */
export function RequestCard({ r, flash = false, selected = false, actions = true, copied = false, onOpen, onCopy, onDone, number = r.number, tel = true }) {
  const bg = flash ? (r.urgent ? "#F6E2D9" : "#F6E6CF") : "#FFFFFF";
  const border = selected ? "#7B4A2D" : r.urgent ? "#EBCFC4" : "#D9D0BF";
  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn?.();
  };
  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={onOpen ? (e) => { if (e.key === "Enter") onOpen(); } : undefined}
      style={{ padding: "12px 14px", borderRadius: 12, background: bg, border: `1px solid ${border}`, display: "flex", flexDirection: "column", gap: 7, cursor: onOpen ? "pointer" : "default", color: "#1F1B16", transition: "background-color 1.2s ease, border-color 200ms ease", flex: "none" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{titleOf(r)}</span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: "#6E6255", flex: "none" }}>{r.at}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {r.urgent && <UrgentPill />}
        <TypePill>{r.type}</TypePill>
        {tel ? (
          <a href={telOf(number)} onClick={(e) => e.stopPropagation()} style={{ fontFamily: MONO, fontSize: 12, color: "#4A4239", marginLeft: 2 }}>{number}</a>
        ) : (
          <span style={{ fontFamily: MONO, fontSize: 12, color: "#4A4239", marginLeft: 2 }}>{number}</span>
        )}
      </div>
      {r.fields.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: "3px 12px", fontSize: 13, lineHeight: 1.4 }}>
          {r.fields.map(([k, v]) => (
            <React.Fragment key={k}>
              <span style={{ color: "#6E6255" }}>{k}</span>
              <span>{v}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      {r.said && <span style={{ fontSize: 12.5, color: "#4A4239", lineHeight: 1.4 }}>Bonia đã nói: “{r.said}”</span>}
      {actions && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, paddingTop: 2 }}>
          <button type="button" className="b-ghost" onClick={stop(onCopy)} style={{ height: 36, minWidth: 44, padding: "0 14px", borderRadius: 18, fontSize: 13, whiteSpace: "nowrap" }}>{copied ? "Đã chép" : "Sao chép"}</button>
          <button type="button" className="b-primary" onClick={stop(onDone)} style={{ height: 36, padding: "0 14px", borderRadius: 18, fontSize: 13, whiteSpace: "nowrap" }}>Đã xử lý</button>
        </div>
      )}
    </div>
  );
}

export function Bubble({ who, text, urgent = false, op = 1, size = "sm" }) {
  const B = who === "B";
  const kb = urgent ? ["#F6E3DB", "#EBCFC4"] : ["#EFE4D6", "#E4D5C1"];
  const big = size === "lg";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: B ? "flex-end" : "flex-start", gap: big ? 3 : 2, flex: "none" }}>
      <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", color: "#6E6255" }}>{B ? "BONIA" : "KHÁCH"}</span>
      <div style={{ maxWidth: big ? "88%" : "86%", padding: big ? "9px 13px" : "8px 12px", borderRadius: big ? 14 : 13, fontSize: big ? 14 : 13.5, lineHeight: big ? 1.5 : 1.45, background: B ? kb[0] : "#FFFFFF", border: `1px solid ${B ? kb[1] : "#D9D0BF"}`, opacity: op }}>{text}</div>
    </div>
  );
}

/** The full request: what Bonia recorded, what it said, the recording, the transcript. */
export function RequestDetail({ r, when, radius = 18, copied, onClose, onCopy, onDone }) {
  if (!r) return <div style={{ width: "100%", height: "100%", background: "#fff", border: "1px solid #D9D0BF", borderRadius: radius }} />;
  const open = r.status === "open";
  const headBg = r.urgent ? "#F6E7E1" : open ? "#FBF5EC" : "#F3F3EC";
  const statusLine = r.status === "auto" ? "✓ Bonia tự xong" : `✓ Đã xử lý · ${r.doneBy} ${r.doneAt}`;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#fff", border: "1px solid #D9D0BF", borderRadius: radius, overflow: "hidden", color: "#1F1B16" }}>
      <div style={{ padding: "14px 16px 14px 18px", display: "flex", flexDirection: "column", gap: 8, background: headBg, borderBottom: "1px solid #EFE9DD", flex: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {r.urgent && <UrgentPill />}
            <TypePill style={{ background: "#fff" }}>{r.type}</TypePill>
            <span style={{ fontFamily: MONO, fontSize: 11, color: "#6E6255" }}>{when}</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="h-line" style={{ width: 44, height: 44, margin: "-8px -8px -8px 0", borderRadius: 22, fontSize: 16, color: "#4A4239", textAlign: "center" }}>✕</button>
        </div>
        <span style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.25 }}>{titleOf(r)}</span>
        <a href={telOf(r.number)} style={{ fontFamily: MONO, fontSize: 14, color: "#7B4A2D", width: "max-content" }}>{r.number}</a>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10, borderBottom: "1px solid #EFE9DD" }}>
          <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.18em", color: "#6E6255" }}>BONIA ĐÃ GHI</span>
          <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: "6px 14px", fontSize: 14, lineHeight: 1.45 }}>
            {r.fields.map(([k, v]) => (
              <React.Fragment key={k}>
                <span style={{ color: "#6E6255" }}>{k}</span>
                <span style={{ fontWeight: 500 }}>{v}</span>
              </React.Fragment>
            ))}
          </div>
          {r.said && (
            <div style={{ padding: "9px 12px", borderRadius: 10, background: "#FAF7F1", fontSize: 13.5, lineHeight: 1.45, color: "#4A4239" }}>
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", color: "#6E6255", display: "block", marginBottom: 3 }}>BONIA ĐÃ NÓI VỚI KHÁCH</span>
              “{r.said}”
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderBottom: "1px solid #EFE9DD" }}>
          <span style={{ width: 32, height: 32, borderRadius: 16, background: "#7B4A2D", color: "#fff", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>▶</span>
          <span style={{ fontSize: 13, color: "#4A4239" }}>Ghi âm</span>
          <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 12, color: "#6E6255" }}>{r.len}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 16px" }}>
          {r.transcript.map(([w, text], i) => <Bubble key={i} who={w} text={text} urgent={r.urgent} />)}
        </div>
      </div>
      <div style={{ padding: "12px 16px", borderTop: "1px solid #EFE9DD", flex: "none" }}>
        {open ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 8 }}>
            <button type="button" className="b-ghost" onClick={onCopy} style={{ height: 48, borderRadius: 24, fontSize: 14.5, textAlign: "center" }}>{copied ? "Đã chép" : "Sao chép"}</button>
            <button type="button" className="b-primary" onClick={onDone} style={{ height: 48, borderRadius: 24, fontSize: 14.5, textAlign: "center" }}>Đã xử lý</button>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13.5, color: "#4A6B3A" }}>{statusLine}</span>
            <button type="button" className="b-ghost" onClick={onCopy} style={{ height: 44, padding: "0 16px", borderRadius: 22, fontSize: 13.5 }}>{copied ? "Đã chép" : "Sao chép"}</button>
          </div>
        )}
      </div>
    </div>
  );
}
