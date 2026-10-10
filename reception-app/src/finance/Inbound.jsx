import React, { useCallback, useEffect, useState } from "react";
import { useLayout } from "../layout.jsx";
import { MONO, SERIF } from "../ui.js";
import { financeApi } from "./api.js";
import { LiveView, PhoneLive } from "./Campaign.jsx";
import { ExportDialog } from "./ExportDialog.jsx";
import { FinHeader, FinPhoneTabs } from "./common.jsx";
import { Toggle, fmt, spaced } from "./outbound-common.jsx";

// Gọi vào (founder 2026-10-10: "trực tiếp" renamed "gọi vào", and it follows Gọi ra's live view): the hotline's calls
// in progress in the field, today's results in the boxes, the pinned card and the feed. The bar has the hotline's
// switch: off, Bonia turns direct calls down at once (the finance engine keeps the switch). Every call is answered,
// so there is no Không nghe máy box. Live data is polled.

const POLL_MS = 1500;
const STAGE = { noAnswer: false, liveLabel: "ĐANG NGHE", ringWord: "đang đổ chuông", needTitle: "CẦN XỬ LÝ" };

export function FinanceInbound() {
  const { phone, reduce } = useLayout();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [exporting, setExporting] = useState(false);
  const [blink, setBlink] = useState(1);
  useEffect(() => { const iv = setInterval(() => setBlink((b) => (b === 1 ? 0.4 : 1)), 700); return () => clearInterval(iv); }, []);

  const load = useCallback(() => financeApi.inboundLive().then((r) => {
    setData({ ...r, skew: r.now ? Date.parse(r.now) - Date.now() : 0 });
    setError(false);
  }).catch(() => setError(true)), []);
  useEffect(() => {
    load();
    const iv = setInterval(() => { if (document.visibilityState === "visible") load(); }, POLL_MS);
    return () => clearInterval(iv);
  }, [load]);

  const say = (m) => { setToast(m); setTimeout(() => setToast(""), 3000); };
  const setHotline = async (on) => {
    if (!on && !window.confirm("Tắt tổng đài? Bonia sẽ từ chối mọi cuộc gọi tới cho tới khi bật lại.")) return;
    setBusy(true);
    try {
      const r = await financeApi.setHotline(on);
      setData((d) => ({ ...d, hotline: r.hotline }));
      say(on ? "Đã bật · Bonia nghe máy" : "Đã tắt · Bonia từ chối cuộc gọi tới");
    } catch {
      say("Chưa đổi được. Thử lại.");
    }
    setBusy(false);
  };

  const hot = data?.hotline;
  const on = !!hot?.on;
  const offline = data && data.engine !== "ok";
  const k = data?.counts || { total: 0, called: 0, answered: 0, no_answer: 0, outcomes: {}, open: 0 };
  const live = { calls: data?.calls || [], feed: data?.feed || [], skew: data?.skew || 0 };
  const pill = offline ? ["MẤT KẾT NỐI", "#A0412D", "#E3B9AE"] : on ? ["ĐANG NGHE MÁY", "#4A6B3A", "#4A6B3A"] : ["ĐÃ TẮT", "#6E6255", "#D9D0BF"];
  const sub = offline
    ? "Chưa kết nối được tổng đài của Bonia. Đang thử lại…"
    : `Hotline ${hot?.number ? spaced(hot.number) : "—"} · bản dùng thử: Bonia chỉ nghe máy các số đã đăng ký thử`;

  const nameBlock = (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontFamily: SERIF, fontSize: phone ? 22 : 20, lineHeight: 1.15 }}>Gọi vào</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.1em", padding: "3px 8px", borderRadius: 9, border: `1px solid ${pill[2]}`, color: pill[1], whiteSpace: "nowrap", lineHeight: 1.2 }}>
          {on && !offline && <span style={{ width: 6, height: 6, borderRadius: 3, background: pill[1], opacity: blink, transition: "opacity 300ms" }} />}
          {pill[0]}
        </span>
      </div>
      <span style={{ fontSize: 12.5, color: offline ? "#A0412D" : "#6E6255" }}>{sub}</span>
    </div>
  );
  const stats = (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-end" }}>
      {[["HÔM NAY", k.total, "#4A4239"], ["CẦN XỬ LÝ", k.open, k.open ? "#7B4A2D" : "#4A4239"]].map(([l, n, c]) => (
        <div key={l} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.16em", color: "#6E6255" }}>{l}</span>
          <span style={{ fontFamily: MONO, fontSize: 17, lineHeight: 1, color: c }}>{fmt(n)}</span>
        </div>
      ))}
    </div>
  );
  const btn = { height: 34, padding: "0 14px", border: "1px solid #D9D0BF", borderRadius: 17, background: "#fff", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", color: "#1F1B16" };
  const actions = (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <label style={{ ...btn, display: "inline-flex", alignItems: "center", gap: 10, cursor: hot && !busy ? "pointer" : "default", opacity: hot ? 1 : 0.55 }}>
        <span>Bonia nghe máy</span>
        <Toggle on={on} onChange={(v) => { if (hot && !busy) setHotline(v); }} label="Bonia nghe máy" />
      </label>
      <button type="button" onClick={() => setExporting(true)} style={btn}>Xuất Excel</button>
    </div>
  );
  const overlays = (
    <>
      {exporting && <ExportDialog count={k.total} filter={{ direction: "inbound" }} filterLabel="Gọi vào" range="today" onClose={() => setExporting(false)} />}
      <div style={{ position: "absolute", left: "50%", bottom: phone ? "calc(72px + var(--tt-bot))" : 24, transform: "translateX(-50%)", padding: "9px 16px", borderRadius: 18, background: "#1F1B16", color: "#F7F3EC", fontSize: 12.5, opacity: toast ? 1 : 0, transition: "opacity 300ms ease", pointerEvents: "none", zIndex: 30, whiteSpace: "nowrap" }}>{toast}</div>
    </>
  );
  const loading = !data && <div style={{ padding: phone ? "12px 0" : 0, fontSize: 13, color: error ? "#A0412D" : "#6E6255" }}>{error ? "Không tải được. Đang thử lại…" : "Đang mở…"}</div>;

  if (phone) {
    return (
      <div style={{ position: "absolute", inset: 0, background: "#F2EEE6", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: "var(--tt-top)", bottom: "calc(57px + var(--tt-bot))", overflow: "auto" }}>
          <div style={{ padding: "10px 16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
            {nameBlock}
            {stats}
            {actions}
            {loading || <PhoneLive counts={k} live={live} reduce={reduce} direction="inbound" stage={STAGE} />}
          </div>
        </div>
        <FinPhoneTabs active={0} />
        {overlays}
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", inset: 0, background: "#F2EEE6", overflow: "hidden" }}>
      <FinHeader active={0} />
      <div style={{ position: "absolute", left: 28, right: 28, top: 72, minHeight: 56, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20 }}>
        {nameBlock}
        <div style={{ display: "flex", alignItems: "center", gap: 28, flex: "none" }}>
          {stats}
          {actions}
        </div>
      </div>
      {loading ? <div style={{ position: "absolute", left: 28, top: 144 }}>{loading}</div> : <LiveView counts={k} live={live} reduce={reduce} direction="inbound" stage={STAGE} />}
      {overlays}
    </div>
  );
}
