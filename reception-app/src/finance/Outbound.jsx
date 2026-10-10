import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useLayout } from "../layout.jsx";
import { MONO, SERIF, dims } from "../ui.js";
import { financeApi } from "./api.js";
import { ExportDialog } from "./ExportDialog.jsx";
import { FinHeader, FinPhoneTabs, TrialNote } from "./common.jsx";
import { StatusPill, fmt, holidayDates, spaced } from "./outbound-common.jsx";

// Gọi ra (handoff 16 v1): today's numbers, "Số không gọi", + Tạo chiến dịch, and one card per campaign (progress,
// who picked up, the follow-up results, Tạm dừng / Tiếp tục / Bắt đầu, Xuất Excel). A card opens the campaign.

const POLL_MS = 10_000;
const dmy = (iso) => { const d = new Date(Date.parse(iso) + 7 * 3600e3); return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`; };

export function FinanceOutbound() {
  const { phone } = useLayout();
  const d = dims(phone);
  const [, go] = useLocation();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [dnc, setDnc] = useState(null);
  const load = useCallback(() => financeApi.campaigns().then((r) => { setData(r); setError(false); }).catch(() => setError(true)), []);
  useEffect(() => {
    load();
    const iv = setInterval(() => { if (document.visibilityState === "visible") load(); }, POLL_MS);
    return () => clearInterval(iv);
  }, [load]);

  const setStatus = async (c, status) => {
    try {
      const r = await financeApi.update(c.id, { status, ...(status === "running" ? { settings: { holiday_dates: holidayDates() } } : {}) });
      setData((x) => ({ ...x, campaigns: x.campaigns.map((y) => (y.id === c.id ? r.campaign : y)) }));
    } catch {
      load();
    }
  };
  const openDnc = async () => {
    setDnc({ numbers: null });
    try { setDnc(await financeApi.dnc()); } catch { setDnc({ numbers: [], error: true }); }
  };

  const t = data?.today;
  const todayLine = t && [`${fmt(t.called)} số đã gọi`, `${fmt(t.answered)} nghe máy`, `${fmt(t.outcomes?.["Quan tâm"] || 0)} quan tâm`, `${fmt(t.outcomes?.["Hẹn gọi lại"] || 0)} hẹn gọi lại`].join(" · ");
  const btn = { height: d.btnSm + 4, padding: "0 13px", borderRadius: (d.btnSm + 4) / 2, border: "1px solid #D9D0BF", background: "#fff", fontSize: d.fs.body, cursor: "pointer", whiteSpace: "nowrap" };
  const create = (
    <button type="button" onClick={() => go("/goi-ra/tao")} className="b-primary" style={{ height: phone ? 40 : 34, padding: "0 16px", borderRadius: 20, border: 0, background: "#7B4A2D", color: "#fff", fontSize: 13.5, cursor: "pointer", whiteSpace: "nowrap" }}>+ Tạo chiến dịch</button>
  );

  const card = (c) => {
    const k = c.counts, o = k.outcomes || {};
    const pct = Math.round((c.progress || 0) * 100);
    const action = ["running", "scheduled"].includes(c.status) ? ["Tạm dừng", "paused"] : c.status === "paused" ? ["Tiếp tục", "running"] : c.status === "draft" ? ["Bắt đầu", "running"] : null;
    const stat = (n, l, strong) => <span style={{ fontSize: 12.5, color: strong ? "#1F1B16" : "#6E6255", whiteSpace: "nowrap" }}><span style={{ fontFamily: MONO, fontWeight: strong ? 600 : 400 }}>{fmt(n)}</span> {l}</span>;
    return (
      <div key={c.id} role="button" tabIndex={0} onClick={() => go(`/goi-ra/${c.id}`)} onKeyDown={(e) => { if (e.key === "Enter") go(`/goi-ra/${c.id}`); }} style={{ background: "#fff", border: "1px solid #E4DCCB", borderRadius: 12, padding: phone ? "12px 14px" : "14px 16px", display: "flex", flexDirection: "column", gap: 10, cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>{c.name}</span>
            <span style={{ fontSize: 12.5, color: "#6E6255" }}>tạo {dmy(c.created_at)}{c.source?.file ? ` · ${c.source.file}` : ""}</span>
          </div>
          <StatusPill status={c.status} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 3, borderRadius: 2, background: "#EFE9DD", overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: "#7B4A2D" }} /></div>
          <span style={{ fontFamily: MONO, fontSize: 11, color: "#4A4239", whiteSpace: "nowrap" }}>{k.total ? `${fmt(k.called)} / ${fmt(k.total)} · ${pct}%` : "Chưa có số"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {stat(k.answered, "Nghe máy")}
            {stat(o["Quan tâm"] || 0, "Quan tâm", true)}
            {stat(o["Hẹn gọi lại"] || 0, "Hẹn gọi lại", true)}
            {stat(o["Đang cân nhắc"] || 0, "Đang cân nhắc", true)}
            {stat(o["Không muốn được gọi"] || 0, "Không muốn được gọi")}
          </div>
          <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
            {action && <button type="button" onClick={() => setStatus(c, action[1])} style={btn}>{action[0]}</button>}
            {k.total > 0 && <button type="button" onClick={() => setExporting(c)} style={btn}>Xuất Excel</button>}
          </div>
        </div>
      </div>
    );
  };

  const body = (
    <>
      <TrialNote />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontFamily: SERIF, fontSize: phone ? d.fs.h1 : 30 }}>Gọi ra</span>
          {todayLine && <span style={{ fontSize: 12.5, color: "#4A4239" }}>Hôm nay: {todayLine}</span>}
          {data && <button type="button" onClick={openDnc} style={{ alignSelf: "flex-start", border: 0, background: "none", padding: 0, color: "#7B4A2D", fontSize: 12.5, cursor: "pointer" }}>Số không gọi ({fmt(data.dnc)})</button>}
        </div>
        {create}
      </div>
      {!data && !error && <span style={{ fontSize: 12.5, color: "#6E6255" }}>Đang tải…</span>}
      {error && !data && <span style={{ fontSize: 12.5, color: "#A0412D" }}>Không tải được danh sách. <button type="button" onClick={load} style={{ border: 0, background: "none", color: "#7B4A2D", cursor: "pointer" }}>Thử lại</button></span>}
      {data && !data.campaigns.length && (
        <div style={{ background: "#fff", border: "1px dashed #D9D0BF", borderRadius: 12, padding: "28px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Chưa có chiến dịch nào</span>
          <span style={{ fontSize: 12.5, color: "#4A4239", maxWidth: 420 }}>Tải lên danh sách khách (Excel hoặc CSV), chọn giờ gọi, Bonia gọi từng khách và ghi lại kết quả cho tư vấn viên.</span>
        </div>
      )}
      {(data?.campaigns || []).map(card)}
    </>
  );

  const overlays = (
    <>
      {exporting && <ExportDialog count={exporting.counts.total} campaign={exporting} filter={{}} onClose={() => setExporting(null)} />}
      {dnc && (
        <div onClick={() => setDnc(null)} style={{ position: "fixed", inset: 0, background: "rgba(31,27,22,0.42)", zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Số không gọi" style={{ width: "min(420px, 100%)", maxHeight: "80vh", display: "flex", flexDirection: "column", background: "#fff", borderRadius: 18, boxShadow: "0 20px 60px rgba(31,27,22,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px 12px", borderBottom: "1px solid #EFE9DD" }}>
              <span style={{ fontFamily: SERIF, fontSize: 20 }}>Số không gọi</span>
              <button type="button" onClick={() => setDnc(null)} aria-label="Đóng" style={{ border: 0, background: "none", fontSize: 18, cursor: "pointer", color: "#4A4239" }}>✕</button>
            </div>
            <div style={{ padding: "10px 18px", fontSize: 12.5, color: "#4A4239", lineHeight: 1.5 }}>Khách đã nói không muốn được gọi. Bonia bỏ qua các số này ở mọi chiến dịch.</div>
            <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "0 18px 16px", display: "flex", flexDirection: "column" }}>
              {!dnc.numbers && <span style={{ fontSize: 12.5, color: "#6E6255" }}>Đang tải…</span>}
              {dnc.numbers && !dnc.numbers.length && <span style={{ fontSize: 12.5, color: "#6E6255" }}>{dnc.error ? "Không tải được." : "Chưa có số nào."}</span>}
              {(dnc.numbers || []).map((n) => <span key={n} style={{ fontFamily: MONO, fontSize: 12.5, padding: "6px 0", borderTop: "1px solid #EFE9DD" }}>{spaced(n)}</span>)}
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (phone) {
    return (
      <div style={{ position: "absolute", inset: 0, background: "#F2EEE6", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: "var(--tt-top)", bottom: "calc(57px + var(--tt-bot))", overflow: "auto" }}>
          <div style={{ padding: "10px 16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>{body}</div>
        </div>
        <FinPhoneTabs active={1} />
        {overlays}
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", inset: 0, background: "#F2EEE6", overflow: "hidden" }}>
      <FinHeader active={1} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 56, bottom: 0, overflow: "auto" }}>
        <div style={{ padding: "20px 48px 32px", display: "flex", flexDirection: "column", gap: 14 }}>{body}</div>
      </div>
      {overlays}
    </div>
  );
}

