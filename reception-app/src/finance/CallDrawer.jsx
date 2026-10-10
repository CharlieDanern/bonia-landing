import React, { useEffect, useRef, useState } from "react";
import { copyToClipboard } from "../state.jsx";
import { MONO } from "../ui.js";
import { financeApi, financeRecordingUrl } from "./api.js";
import { OutcomePill, clock, directionLabel } from "./common.jsx";

// The call drawer (handoff 16 v1): what Bonia recorded (the after-call step's fields), every attempt, the
// recording and the transcript; Đánh dấu đã xử lý and Sao chép for the results someone must follow up.

const RECORD_NAMES = { lead: "Ghi khách để quản lý gọi lại", complaint: "Ghi khiếu nại", message: "Ghi lời nhắn" };
const money = (v) => (typeof v === "number" ? `khoảng ${String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}đ` : v);

function dayWord(date) {
  const vn = (ms) => new Date(ms + 7 * 3600e3).toISOString().slice(0, 10);
  if (date === vn(Date.now())) return "Hôm nay";
  if (date === vn(Date.now() - 86400e3)) return "Hôm qua";
  const [, m, d] = date.split("-");
  return `${Number(d)}/${Number(m)}`;
}

function Recording({ id, ms }) {
  const [url, setUrl] = useState(null);
  const [state, setState] = useState("idle"); // idle · loading · ready · missing
  const audio = useRef(null);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  const play = async () => {
    if (url) { audio.current?.play(); return; }
    setState("loading");
    try {
      setUrl(await financeRecordingUrl(id));
      setState("ready");
    } catch {
      setState("missing");
    }
  };
  useEffect(() => { if (state === "ready") audio.current?.play().catch(() => {}); }, [state]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 16px", borderTop: "1px solid #EFE9DD" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {state !== "ready" && (
          <button type="button" onClick={play} disabled={state === "loading" || state === "missing"} aria-label="Nghe ghi âm" style={{ width: 30, height: 30, borderRadius: 15, border: 0, background: state === "missing" ? "#D9D0BF" : "#7B4A2D", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, paddingLeft: 2 }}>▶</button>
        )}
        {state !== "ready" && <span style={{ fontSize: 13 }}>{state === "loading" ? "Đang tải ghi âm…" : state === "missing" ? "Không còn ghi âm" : "Ghi âm"}</span>}
        {state !== "ready" && <span style={{ flex: 1 }} />}
        {state !== "ready" && <span style={{ fontFamily: MONO, fontSize: 11, color: "#6E6255" }}>{clock(ms)}</span>}
        {state === "ready" && <audio ref={audio} controls src={url} style={{ width: "100%", height: 36 }} />}
      </div>
    </div>
  );
}

export function CallDrawer({ item, phone, onClose, onChange }) {
  const [detail, setDetail] = useState(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let live = true;
    financeApi.call(item.id).then((r) => { if (live) setDetail(r.call); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [item.id]);
  const c = { ...(detail || {}), ...item };
  const det = detail?.details || {};
  const rows = [
    ["Kết quả", c.outcome],
    ["Tên", c.customer_name || det.customer_name],
    ["Sản phẩm", det.product],
    ["Máy quan tâm", det.phone_model],
    ["Giá máy", money(det.phone_price)],
    ["Trả trước", det.down_payment],
    ["Số tháng", det.months],
    ["Gói", det.package],
    ["Khu vực làm hồ sơ", det.area],
    ["Gọi lại lúc", det.callback_time],
    ["Tóm tắt", c.summary],
  ].filter(([, v]) => v !== undefined && v !== null && v !== "");
  const markDone = async (done) => {
    setBusy(true);
    try {
      const r = await financeApi.done(c.id, done);
      onChange(r.call);
    } catch {
      // stays as it was; the next refresh shows the truth
    }
    setBusy(false);
  };
  const copy = () => {
    copyToClipboard([c.customer_name, c.number, c.outcome, c.summary].filter(Boolean).join(" · "));
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  const lbl = { fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", color: "#6E6255" };
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff" }}>
      <div style={{ background: "#FBF5EC", padding: phone ? "16px 16px 14px" : "18px 18px 14px", borderBottom: "1px solid #EFE9DD", display: "flex", flexDirection: "column", gap: 6, flex: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#4A4239" }}>{directionLabel(c.direction)}{c.campaign ? ` · ${c.campaign}` : c.direction === "inbound" ? " · hotline" : ""}</span>
          <button type="button" onClick={onClose} aria-label="Đóng" style={{ border: 0, background: "none", fontSize: 18, lineHeight: 1, cursor: "pointer", color: "#4A4239" }}>✕</button>
        </div>
        <span style={{ fontSize: 20, fontWeight: 600 }}>{c.customer_name || c.number || "Gọi thử trên trình duyệt"}</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontFamily: MONO, fontSize: 11.5, color: "#4A4239" }}>
          {c.number && <span style={{ color: "#7B4A2D" }}>{c.number}</span>}
          <span>{dayWord(c.date)} {c.hm} · {clock(c.duration_ms)}</span>
          <OutcomePill outcome={c.outcome} />
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={lbl}>BONIA ĐÃ GHI</span>
          <div style={{ display: "grid", gridTemplateColumns: "128px minmax(0,1fr)", rowGap: 6, columnGap: 10, fontSize: 12.5 }}>
            {rows.map(([k, v]) => (
              <React.Fragment key={k}>
                <span style={{ color: "#6E6255" }}>{k}</span>
                <span style={{ color: "#1F1B16" }}>{String(v)}</span>
              </React.Fragment>
            ))}
            {!c.outcome && <span style={{ gridColumn: "1 / -1", color: "#6E6255" }}>Cuộc gọi này chưa được gắn nhãn.</span>}
          </div>
          {(detail?.records || []).length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
              {detail.records.map((r) => (
                <span key={r.id} style={{ fontSize: 12, color: "#4A4239" }}>
                  <span style={{ fontFamily: MONO, fontSize: 10.5, border: "1px solid #C9D8BF", background: "#EEF3EA", color: "#4A6B3A", borderRadius: 5, padding: "1px 6px", marginRight: 6 }}>{r.id}</span>
                  {RECORD_NAMES[r.kind] || r.function} lúc {clock(r.at_ms)}
                </span>
              ))}
            </div>
          )}
        </div>
        {detail?.attempts?.length > 0 && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid #EFE9DD", display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={lbl}>CÁC LẦN GỌI</span>
            {detail.attempts.map((a) => (
              <span key={a.n} style={{ fontFamily: MONO, fontSize: 11.5, color: "#4A4239" }}>Lần {a.n} · {a.hm} · {a.result}</span>
            ))}
          </div>
        )}
        {c.has_recording && <Recording id={c.id} ms={c.duration_ms} />}
        <div style={{ padding: "12px 16px 18px", borderTop: "1px solid #EFE9DD", display: "flex", flexDirection: "column", gap: 10 }}>
          {!detail && !failed && <span style={{ fontSize: 12.5, color: "#6E6255" }}>Đang tải lời thoại…</span>}
          {failed && <span style={{ fontSize: 12.5, color: "#A0412D" }}>Không tải được lời thoại.</span>}
          {(detail?.transcript || []).map((m, i) => {
            const b = m.who === "bonia";
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: b ? "flex-end" : "flex-start", gap: 3 }}>
                <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.14em", color: "#6E6255" }}>{b ? "BONIA" : "KHÁCH"}</span>
                <span style={{ maxWidth: "86%", fontSize: 12.5, lineHeight: 1.5, padding: "8px 12px", borderRadius: 12, background: b ? "#EFE4D6" : "#fff", border: `1px solid ${b ? "#E4D5C1" : "#E4DCCB"}`, whiteSpace: "pre-wrap" }}>{m.text}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ flex: "none", borderTop: "1px solid #EFE9DD", padding: "12px 16px", paddingBottom: phone ? "calc(12px + var(--tt-bot))" : 12, display: "flex", gap: 8, alignItems: "center" }}>
        {c.needs_action && c.status !== "done" && (
          <button type="button" disabled={busy} onClick={() => markDone(true)} className="b-primary" style={{ height: 36, padding: "0 16px", borderRadius: 18, border: 0, background: "#7B4A2D", color: "#fff", fontSize: 13, cursor: "pointer" }}>Đánh dấu đã xử lý</button>
        )}
        {c.needs_action && c.status === "done" && (
          <>
            <span style={{ fontSize: 12.5, color: "#4A6B3A" }}>✓ Đã xử lý{c.done_hm ? ` · ${c.done_hm}` : ""}</span>
            <button type="button" disabled={busy} onClick={() => markDone(false)} style={{ height: 32, padding: "0 12px", borderRadius: 16, border: "1px solid #D9D0BF", background: "#fff", fontSize: 12, cursor: "pointer" }}>Chưa xử lý</button>
          </>
        )}
        <button type="button" onClick={copy} style={{ height: 36, padding: "0 14px", borderRadius: 18, border: "1px solid #D9D0BF", background: "#fff", fontSize: 13, cursor: "pointer" }}>{copied ? "Đã chép" : "Sao chép"}</button>
      </div>
    </div>
  );
}
