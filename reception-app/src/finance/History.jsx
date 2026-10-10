import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLayout } from "../layout.jsx";
import { EASE, MONO, SERIF, dims } from "../ui.js";
import { financeApi } from "./api.js";
import { CallDrawer } from "./CallDrawer.jsx";
import { ExportDialog } from "./ExportDialog.jsx";
import { FinHeader, FinPhoneTabs, OutcomePill, directionLabel, fold } from "./common.jsx";

// Lịch sử (handoff 16 v1): calls in and out in one list, grouped by day; chips (Tất cả · Cần xử lý · Đã xử lý · Gọi
// vào · Gọi ra), search by number or name, a result filter and a date range; a row opens the call drawer (right
// on a computer, a sheet from below on a phone). Xuất Excel exports what the filter shows.

const POLL_MS = 15_000;
const CHIPS = [["all", "Tất cả"], ["open", "Cần xử lý"], ["done", "Đã xử lý"], ["inbound", "Gọi vào"], ["outbound", "Gọi ra"]];
const CHIP_TEST = {
  all: () => true,
  open: (c) => c.needs_action && c.status === "open",
  done: (c) => c.needs_action && c.status === "done",
  inbound: (c) => c.direction === "inbound",
  outbound: (c) => c.direction === "outbound",
};
const RANGES = [["today", "Hôm nay"], ["7", "7 ngày"], ["30", "30 ngày"], ["custom", "Tùy chọn"]];

const vnDay = (ms = Date.now()) => new Date(ms + 7 * 3600e3).toISOString().slice(0, 10);
const WEEKDAYS = ["CHỦ NHẬT", "THỨ HAI", "THỨ BA", "THỨ TƯ", "THỨ NĂM", "THỨ SÁU", "THỨ BẢY"];
function dayHeading(date) {
  if (date === vnDay()) return "HÔM NAY";
  if (date === vnDay(Date.now() - 86400e3)) return "HÔM QUA";
  const d = new Date(`${date}T00:00:00Z`);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

/** The finance account's calls, kept fresh while the page is open. */
function useCalls() {
  const [calls, setCalls] = useState(null);
  const [error, setError] = useState(null);
  const load = useCallback(() => financeApi.calls(30).then((r) => { setCalls(r.calls); setError(null); }).catch((e) => setError(e.error || "network")), []);
  useEffect(() => {
    load();
    const iv = setInterval(() => { if (document.visibilityState === "visible") load(); }, POLL_MS);
    return () => clearInterval(iv);
  }, [load]);
  const update = (c) => setCalls((xs) => (xs || []).map((x) => (x.id === c.id ? { ...x, ...c } : x)));
  return { calls, error, reload: load, update };
}

export function FinanceHistory() {
  const { phone } = useLayout();
  const d = dims(phone);
  const { calls, error, reload, update } = useCalls();
  const [chip, setChip] = useState("all");
  const [q, setQ] = useState("");
  const [outcome, setOutcome] = useState("");
  const [range, setRange] = useState("30");
  const [from, setFrom] = useState(vnDay(Date.now() - 6 * 86400e3));
  const [to, setTo] = useState(vnDay());
  // "Mở trong Lịch sử →" from Gọi ra's live view opens that call
  const [openId, setOpenId] = useState(() => new URLSearchParams(window.location.search).get("call"));
  const [exporting, setExporting] = useState(false);

  const inRange = useCallback((c) => {
    if (range === "today") return c.date === vnDay();
    if (range === "7") return c.date >= vnDay(Date.now() - 6 * 86400e3);
    if (range === "custom") return c.date >= from && c.date <= to;
    return true;
  }, [range, from, to]);
  const base = useMemo(() => (calls || []).filter((c) => inRange(c)
    && (!q || fold(`${c.customer_name || ""}${c.number || ""}`).includes(fold(q).replace(/^\+?84/, "0")))
    && (!outcome || c.outcome === outcome)), [calls, inRange, q, outcome]);
  const list = base.filter(CHIP_TEST[chip]);
  const outcomes = useMemo(() => [...new Set((calls || []).map((c) => c.outcome).filter(Boolean))].sort(), [calls]);
  const groups = useMemo(() => {
    const m = new Map();
    for (const c of list) { if (!m.has(c.date)) m.set(c.date, []); m.get(c.date).push(c); }
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [list]);
  const open = (calls || []).find((c) => c.id === openId) || null;
  // what Xuất Excel exports: this filter (the backend applies the same one)
  const exportFilter = {
    ...(range === "custom" ? { from, to } : { days: range === "today" ? 1 : Number(range) }),
    ...(chip === "inbound" || chip === "outbound" ? { direction: chip } : {}),
    ...(chip === "open" || chip === "done" ? { status: chip } : {}),
    ...(outcome ? { outcome } : {}), ...(q ? { q } : {}),
  };
  const filterLabel = [CHIPS.find(([k]) => k === chip)[1], outcome, q && `“${q}”`].filter(Boolean).join(" · ");

  const chipBtn = ([k, l]) => {
    const on = chip === k;
    return (
      <button key={k} type="button" onClick={() => setChip(k)} style={{ height: d.chip, padding: "0 12px", borderRadius: d.chip / 2, border: `1px solid ${on ? "#1F1B16" : "#D9D0BF"}`, background: on ? "#1F1B16" : "#fff", color: on ? "#F7F3EC" : "#1F1B16", fontSize: d.fs.small, whiteSpace: "nowrap", flex: "none", cursor: "pointer" }}>
        {l}<span style={{ fontFamily: MONO, fontSize: 10, opacity: 0.75 }}> {base.filter(CHIP_TEST[k]).length}</span>
      </button>
    );
  };
  const field = { height: d.input, border: "1px solid #D9D0BF", borderRadius: 8, padding: "0 12px", fontSize: d.fs.body, background: "#fff", color: "#1F1B16" };
  const controls = (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm số điện thoại hoặc tên" style={{ ...field, width: phone ? "100%" : 300 }} />
      <select value={outcome} onChange={(e) => setOutcome(e.target.value)} style={{ ...field, width: phone ? "100%" : 136, paddingRight: 6 }}>
        <option value="">Mọi kết quả</option>
        {outcomes.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <div style={{ display: "flex", border: "1px solid #D9D0BF", borderRadius: 8, padding: 2, gap: 2, background: "#fff", height: d.input }}>
        {RANGES.map(([k, l]) => (
          <button key={k} type="button" onClick={() => setRange(k)} style={{ border: 0, borderRadius: 6, padding: "0 10px", fontSize: d.fs.body, background: range === k ? "#1F1B16" : "transparent", color: range === k ? "#F7F3EC" : "#1F1B16", cursor: "pointer", whiteSpace: "nowrap" }}>{l}</button>
        ))}
      </div>
      {range === "custom" && (
        <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: d.fs.small, color: "#6E6255" }}>
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} style={{ ...field, padding: "0 8px" }} />
          tới
          <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} style={{ ...field, padding: "0 8px" }} />
        </span>
      )}
    </div>
  );
  const status = (c) => {
    if (!c.needs_action) return null;
    return c.status === "done"
      ? <span style={{ color: "#4A6B3A", fontSize: 11.5, whiteSpace: "nowrap" }}>✓ Đã xử lý{c.done_hm ? ` · ${c.done_hm}` : ""}</span>
      : <span style={{ color: "#7B4A2D", fontSize: 11.5, whiteSpace: "nowrap" }}>Cần xử lý</span>;
  };
  const who = (c) => c.customer_name || c.number || "Gọi thử trên trình duyệt";
  const sub = (c) => [c.customer_name ? c.number : null, c.campaign].filter(Boolean).join(" · ");
  const empty = calls && !groups.length && <div style={{ padding: "16px 4px", fontSize: d.fs.body, color: "#6E6255" }}>Không có cuộc gọi nào.</div>;
  const failed = error && !calls && (
    <div style={{ padding: "16px 4px", fontSize: d.fs.body, color: "#A0412D" }}>Không tải được Lịch sử. <button type="button" onClick={reload} style={{ border: 0, background: "none", color: "#7B4A2D", cursor: "pointer", fontSize: d.fs.body }}>Thử lại</button></div>
  );
  const loading = !calls && !error && <div style={{ padding: "16px 4px", fontSize: d.fs.body, color: "#6E6255" }}>Đang tải…</div>;
  const dayHead = (date, n) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: phone ? "4px 2px 6px" : "0 4px 6px" }}>
      <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.18em", color: "#6E6255" }}>{dayHeading(date)}</span>
      <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.12em", color: "#6E6255" }}>{n} CUỘC</span>
    </div>
  );
  const drawer = open && (
    <CallDrawer key={open.id} item={open} phone={phone} onClose={() => setOpenId(null)} onChange={update} />
  );
  const dialog = exporting && (
    <ExportDialog count={list.length} filter={exportFilter} filterLabel={filterLabel} range={range} onClose={() => setExporting(false)} />
  );

  if (phone) {
    return (
      <div style={{ position: "absolute", inset: 0, background: "#F2EEE6", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: "var(--tt-top)", bottom: "calc(57px + var(--tt-bot))", overflow: "auto" }}>
          <div style={{ padding: "10px 16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: SERIF, fontSize: d.fs.h1 }}>Lịch sử</span>
              <button type="button" onClick={() => setExporting(true)} style={{ height: d.btnSm, padding: "0 12px", borderRadius: d.btnSm / 2, border: "1px solid #D9D0BF", background: "#fff", fontSize: d.fs.small }}>Xuất Excel</button>
            </div>
            <div className="tt-scroll-x" style={{ display: "flex", gap: 6, margin: "0 -16px", padding: "0 16px", flex: "none" }}>{CHIPS.map(chipBtn)}</div>
            {controls}
            {loading}{failed}{empty}
            {groups.map(([date, rows]) => (
              <div key={date} style={{ display: "flex", flexDirection: "column" }}>
                {dayHead(date, rows.length)}
                <div style={{ background: "#fff", border: "1px solid #E4DCCB", borderRadius: 12, overflow: "hidden" }}>
                  {rows.map((c, i) => (
                    <div key={c.id} role="button" tabIndex={0} onClick={() => setOpenId(c.id)} onKeyDown={(e) => { if (e.key === "Enter") setOpenId(c.id); }} style={{ display: "flex", flexDirection: "column", gap: 4, padding: "10px 12px", borderTop: i ? "1px solid #EFE9DD" : "none", cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{who(c)}</span>
                        <OutcomePill outcome={c.outcome} />
                      </div>
                      <span style={{ fontSize: 12, color: "#4A4239", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.summary || "—"}</span>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11, color: "#6E6255" }}>
                        <span><span style={{ fontFamily: MONO }}>{c.hm}</span> · {directionLabel(c.direction)}</span>
                        {status(c)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <FinPhoneTabs active={2} />
        <div style={{ position: "absolute", left: 0, right: 0, top: "calc(var(--tt-top) + 7px)", bottom: 0, transform: open ? "none" : "translateY(105%)", transition: `transform 450ms ${EASE}`, zIndex: 6, boxShadow: "0 -8px 28px rgba(31,27,22,0.14)", borderRadius: "18px 18px 0 0", overflow: "hidden", pointerEvents: open ? "auto" : "none", background: "#fff" }}>
          {drawer}
        </div>
        {dialog}
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: "#F2EEE6", overflow: "hidden" }}>
      <FinHeader active={2} />
      <div style={{ position: "absolute", left: 48, right: 48, top: 56 + 20, bottom: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 400 }}>Lịch sử</span>
          <button type="button" onClick={() => setExporting(true)} className="h-white" style={{ height: 34, padding: "0 16px", borderRadius: 17, border: "1px solid #D9D0BF", background: "#fff", fontSize: 13, cursor: "pointer" }}>Xuất Excel</button>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{CHIPS.map(chipBtn)}</div>
        {controls}
        <div style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", flexDirection: "column", gap: 14, paddingBottom: 28, marginTop: 4 }}>
          {loading}{failed}{empty}
          {groups.map(([date, rows]) => (
            <div key={date} style={{ display: "flex", flexDirection: "column" }}>
              {dayHead(date, rows.length)}
              <div style={{ background: "#fff", border: "1px solid #E4DCCB", borderRadius: 12, overflow: "hidden" }}>
                {rows.map((c, i) => {
                  const sel = openId === c.id;
                  return (
                    <div key={c.id} role="button" tabIndex={0} onClick={() => setOpenId(c.id)} onKeyDown={(e) => { if (e.key === "Enter") setOpenId(c.id); }} style={{ display: "grid", gridTemplateColumns: "120px minmax(200px, 1.1fr) 150px minmax(0, 2.6fr) 150px", gap: 16, alignItems: "center", minHeight: 50, padding: "8px 14px", borderTop: i ? "1px solid #EFE9DD" : "none", background: sel ? "#FBF8F2" : "transparent", cursor: "pointer" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontFamily: MONO, fontSize: 12, color: "#1F1B16" }}>{c.hm}</span>
                        <span style={{ fontSize: 11.5, color: "#6E6255" }}>{directionLabel(c.direction)}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{who(c)}</span>
                        {sub(c) && <span style={{ fontSize: 11.5, color: "#6E6255", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub(c)}</span>}
                      </div>
                      <span><OutcomePill outcome={c.outcome} /></span>
                      <span style={{ fontSize: 12.5, color: "#1F1B16", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.summary || "—"}</span>
                      <span style={{ textAlign: "right" }}>{status(c)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      {open && <div onClick={() => setOpenId(null)} style={{ position: "absolute", inset: "56px 0 0 0", background: "rgba(31,27,22,0.18)", zIndex: 3 }} />}
      <div style={{ position: "absolute", right: 0, top: 56, width: 480, bottom: 0, transform: open ? "none" : "translateX(100%)", transition: `transform 400ms ${EASE}`, boxShadow: open ? "-12px 0 40px rgba(31,27,22,0.16)" : "none", zIndex: 4, background: "#fff" }}>
        {drawer}
      </div>
      {dialog}
    </div>
  );
}
