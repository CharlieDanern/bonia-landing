import React from "react";
import { title as titleOf } from "../data/sample.js";
import { useLayout } from "../layout.jsx";
import { MONO, dims } from "../ui.js";

// TT3 Request Card + TT3 Request Detail (handoff 13). A request shows who
// called, the type, and one plain summary of what they want (founder
// 2026-10-04: no fixed fields, no "Bonia đã nói"), plus two actions:
// Sao chép (paste into any channel) and Đã xử lý ("I handled it").

export const telOf = (n) => `tel:${String(n).replace(/\s/g, "")}`;

const pill = { fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.1em", padding: "2px 6px", borderRadius: 8, whiteSpace: "nowrap", lineHeight: 1.5 };
export const UrgentPill = ({ style }) => <span style={{ ...pill, background: "#F6E7E1", color: "#A0412D", ...style }}>GẤP</span>;
export const TypePill = ({ children, style }) => (
  <span style={{ ...pill, border: "1px solid #D9D0BF", color: "#4A4239", textTransform: "uppercase", ...style }}>{children}</span>
);

/**
 * r: a request · flash: just filed (warm) · selected: open in the panel ·
 * actions: false in Thử Bonia's "Yêu cầu Bonia sẽ ghi" · clamp: summary lines.
 */
export function RequestCard({ r, flash = false, selected = false, actions = true, copied = false, onOpen, onCopy, onDone, number = r.number, tel = true, clamp = 0, hoverActions = false }) {
  const { phone } = useLayout();
  const d = dims(phone);
  const bg = flash ? (r.urgent ? "#F6E2D9" : "#F6E6CF") : "#FFFFFF";
  const border = selected ? "#7B4A2D" : r.urgent ? "#EBCFC4" : "#E4DCCB";
  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn?.();
  };
  const numStyle = { fontFamily: MONO, fontSize: d.fs.tiny, color: "#6E6255" };
  // desktop Trực tiếp: small actions beside the number, shown on hover / when open
  const inline = actions && hoverActions && !phone;
  return (
    <div
      className={`tt-card${hoverActions && !phone ? " hov" : ""}${selected ? " sel" : ""}`}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={onOpen ? (e) => { if (e.key === "Enter") onOpen(); } : undefined}
      style={{ padding: phone ? "11px 13px" : "10px 12px", borderRadius: 10, background: bg, border: `1px solid ${border}`, display: "flex", flexDirection: "column", gap: 5, cursor: onOpen ? "pointer" : "default", color: "#1F1B16", transition: "background-color 1.2s ease, border-color 200ms ease", flex: "none" }}
    >
      {/* line 1: name + number · time; line 2: the tags (founder 2026-10-04) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: d.fs.title, fontWeight: 600, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{titleOf(r)}</span>
          {titleOf(r) !== number && (tel ? <a href={telOf(number)} onClick={(e) => e.stopPropagation()} style={{ ...numStyle, flex: "none" }}>{number}</a> : <span style={{ ...numStyle, flex: "none" }}>{number}</span>)}
        </span>
        <span style={{ fontFamily: MONO, fontSize: d.fs.tiny, color: "#6E6255", flex: "none" }}>{r.at}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", minHeight: inline ? 24 : undefined }}>
        {r.urgent && <UrgentPill />}
        <TypePill>{r.type}</TypePill>
        {inline && (
          <span className="tt-card-actions" style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            <button type="button" className="b-ghost" onClick={stop(onCopy)} style={{ height: 24, padding: "0 10px", borderRadius: 12, fontSize: 11, whiteSpace: "nowrap" }}>{copied ? "Đã chép" : "Sao chép"}</button>
            <button type="button" className="b-primary" onClick={stop(onDone)} style={{ height: 24, padding: "0 10px", borderRadius: 12, fontSize: 11, whiteSpace: "nowrap" }}>Đã xử lý</button>
          </span>
        )}
      </div>
      {r.summary && (
        <p style={{ margin: 0, fontSize: d.fs.body, lineHeight: 1.5, color: "#4A4239", ...(clamp ? { display: "-webkit-box", WebkitLineClamp: clamp, WebkitBoxOrient: "vertical", overflow: "hidden" } : {}) }}>{r.summary}</p>
      )}
      {actions && !inline && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, paddingTop: 2 }}>
          <button type="button" className="b-ghost" onClick={stop(onCopy)} style={{ height: d.btnSm, padding: "0 12px", borderRadius: d.btnSm / 2, fontSize: d.fs.small, whiteSpace: "nowrap" }}>{copied ? "Đã chép" : "Sao chép"}</button>
          <button type="button" className="b-primary" onClick={stop(onDone)} style={{ height: d.btnSm, padding: "0 12px", borderRadius: d.btnSm / 2, fontSize: d.fs.small, whiteSpace: "nowrap" }}>Đã xử lý</button>
        </div>
      )}
    </div>
  );
}

export function Bubble({ who, text, urgent = false, op = 1 }) {
  const { phone } = useLayout();
  const B = who === "B";
  const kb = urgent ? ["#F6E3DB", "#EBCFC4"] : ["#EFE4D6", "#E4D5C1"];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: B ? "flex-end" : "flex-start", gap: 2, flex: "none" }}>
      <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.14em", color: "#6E6255" }}>{B ? "BONIA" : "KHÁCH"}</span>
      <div style={{ maxWidth: "86%", padding: "6px 10px", borderRadius: 11, fontSize: phone ? 13 : 12.5, lineHeight: 1.45, background: B ? kb[0] : "#FFFFFF", border: `1px solid ${B ? kb[1] : "#D9D0BF"}`, opacity: op }}>{text}</div>
    </div>
  );
}

/** The full request: Bonia's summary, the recording, the transcript. */
export function RequestDetail({ r, when, radius = 14, copied, onClose, onCopy, onDone }) {
  const { phone } = useLayout();
  const d = dims(phone);
  if (!r) return <div style={{ width: "100%", height: "100%", background: "#fff", border: "1px solid #D9D0BF", borderRadius: radius }} />;
  const open = r.status === "open";
  const headBg = r.urgent ? "#F6E7E1" : open ? "#FBF5EC" : "#F3F3EC";
  const statusLine = r.status === "auto" ? "✓ Bonia tự xong" : `✓ Đã xử lý · ${r.doneBy} ${r.doneAt}`;
  const line = "1px solid #EFE9DD";
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#fff", border: "1px solid #D9D0BF", borderRadius: radius, overflow: "hidden", color: "#1F1B16" }}>
      <div style={{ padding: "10px 12px 12px 16px", display: "flex", flexDirection: "column", gap: 5, background: headBg, borderBottom: line, flex: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {r.urgent && <UrgentPill />}
            <TypePill style={{ background: "#fff" }}>{r.type}</TypePill>
            <span style={{ fontFamily: MONO, fontSize: d.fs.tiny, color: "#6E6255" }}>{when}</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="h-line" style={{ width: 36, height: 36, borderRadius: 18, fontSize: 14, color: "#4A4239", textAlign: "center" }}>✕</button>
        </div>
        <span style={{ fontSize: phone ? 19 : 18, fontWeight: 600, lineHeight: 1.25 }}>{titleOf(r)}</span>
        <a href={telOf(r.number)} style={{ fontFamily: MONO, fontSize: d.fs.small, color: "#7B4A2D", width: "max-content" }}>{r.number}</a>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6, borderBottom: line }}>
          <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.18em", color: "#6E6255" }}>BONIA ĐÃ GHI</span>
          <p style={{ margin: 0, fontSize: phone ? 14 : 13.5, lineHeight: 1.55 }}>{r.summary}</p>
        </div>
        {/* the demo's recording row; a real request has none here yet (the call's recording is in the app) */}
        {r.len && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderBottom: line }}>
            <span style={{ width: 26, height: 26, borderRadius: 13, background: "#7B4A2D", color: "#fff", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>▶</span>
            <span style={{ fontSize: d.fs.small, color: "#4A4239" }}>Ghi âm</span>
            <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: d.fs.tiny, color: "#6E6255" }}>{r.len}</span>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: "12px 14px" }}>
          {r.transcript.map(([w, text], i) => <Bubble key={i} who={w} text={text} urgent={r.urgent} />)}
        </div>
      </div>
      <div style={{ padding: "10px 14px", borderTop: line, flex: "none" }}>
        {open ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 8 }}>
            <button type="button" className="b-ghost" onClick={onCopy} style={{ height: d.btn, borderRadius: d.btn / 2, fontSize: d.fs.body, textAlign: "center" }}>{copied ? "Đã chép" : "Sao chép"}</button>
            <button type="button" className="b-primary" onClick={onDone} style={{ height: d.btn, borderRadius: d.btn / 2, fontSize: d.fs.body, textAlign: "center" }}>Đã xử lý</button>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: d.fs.small, color: "#4A6B3A" }}>{statusLine}</span>
            <button type="button" className="b-ghost" onClick={onCopy} style={{ height: d.btnSm, padding: "0 14px", borderRadius: d.btnSm / 2, fontSize: d.fs.small }}>{copied ? "Đã chép" : "Sao chép"}</button>
          </div>
        )}
      </div>
    </div>
  );
}
