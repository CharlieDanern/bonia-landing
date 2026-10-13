import React, { useEffect, useRef, useState } from "react";
import { playgroundRecordingUrl } from "../api.js";
import PlayGlyph from "../components/PlayGlyph.jsx";
import { MONO } from "../ui.js";

// The result card after a playground call (founder 2026-10-13, phase 3): what the business owner would get once the
// call is over, written from the whole call (voice agent src/demo/summary.js): the outcome, a summary, the details to
// act on, the next step, and the recording.

const eyebrow = { fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", color: "#6E6255" };
export const mmss = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
export const hhmm = (iso) => new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });
export const ddmm = (iso) => new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });

function Recording({ d, uuid }) {
  const [st, setSt] = useState("idle"); // idle | loading | ready | none
  const [playing, setPlaying] = useState(false);
  const audio = useRef(null);
  const url = useRef(null);
  useEffect(() => () => {
    audio.current?.pause();
    if (url.current) URL.revokeObjectURL(url.current);
  }, [uuid]);
  const toggle = async () => {
    if (st === "loading" || st === "none") return;
    try {
      if (!audio.current) {
        setSt("loading");
        url.current = await playgroundRecordingUrl(uuid);
        audio.current = new Audio(url.current);
        audio.current.onended = () => setPlaying(false);
        setSt("ready");
      }
      if (playing) { audio.current.pause(); setPlaying(false); } else { await audio.current.play(); setPlaying(true); }
    } catch {
      setSt("none");
      setPlaying(false);
    }
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <button type="button" onClick={toggle} disabled={st === "none"} aria-label={playing ? "Tạm dừng" : "Nghe lại cuộc gọi"}
        style={{ width: 26, height: 26, borderRadius: 13, background: st === "none" ? "#C9BCA5" : "#7B4A2D", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
        <PlayGlyph playing={playing} size={9} />
      </button>
      <span style={{ fontSize: d.fs.small, color: "#4A4239" }}>{st === "loading" ? "Đang tải ghi âm…" : st === "none" ? "Không còn ghi âm (giữ 7 ngày)" : "Nghe lại cuộc gọi"}</span>
    </div>
  );
}

/** result: { state: waiting | done | none, call? } — call: the backend's view (outcome, summary, details, next_step, …). */
export function ResultCard({ d, result, uuid }) {
  if (!result || result.state === "idle") return null;
  const box = { display: "flex", flexDirection: "column", gap: 7, padding: "11px 13px", borderRadius: 10, border: "1px solid #E4DCCB", background: "#FBF7F0", flex: "none" };
  if (result.state === "waiting") {
    return (
      <div style={box}>
        <span style={{ ...eyebrow, color: "#7B4A2D" }}>KẾT QUẢ CUỘC GỌI</span>
        <span style={{ fontSize: d.fs.small, color: "#6E6255" }}>Bonia đang viết thẻ kết quả cho chủ, vài giây…</span>
      </div>
    );
  }
  const c = result.call;
  if (!c || !c.outcome) {
    return (
      <div style={box}>
        <span style={eyebrow}>KẾT QUẢ CUỘC GỌI</span>
        <span style={{ fontSize: d.fs.small, color: "#6E6255", lineHeight: 1.5 }}>{c ? "Không có gì để tóm tắt: khách chưa nói gì." : "Chưa có thẻ kết quả cho cuộc gọi này."}</span>
        {c?.recording && <Recording d={d} uuid={uuid} />}
      </div>
    );
  }
  return (
    <div style={box}>
      <span style={eyebrow}>KẾT QUẢ CUỘC GỌI · CHỦ NHẬN ĐƯỢC</span>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: d.fs.small, fontWeight: 600, color: "#7B4A2D", padding: "2px 9px", borderRadius: 10, border: "1px solid #E4CDB4", background: "#fff" }}>{c.outcome}</span>
        {c.customer_name && <span style={{ fontSize: d.fs.body, fontWeight: 600, color: "#1F1B16" }}>{c.customer_name}</span>}
      </div>
      {c.summary && <p style={{ margin: 0, fontSize: d.fs.body, lineHeight: 1.5, color: "#1F1B16" }}>{c.summary}</p>}
      {c.details?.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: "3px 12px", fontSize: d.fs.small, lineHeight: 1.45 }}>
          {c.details.map((x, i) => (
            <React.Fragment key={i}>
              <span style={{ color: "#6E6255" }}>{x.label}</span>
              <span style={{ color: "#1F1B16" }}>{x.value}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      {c.next_step && <span style={{ fontSize: d.fs.small, color: "#4A6B3A", lineHeight: 1.45 }}>→ {c.next_step}</span>}
      {c.recording && <Recording d={d} uuid={uuid} />}
    </div>
  );
}

/** Cuộc gọi gần đây: the account's last calls; onOpen(uuid). */
export function RecentCalls({ d, calls, open, onOpen, max = 6 }) {
  if (!calls?.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
      <span style={{ ...eyebrow, paddingBottom: 4 }}>CUỘC GỌI GẦN ĐÂY</span>
      {calls.slice(0, max).map((c) => (
        <button key={c.call_uuid} type="button" onClick={() => onOpen(c.call_uuid)}
          style={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr) auto", gap: 8, alignItems: "center", padding: "7px 6px", borderTop: "1px solid #E4DCCB", background: open === c.call_uuid ? "#FFFFFF" : "transparent", textAlign: "left", borderRadius: 6 }}>
          <span style={{ display: "flex", flexDirection: "column", fontFamily: MONO, fontSize: 10, color: "#6E6255", lineHeight: 1.3 }}><span>{hhmm(c.started_at)}</span><span>{ddmm(c.started_at)}</span></span>
          <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
            <span style={{ fontSize: d.fs.small, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#1F1B16" }}>{c.outcome || "Gọi thử"} · {c.business_name}</span>
            <span style={{ fontSize: d.fs.tiny, color: "#6E6255", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.summary || "—"}</span>
          </span>
          <span style={{ fontSize: d.fs.tiny, color: "#6E6255", whiteSpace: "nowrap" }}>{mmss(Math.round(c.duration_ms / 1000))}</span>
        </button>
      ))}
    </div>
  );
}
