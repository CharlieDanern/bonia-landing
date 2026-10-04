import React from "react";
import { SCRIPTS } from "../data/sample.js";

// TT3 Live Call Card (handoff 13) and the view-model of a live call: the
// transcript typing out, "Bonia đã hiểu" filling in, what Bonia is doing, and
// the one action the desk has: Nghe máy (the logged-in phone rings).

const MONO = "'JetBrains Mono', monospace";

/** Seconds into the call (stops when the desk takes it or the phone rings). */
function elapsedOf(c, now) {
  const sc = SCRIPTS[c.kind];
  const stop = c.ringAt || c.handedAt;
  const raw = ((c.endAt && !stop ? Math.min(now, c.endAt) : now) - c.start) / 1000;
  return Math.min(raw, stop ? (stop - c.start) / 1000 : sc.end);
}

export function callVm(c, now, listen) {
  const sc = SCRIPTS[c.kind];
  const raw = ((c.endAt && !c.handedAt ? Math.min(now, c.endAt) : now) - c.start) / 1000;
  const el = elapsedOf(c, now);
  let phase = "live";
  if (c.endAt) {
    const d = now - c.endAt;
    phase = d < 1600 ? "summary" : d < 2300 ? "fly" : "gone";
  }
  const L = sc.lines.map(([t, w, text], i) => {
    const nx = sc.lines[i + 1] ? sc.lines[i + 1][0] : sc.end;
    return { t, w, text, rate: Math.max(16, text.length / Math.max(0.6, nx - t - 0.5)) };
  });
  const shown = L.filter((l) => l.t <= el);
  const frozen = c.ringAt || c.handedAt;
  const bubbles = shown.map((l) => {
    const n = Math.floor((el - l.t) * l.rate);
    const done = n >= l.text.length || frozen;
    return { w: l.w, text: done ? l.text : `${l.text.slice(0, n)}▍` };
  });
  const cur = shown[shown.length - 1];
  const speaking = cur && el < cur.t + cur.text.length / cur.rate + 0.3;
  let mood = "idle";
  if (c.handedAt || c.ringAt) mood = "handed";
  else if (el >= sc.writing[0] && el < sc.writing[1]) mood = "writing";
  else if (cur) mood = speaking ? (cur.w === "B" ? "bonia" : "guest") : cur.w === "B" ? "guest" : "bonia";
  const ringing = !!c.ringAt && !c.handedAt;
  let activity;
  let actColor = "#4A4239";
  if (c.handedAt) activity = "Bonia đã nhường máy · lời thoại phía trên vẫn giữ";
  else if (ringing) activity = "Đang gọi tới điện thoại quầy";
  else if (el >= sc.notifyAt) {
    activity = "Đã báo quầy";
    actColor = sc.urgent ? "#A0412D" : "#4A6B3A";
  } else if (mood === "writing") activity = "Bonia đang ghi yêu cầu";
  else if (raw < 1.2) activity = "Bonia vừa nhấc máy";
  else activity = cur && cur.w === "K" && speaking ? "Khách đang nói" : "Bonia đang trả lời";
  const fields = sc.fields.map(([k, t, v]) => {
    const ok = el >= t;
    return { k, v: ok ? v : "…", c: ok ? (v === "Gấp" ? "#A0412D" : "#1F1B16") : "#6E6255", w: ok ? 500 : 400 };
  });
  const allIn = sc.fields.every((f) => el >= f[1]);
  const title = sc.name && el >= sc.nameAt ? sc.name : sc.room && el >= sc.roomAt ? `Phòng ${sc.room}` : sc.number;
  const tsec = Math.max(0, Math.floor(raw));
  return {
    id: c.id, slot: c.slot, urgent: sc.urgent, phase, mood, bubbles, fields, activity, actColor, ringing,
    handed: !!c.handedAt, canListen: !c.ringAt && !c.handedAt, listen: () => listen(c.id),
    statusText: c.handedAt ? "Bạn đang nói chuyện · Bonia đã nhường máy" : ringing ? "Đang chuyển máy" : sc.urgent ? "Gấp · Bonia đang nghe máy" : "Bonia đang nghe máy",
    accent: sc.urgent ? "#A0412D" : c.handedAt ? "#4A4239" : "#4A6B3A",
    headBg: sc.urgent ? "#F6E7E1" : c.handedAt ? "#F2EEE6" : "#F1F3EA",
    headLine: sc.urgent ? "#EBCFC4" : "#E2E6D6",
    border: sc.urgent ? "#EBCFC4" : "#D9D0BF",
    typeLabel: (sc.urgent ? "GẤP · " : "") + sc.type.toUpperCase(),
    typeBg: sc.urgent ? "#F6E7E1" : "transparent", typeColor: sc.urgent ? "#A0412D" : "#4A4239", typeBorder: sc.urgent ? "#F6E7E1" : "#D9D0BF",
    uStyle: allIn ? "solid" : "dashed", uBorder: allIn ? "#D9D0BF" : "#C9BCA5",
    timer: `${Math.floor(tsec / 60)}:${String(tsec % 60).padStart(2, "0")}`,
    title, sub: title === sc.number ? "" : sc.number,
    isSummary: phase === "summary" || phase === "fly", isFull: phase === "live",
    summary: `${title} · ${sc.type} · đã ghi vào Cần xử lý`,
    otherText: sc.urgent ? `Gấp · ${title}` : title,
  };
}

export function LiveCallCard({ c, radius = 18, hideTranscript = false }) {
  if (!c) return null;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#fff", border: `1px solid ${c.border}`, borderRadius: radius, overflow: "hidden", color: "#1F1B16" }}>
      {c.isSummary && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "0 18px" }}>
          <span style={{ width: 28, height: 28, borderRadius: 14, border: "1px solid #4A6B3A", color: "#4A6B3A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flex: "none" }}>✓</span>
          <span style={{ fontSize: 14.5, lineHeight: 1.45 }}>{c.summary}</span>
        </div>
      )}
      {c.isFull && (
        <>
          <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 6, background: c.headBg, borderBottom: `1px solid ${c.headLine}`, flex: "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: c.accent, whiteSpace: "nowrap", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                <span style={{ width: 7, height: 7, borderRadius: 4, background: c.accent, flex: "none" }} />
                {c.statusText}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 13, color: "#4A4239" }}>{c.timer}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 20, fontWeight: 600 }}>{c.title}</span>
              {c.sub && <span style={{ fontFamily: MONO, fontSize: 13, color: "#4A4239" }}>{c.sub}</span>}
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: hideTranscript ? "none" : "flex", flexDirection: "column", justifyContent: "flex-end", gap: 8, padding: "12px 16px" }}>
            {c.bubbles.map((b, i) => {
              const B = b.w === "B";
              const kb = c.urgent ? ["#F6E3DB", "#EBCFC4"] : ["#EFE4D6", "#E4D5C1"];
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: B ? "flex-end" : "flex-start", gap: 2, flex: "none" }}>
                  <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", color: "#6E6255" }}>{B ? "BONIA" : "KHÁCH"}</span>
                  <div style={{ maxWidth: "88%", padding: "8px 12px", borderRadius: 13, fontSize: 13.5, lineHeight: 1.45, background: B ? kb[0] : "#FFFFFF", border: `1px solid ${B ? kb[1] : "#D9D0BF"}` }}>{b.text}</div>
                </div>
              );
            })}
          </div>
          {hideTranscript && <div style={{ flex: 1 }} />}
          <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 10, flex: "none" }}>
            <div style={{ padding: "12px 14px", borderRadius: 12, background: "#FAF7F1", border: `1px ${c.uStyle} ${c.uBorder}`, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.18em", color: "#6E6255" }}>BONIA ĐÃ HIỂU</span>
                <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.1em", padding: "3px 7px", borderRadius: 9, whiteSpace: "nowrap", background: c.typeBg, color: c.typeColor, border: `1px solid ${c.typeBorder}` }}>{c.typeLabel}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "5px 12px", fontSize: 13 }}>
                {c.fields.map((f) => (
                  <React.Fragment key={f.k}>
                    <span style={{ color: "#6E6255" }}>{f.k}</span>
                    <span style={{ color: f.c, fontWeight: f.w }}>{f.v}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: c.actColor }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: c.actColor, flex: "none" }} />
              {c.activity}
            </div>
            {c.canListen && (
              <button type="button" className="b-primary" onClick={c.listen} style={{ height: 48, borderRadius: 24, fontSize: 15, textAlign: "center" }}>Nghe máy</button>
            )}
            {c.ringing && (
              <div style={{ height: 48, borderRadius: 24, border: "1px dashed #7B4A2D", color: "#7B4A2D", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14.5 }}>Điện thoại quầy đang đổ chuông…</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
