import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useLayout } from "../layout.jsx";
import { Orb } from "../components/Orb.jsx";
import { EASE, MONO, SERIF, dims } from "../ui.js";
import { financeApi } from "./api.js";
import { CallDrawer } from "./CallDrawer.jsx";
import { ExportDialog } from "./ExportDialog.jsx";
import { FinHeader, FinPhoneTabs, OutcomePill } from "./common.jsx";
import { LiveStage } from "./LiveStage.jsx";
import {
  BOXES, CONCURRENCY, Choice, DAYS, FeedPill, NO_ANSWER, StatusPill, colOf, fmt, holidayDates, inWindow, masked, mmss, needs,
  nextCallTime, readSheet, settingsLine, spaced,
} from "./outbound-common.jsx";

// Inside a campaign (handoff 16 + update 17): the campaign bar (name, status, CHỜ GỌI, ĐÃ GỌI, Trực tiếp | Bảng,
// Tạm dừng, Chỉnh chiến dịch, Xuất Excel), then either the live view (the field, the result boxes, the pinned card
// and the feed) or the Bảng (the list's rows with chips and search; a row opens its call). Live data is polled.

const LIVE_MS = 1500;
const BANG_MS = 8000;

function useVisibleInterval(fn, ms, deps) {
  useEffect(() => {
    fn();
    const iv = setInterval(() => { if (document.visibilityState === "visible") fn(); }, ms);
    return () => clearInterval(iv);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

function useToast() {
  const [toast, setToast] = useState("");
  const t = useRef(0);
  const show = useCallback((msg, ms = 2800) => { setToast(msg); clearTimeout(t.current); t.current = setTimeout(() => setToast(""), ms); }, []);
  return [toast, show];
}

/** The campaign's line under its name: the script's days and hours, retries, and why it isn't calling right now. */
function subline(c, engine, now) {
  const s = c.settings;
  const parts = [settingsLine(s)];
  if (c.status === "running" && !inWindow(now, s)) {
    const next = nextCallTime(now, s);
    parts.unshift(next ? `Ngoài giờ gọi · gọi tiếp lúc ${next}` : "Ngoài giờ gọi");
  }
  if (c.status === "scheduled" && s.start_at) {
    const d = new Date(Date.parse(s.start_at) + 7 * 3600e3);
    parts.unshift(`Bắt đầu lúc ${d.toISOString().slice(11, 16)} ${d.getUTCDate()}/${d.getUTCMonth() + 1}`);
  }
  if (c.status === "running" && engine && engine !== "ok") parts.unshift("Chưa kết nối được bộ gọi của Bonia");
  return parts.join(" · ");
}

export function FinanceCampaign({ id, view = "live" }) {
  const { phone, reduce } = useLayout();
  const [, go] = useLocation();
  const [campaign, setCampaign] = useState(null);
  const [error, setError] = useState(null);
  const [live, setLive] = useState({ calls: [], feed: [], engine: "ok", skew: 0 });
  const [edit, setEdit] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, showToast] = useToast();
  const [blink, setBlink] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => { const iv = setInterval(() => setBlink((b) => (b === 1 ? 0.4 : 1)), 700); return () => clearInterval(iv); }, []);

  const loadLive = useCallback(() => financeApi.live(id).then((r) => {
    setCampaign(r.campaign);
    setLive({ calls: r.calls || [], feed: r.feed || [], engine: r.engine, skew: r.now ? Date.parse(r.now) - Date.now() : 0 });
    setError(null);
  }).catch((e) => setError(e.status === 404 ? "not_found" : e.error || "network")), [id]);
  const loadOne = useCallback(() => financeApi.campaign(id).then((r) => { setCampaign(r.campaign); setError(null); }).catch((e) => setError(e.status === 404 ? "not_found" : e.error || "network")), [id]);
  useVisibleInterval(view === "live" ? loadLive : loadOne, view === "live" ? LIVE_MS : BANG_MS, [id, view]);

  const setStatus = async (status, msg) => {
    setBusy(true);
    try {
      const body = { status, ...(status === "running" ? { settings: { holiday_dates: holidayDates() } } : {}) };
      const r = await financeApi.update(id, body);
      setCampaign(r.campaign);
      if (msg) showToast(msg, 3200);
    } catch {
      showToast("Không đổi được trạng thái. Thử lại.");
    }
    setBusy(false);
  };

  if (error === "not_found") {
    return (
      <Shell phone={phone}>
        <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
          <span>Không tìm thấy chiến dịch này.</span>
          <Link href="/goi-ra" style={{ color: "#7B4A2D" }}>← Gọi ra</Link>
        </div>
      </Shell>
    );
  }
  if (!campaign) {
    return <Shell phone={phone}><div style={{ padding: 28, fontSize: 13, color: error ? "#A0412D" : "#6E6255" }}>{error ? "Không tải được chiến dịch." : "Đang mở…"}</div></Shell>;
  }

  const c = campaign;
  const k = c.counts;
  const wait = (k.waiting || 0) + (k.retry || 0);
  const pause = ["running", "scheduled"].includes(c.status)
    ? ["Tạm dừng", () => setStatus("paused", "Đã tạm dừng · các cuộc đang gọi vẫn nói tiếp")]
    : c.status === "paused" ? ["Tiếp tục", () => setStatus("running", "Đã tiếp tục gọi")]
      : c.status === "draft" ? ["Bắt đầu gọi", () => setStatus("running", "Đã bắt đầu gọi")] : null;
  const btn = { height: 34, padding: "0 14px", border: "1px solid #D9D0BF", borderRadius: 17, background: "#fff", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", color: "#1F1B16" };
  const viewSwitch = (
    <div style={{ display: "flex", alignSelf: "flex-start", background: "#fff", border: "1px solid #D9D0BF", borderRadius: 17, padding: 2, gap: 2 }}>
      {[["live", "Trực tiếp", `/goi-ra/${id}`], ["bang", "Bảng", `/goi-ra/${id}/bang`]].map(([v, l, href]) => (
        <button key={v} type="button" onClick={() => go(href, { replace: true })} style={{ height: 28, padding: "0 12px", borderRadius: 14, border: 0, background: view === v ? "#1F1B16" : "transparent", color: view === v ? "#F7F3EC" : "#1F1B16", fontSize: 12.5, cursor: "pointer" }}>{l}</button>
      ))}
    </div>
  );
  const nameBlock = (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontFamily: SERIF, fontSize: phone ? 22 : 20, lineHeight: 1.15 }}>{c.name}</span>
        <StatusPill status={c.status} blink={blink} />
      </div>
      <span style={{ fontSize: 12.5, color: "#6E6255" }}>{subline(c, view === "live" ? live.engine : "ok", Date.now())}</span>
    </div>
  );
  const progress = (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-end" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.16em", color: "#6E6255" }}>CHỜ GỌI</span>
        <span style={{ fontFamily: MONO, fontSize: 17, lineHeight: 1, color: "#4A4239" }}>{fmt(wait)}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, width: phone ? "auto" : 220, flex: phone ? 1 : "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.16em", color: "#6E6255" }}>ĐÃ GỌI</span>
          <span style={{ fontFamily: MONO, fontSize: 11.5, color: "#4A4239" }}>{fmt(k.called)} / {fmt(k.total)}</span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: "#E4DCCB", overflow: "hidden" }}>
          <div style={{ width: `${Math.round((c.progress || 0) * 1000) / 10}%`, height: "100%", background: "#7B4A2D", transition: "width 300ms linear" }} />
        </div>
      </div>
    </div>
  );
  const actions = (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: phone ? "wrap" : "nowrap" }}>
      {!phone && viewSwitch}
      {pause && <button type="button" disabled={busy} onClick={pause[1]} style={{ ...btn, ...(c.status === "draft" ? { background: "#7B4A2D", color: "#fff", border: "1px solid #7B4A2D" } : {}) }}>{pause[0]}</button>}
      <button type="button" onClick={() => setEdit(true)} style={{ ...btn, border: "1px solid #7B4A2D", color: "#7B4A2D" }}>Chỉnh chiến dịch</button>
      <button type="button" onClick={() => setExporting(true)} style={btn}>Xuất Excel</button>
    </div>
  );
  const overlays = (
    <>
      <EditDrawer open={edit} campaign={c} phone={phone} onClose={() => setEdit(false)} onSaved={(next, msg) => { setCampaign(next); setEdit(false); showToast(msg, 3200); }} onToast={showToast} />
      {exporting && <ExportDialog count={k.total} campaign={c} filter={{}} onClose={() => setExporting(false)} />}
      <div style={{ position: "absolute", left: "50%", bottom: phone ? "calc(72px + var(--tt-bot))" : 24, transform: "translateX(-50%)", padding: "9px 16px", borderRadius: 18, background: "#1F1B16", color: "#F7F3EC", fontSize: 12.5, opacity: toast ? 1 : 0, transition: "opacity 300ms ease", pointerEvents: "none", zIndex: 30, whiteSpace: "nowrap" }}>{toast}</div>
    </>
  );

  if (phone) {
    return (
      <div style={{ position: "absolute", inset: 0, background: "#F2EEE6", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: "var(--tt-top)", bottom: "calc(57px + var(--tt-bot))", overflow: "auto" }}>
          <div style={{ padding: "10px 16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
            <Link href="/goi-ra" style={{ fontSize: 12.5, color: "#7B4A2D" }}>← Gọi ra</Link>
            {nameBlock}
            {progress}
            {actions}
            {viewSwitch}
            {view === "live" ? <PhoneLive campaign={c} live={live} reduce={reduce} /> : <Bang campaign={c} phone />}
          </div>
        </div>
        <FinPhoneTabs active={1} />
        {overlays}
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: "#F2EEE6", overflow: "hidden" }}>
      <FinHeader active={1} />
      <div style={{ position: "absolute", left: 28, right: 28, top: 72, minHeight: 56, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20 }}>
        {nameBlock}
        <div style={{ display: "flex", alignItems: "center", gap: 28, flex: "none" }}>
          {progress}
          {actions}
        </div>
      </div>
      {view === "live"
        ? <LiveView campaign={c} live={live} reduce={reduce} />
        : <div style={{ position: "absolute", left: 28, right: 28, top: 144, bottom: 0 }}><Bang campaign={c} /></div>}
      {overlays}
    </div>
  );
}

function Shell({ phone, children }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#F2EEE6", overflow: "hidden" }}>
      {!phone && <FinHeader active={1} />}
      <div style={{ position: "absolute", left: 0, right: 0, top: phone ? "var(--tt-top)" : 56, bottom: phone ? "calc(57px + var(--tt-bot))" : 0, overflow: "auto" }}>{children}</div>
      {phone && <FinPhoneTabs active={1} />}
    </div>
  );
}

// ── Trực tiếp ─────────────────────────────────────────────────────────────

/** The feed's rows: new ones are lit for a moment. */
function useFeed(feed) {
  const seen = useRef(null);
  const now = Date.now();
  if (!seen.current) seen.current = new Map((feed || []).map((f) => [`${f.id}:${f.call_id || f.attempts}`, 0]));
  for (const f of feed || []) { const key = `${f.id}:${f.call_id || f.attempts}`; if (!seen.current.has(key)) seen.current.set(key, now); }
  return (feed || []).map((f) => ({ ...f, fresh: now - (seen.current.get(`${f.id}:${f.call_id || f.attempts}`) || 0) < 1400 }));
}
const outcomeOf = (f) => f.outcome || (f.status === "no_answer" ? NO_ANSWER : null);

function LiveView({ campaign, live, reduce }) {
  const [pin, setPin] = useState(null); // { row: id } a call in progress or a finished one
  const [mode, setMode] = useState("need");
  const [binF, setBinF] = useState(null);
  const [mask, setMask] = useState(true);
  const [, tick] = useState(0);
  useEffect(() => { const iv = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(iv); }, []);
  const feed = useFeed(live.feed);
  const shownFeed = feed.filter((f) => (binF ? outcomeOf(f) === binF : mode === "need" ? needs(f.outcome) : true)).slice(0, 40);
  const showPhone = (p) => (mask ? masked(p) : spaced(p));
  const pinCall = pin && live.calls.find((x) => x.row_id === pin);
  const pinRow = pin && feed.find((f) => f.id === pin);
  const wall = Date.now() + live.skew;

  let card = null;
  if (pinCall) {
    const el = (wall - Date.parse(pinCall.talking_since || pinCall.since)) / 1000;
    const who = pinCall.speaking === "caller" ? "Khách đang nói" : pinCall.speaking === "bonia" ? "Bonia đang trả lời" : pinCall.line ? (pinCall.line.who === "bonia" ? "Bonia vừa nói" : "Khách vừa nói") : "";
    const b = pinCall.speaking ? pinCall.speaking === "bonia" : pinCall.line?.who === "bonia";
    card = {
      status: pinCall.state === "talking" ? `ĐANG NÓI CHUYỆN · ${mmss(el)}` : "ĐANG ĐỔ CHUÔNG", c: "#4A6B3A", bg: "#F1F3EA",
      name: pinCall.name || "Khách", phone: pinCall.phone, who, whoC: "#4A6B3A", line: pinCall.line?.text || "…", bonia: b,
    };
  } else if (pinRow) {
    const o = outcomeOf(pinRow);
    card = {
      status: `ĐÃ XONG · ${pinRow.last_hm || ""}${pinRow.duration_ms ? ` · ${mmss(pinRow.duration_ms / 1000)}` : ""}`, c: needs(o) ? colOf(o) : "#6E6255", bg: "#F7F3EC",
      name: pinRow.name || "Khách", phone: pinRow.phone, who: o || "Chưa gắn nhãn", whoC: needs(o) ? colOf(o) : "#6E6255", line: pinRow.summary || pinRow.status_label, done: true, callId: pinRow.call_id,
    };
  } else if (pin) {
    card = { status: "VỪA XONG", c: "#6E6255", bg: "#F7F3EC", name: "Khách", phone: "", who: "Đang ghi kết quả…", whoC: "#6E6255", line: "…", done: true };
  }

  return (
    <>
      <div style={{ position: "absolute", left: 28, right: 28 + 316 + 24, top: 144, bottom: 20 }}>
        <LiveStage calls={live.calls} feed={live.feed} counts={campaign.counts} skew={live.skew} pinnedId={pinCall ? pin : null} onPin={setPin} binF={binF} onBin={setBinF} mask={mask} reduce={reduce} />
      </div>
      <aside style={{ position: "absolute", right: 28, width: 316, top: 144, bottom: 20, display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5 }}>
        {card && (
          <div style={{ borderRadius: 12, background: "#fff", border: "1px solid #D9D0BF", overflow: "hidden", flex: "none" }}>
            <div style={{ padding: "10px 12px", background: card.bg, borderBottom: "1px solid #E4DCCB", display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.14em", color: card.c }}>{card.status}</span>
                <button type="button" onClick={() => setPin(null)} aria-label="Bỏ ghim" style={{ width: 28, height: 28, margin: "-6px -6px -6px 0", border: 0, borderRadius: 14, background: "transparent", fontSize: 13, cursor: "pointer", color: "#4A4239" }}>✕</button>
              </div>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{card.name}</span>
              {card.phone && <span style={{ fontFamily: MONO, fontSize: 11.5, color: "#4A4239" }}>{showPhone(card.phone)}</span>}
            </div>
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", alignItems: card.bonia ? "flex-end" : "flex-start", gap: 4, minHeight: 74 }}>
              <span style={{ fontSize: 11.5, color: card.whoC }}>{card.who}</span>
              <div style={{ maxWidth: "94%", padding: "7px 10px", borderRadius: 11, lineHeight: 1.45, background: card.bonia ? "#EFE4D6" : "#FAF7F1", border: `1px solid ${card.bonia ? "#E4D5C1" : "#EFE9DD"}` }}>{card.line}</div>
              {card.done && card.callId && <Link href={`/lich-su?call=${card.callId}`} style={{ fontSize: 12, paddingTop: 2, color: "#7B4A2D" }}>Mở trong Lịch sử →</Link>}
            </div>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flex: "none" }}>
          <div style={{ display: "flex", background: "#fff", border: "1px solid #D9D0BF", borderRadius: 15, padding: 2, gap: 2 }}>
            {[["need", "Cần chú ý"], ["all", "Tất cả"]].map(([m, l]) => {
              const on = mode === m && !binF;
              return <button key={m} type="button" onClick={() => { setMode(m); setBinF(null); }} style={{ height: 26, padding: "0 11px", border: 0, borderRadius: 13, background: on ? "#1F1B16" : "transparent", color: on ? "#F7F3EC" : "#1F1B16", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>{l}</button>;
            })}
          </div>
          <button type="button" onClick={() => setMask(!mask)} style={{ height: 26, padding: "0 9px", border: "1px solid #D9D0BF", borderRadius: 13, background: "#fff", fontSize: 11.5, cursor: "pointer", whiteSpace: "nowrap" }}>{mask ? "Hiện số" : "Ẩn số"}</button>
        </div>
        {binF && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flex: "none" }}>
            <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.16em", color: "#6E6255" }}>ĐANG LỌC · {binF.toUpperCase()}</span>
            <button type="button" onClick={() => setBinF(null)} style={{ height: 24, padding: "0 9px", border: "1px solid #D9D0BF", borderRadius: 12, background: "#fff", fontSize: 11.5, cursor: "pointer" }}>Bỏ lọc ✕</button>
          </div>
        )}
        <div style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", flexDirection: "column", borderRadius: 12, background: "#fff", border: "1px solid #D9D0BF" }}>
          {!shownFeed.length && <span style={{ padding: "14px 12px", color: "#6E6255" }}>{feed.length ? "Chưa có khách nào ở mục này." : "Chưa có cuộc nào xong."}</span>}
          {shownFeed.map((f, i) => (
            <button key={f.id} type="button" onClick={() => setPin(f.id)} className="h-feed" style={{ display: "grid", gridTemplateColumns: "40px minmax(0,1fr) auto", gap: 8, alignItems: "center", padding: "8px 12px", border: 0, borderTop: i ? "1px solid #EFE9DD" : "none", background: f.fresh ? "#FAF6EF" : pin === f.id ? "#FBF8F2" : "#FFFFFF", transition: "background-color 1400ms ease", textAlign: "left", cursor: "pointer", fontSize: 12.5, flex: "none" }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: "#6E6255" }}>{f.last_hm}</span>
              <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name || "Khách"}</span>
                <span style={{ fontFamily: MONO, fontSize: 10.5, color: "#6E6255" }}>{showPhone(f.phone)}</span>
              </span>
              {outcomeOf(f) ? <FeedPill outcome={outcomeOf(f)} /> : <OutcomePill outcome={null} />}
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}

/** A phone's Trực tiếp: no field (too small to point at); the sphere's counts, the boxes and the feed. */
function PhoneLive({ campaign, live, reduce }) {
  const [mask, setMask] = useState(true);
  const feed = useFeed(live.feed);
  const o = campaign.counts.outcomes || {};
  const talk = live.calls.filter((x) => x.state === "talking").length;
  const all = [...(BOXES.outbound || []), ...Object.keys(o).filter((x) => !BOXES.outbound.includes(x))];
  const boxes = [...all.filter(needs), ...all.filter((x) => !needs(x)), NO_ANSWER];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", border: "1px solid #E4DCCB", borderRadius: 12, padding: "10px 12px" }}>
        <div style={{ width: 64, height: 64, flex: "none" }}><Orb size={64} mood={live.calls.length ? "bonia" : "idle"} tone={live.calls.length ? "green" : "warm"} lively={live.calls.length > 0} reduce={reduce} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontFamily: MONO, fontSize: 20, lineHeight: 1 }}>{fmt(live.calls.length)} <span style={{ fontSize: 9.5, letterSpacing: "0.18em", color: "#4A6B3A" }}>ĐANG GỌI</span></span>
          <span style={{ fontSize: 12, color: "#4A4239" }}><span style={{ color: "#7A4B2A" }}>{fmt(talk)} trò chuyện</span> · {fmt(live.calls.length - talk)} đổ chuông</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {boxes.map((b) => (
          <div key={b} style={{ border: `1px solid ${needs(b) ? "#D9D0BF" : "#E9E2D5"}`, borderRadius: 12, background: "#fff", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: needs(b) ? 600 : 400, color: needs(b) ? "#1F1B16" : "#4A4239" }}>{needs(b) && <span style={{ width: 7, height: 7, borderRadius: 4, background: colOf(b) }} />}{b}</span>
            <span style={{ fontFamily: MONO, fontSize: needs(b) ? 20 : 15, color: needs(b) ? "#1F1B16" : "#6E6255" }}>{fmt(b === NO_ANSWER ? campaign.counts.no_answer : o[b] || 0)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.16em", color: "#6E6255" }}>VỪA XONG</span>
        <button type="button" onClick={() => setMask(!mask)} style={{ height: 28, padding: "0 10px", border: "1px solid #D9D0BF", borderRadius: 14, background: "#fff", fontSize: 12 }}>{mask ? "Hiện số" : "Ẩn số"}</button>
      </div>
      <div style={{ background: "#fff", border: "1px solid #E4DCCB", borderRadius: 12, overflow: "hidden" }}>
        {!feed.length && <div style={{ padding: "12px", fontSize: 12.5, color: "#6E6255" }}>Chưa có cuộc nào xong.</div>}
        {feed.slice(0, 30).map((f, i) => (
          <div key={f.id} style={{ display: "grid", gridTemplateColumns: "40px minmax(0,1fr) auto", gap: 8, alignItems: "center", padding: "9px 12px", borderTop: i ? "1px solid #EFE9DD" : "none", background: f.fresh ? "#FAF6EF" : "#fff", transition: "background-color 1400ms ease" }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: "#6E6255" }}>{f.last_hm}</span>
            <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name || "Khách"}</span>
              <span style={{ fontFamily: MONO, fontSize: 10.5, color: "#6E6255" }}>{mask ? masked(f.phone) : spaced(f.phone)}</span>
            </span>
            {outcomeOf(f) ? <FeedPill outcome={outcomeOf(f)} /> : <OutcomePill outcome={null} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bảng ──────────────────────────────────────────────────────────────────

function Bang({ campaign, phone = false }) {
  const d = dims(phone);
  const [chip, setChip] = useState({ view: "", outcome: "" });
  const [q, setQ] = useState("");
  const [rows, setRows] = useState(null);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(100);
  const [openRow, setOpenRow] = useState(null);
  const k = campaign.counts;
  const o = k.outcomes || {};
  const order = [...BOXES.outbound.filter((x) => o[x]), ...Object.keys(o).filter((x) => !BOXES.outbound.includes(x))];
  const chips = [
    ["", "", "Tất cả", k.total], ["waiting", "", "Chờ gọi", k.waiting], ["calling", "", "Đang gọi", k.calling], ["no_answer", "", "Không nghe máy", k.no_answer],
    ...order.map((x) => ["", x, x, o[x]]),
    ...(k.skipped ? [["skipped", "", "Chưa được gọi (bản thử)", k.skipped]] : []),
  ];
  const load = useCallback(() => financeApi.rows(campaign.id, { view: chip.view, outcome: chip.outcome, q: q.trim(), limit })
    .then((r) => { setRows(r.rows); setTotal(r.total); }).catch(() => {}), [campaign.id, chip, q, limit]);
  useEffect(() => {
    const t = setTimeout(load, q ? 250 : 0);
    const iv = setInterval(() => { if (document.visibilityState === "visible") load(); }, 10_000);
    return () => { clearTimeout(t); clearInterval(iv); };
  }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  const chipBtn = ([view, outcome, l, n]) => {
    const on = chip.view === view && chip.outcome === outcome;
    return (
      <button key={`${view}:${outcome}`} type="button" onClick={() => { setChip({ view, outcome }); setLimit(100); }} style={{ height: d.chip, padding: "0 12px", borderRadius: d.chip / 2, border: `1px solid ${on ? "#1F1B16" : "#D9D0BF"}`, background: on ? "#1F1B16" : "#fff", color: on ? "#F7F3EC" : "#1F1B16", fontSize: d.fs.small, whiteSpace: "nowrap", flex: "none", cursor: "pointer" }}>
        {l}<span style={{ fontFamily: MONO, fontSize: 10, opacity: 0.75 }}> {fmt(n)}</span>
      </button>
    );
  };
  const status = (r) => (r.status === "calling"
    ? <span style={{ color: "#4A6B3A", display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: 3, background: "#4A6B3A" }} />Đang gọi</span>
    : <span style={{ color: r.status === "skipped" ? "#7B4A2D" : "#1F1B16" }}>{r.status_label}</span>);
  const lbl = { fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", color: "#6E6255" };
  const search = <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm số điện thoại hoặc tên" style={{ height: d.input, border: "1px solid #D9D0BF", borderRadius: 8, padding: "0 12px", fontSize: d.fs.body, background: "#fff", width: phone ? "100%" : 340 }} />;
  const more = rows && rows.length < total && (
    <button type="button" onClick={() => setLimit((x) => Math.min(500, x + 100))} disabled={limit >= 500} style={{ border: 0, background: "none", color: "#7B4A2D", fontSize: 12, cursor: "pointer" }}>{limit >= 500 ? "Tìm theo tên hoặc số để xem thêm" : "Xem thêm"}</button>
  );
  const drawer = openRow && <RowPanel key={openRow} campaign={campaign} rowId={openRow} phone={phone} onClose={() => setOpenRow(null)} />;

  if (phone) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="tt-scroll-x" style={{ display: "flex", gap: 6, margin: "0 -16px", padding: "0 16px", flex: "none" }}>{chips.map(chipBtn)}</div>
        {search}
        <div style={{ background: "#fff", border: "1px solid #E4DCCB", borderRadius: 12, overflow: "hidden" }}>
          {rows && !rows.length && <div style={{ padding: 12, fontSize: 12.5, color: "#6E6255" }}>Không có số nào.</div>}
          {(rows || []).map((r, i) => (
            <div key={r.id} role="button" tabIndex={0} onClick={() => setOpenRow(r.id)} style={{ display: "flex", flexDirection: "column", gap: 4, padding: "10px 12px", borderTop: i ? "1px solid #EFE9DD" : "none", cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{r.name || spaced(r.phone)}</span>
                {r.outcome && <OutcomePill outcome={r.outcome} />}
              </div>
              <span style={{ fontFamily: MONO, fontSize: 11, color: "#6E6255" }}>{spaced(r.phone)}{r.note ? ` · ${r.note}` : ""}</span>
              <span style={{ fontSize: 12, color: "#4A4239" }}>{status(r)}{r.summary ? ` · ${r.summary}` : ""}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={lbl}>HIỂN THỊ {fmt(rows?.length || 0)} / {fmt(total)} SỐ</span>{more}</div>
        <div style={{ position: "fixed", left: 0, right: 0, top: "calc(var(--tt-top) + 7px)", bottom: 0, transform: openRow ? "none" : "translateY(105%)", transition: `transform 450ms ${EASE}`, zIndex: 6, boxShadow: "0 -8px 28px rgba(31,27,22,0.14)", borderRadius: "18px 18px 0 0", overflow: "hidden", pointerEvents: openRow ? "auto" : "none", background: "#fff" }}>{drawer}</div>
      </div>
    );
  }
  const cols = "200px minmax(120px,1fr) minmax(170px,1.1fr) 140px 130px minmax(200px,2.4fr) 64px";
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{chips.map(chipBtn)}</div>
      {search}
      <div style={{ flex: 1, minHeight: 0, marginBottom: 20, display: "flex", flexDirection: "column", background: "#fff", border: "1px solid #E4DCCB", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: cols, gap: 14, padding: "10px 14px", borderBottom: "1px solid #E4DCCB", flex: "none" }}>
          {["SỐ ĐIỆN THOẠI · TÊN", "GHI CHÚ", "TRẠNG THÁI", "KẾT QUẢ", "GỌI LẠI LÚC", "TÓM TẮT", "LẦN CUỐI"].map((h, i) => <span key={h} style={{ ...lbl, textAlign: i === 6 ? "right" : "left", whiteSpace: "nowrap" }}>{h}</span>)}
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          {!rows && <div style={{ padding: 14, fontSize: 12.5, color: "#6E6255" }}>Đang tải…</div>}
          {rows && !rows.length && <div style={{ padding: 14, fontSize: 12.5, color: "#6E6255" }}>Không có số nào.</div>}
          {(rows || []).map((r) => (
            <div key={r.id} role="button" tabIndex={0} onClick={() => setOpenRow(r.id)} onKeyDown={(e) => { if (e.key === "Enter") setOpenRow(r.id); }} style={{ display: "grid", gridTemplateColumns: cols, gap: 14, alignItems: "center", minHeight: 50, padding: "8px 14px", borderBottom: "1px solid #EFE9DD", fontSize: 12.5, cursor: "pointer", background: openRow === r.id ? "#FBF8F2" : "transparent" }}>
              <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                <span style={{ fontFamily: MONO, fontSize: 12 }}>{spaced(r.phone)}</span>
                <span style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name || ""}</span>
              </span>
              <span style={{ color: "#4A4239", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.note || ""}</span>
              <span>{status(r)}</span>
              <span>{r.outcome ? <OutcomePill outcome={r.outcome} /> : r.status === "talked" ? <OutcomePill outcome={null} /> : null}</span>
              <span>{r.callback_time || ""}</span>
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.summary}</span>
              <span style={{ fontFamily: MONO, fontSize: 11.5, color: "#6E6255", textAlign: "right" }}>{r.last_hm || ""}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 14px", borderTop: "1px solid #EFE9DD", flex: "none" }}>
          <span style={lbl}>HIỂN THỊ {fmt(rows?.length || 0)} / {fmt(total)} SỐ</span>
          {more}
        </div>
      </div>
      {openRow && <div onClick={() => setOpenRow(null)} style={{ position: "fixed", inset: "56px 0 0 0", background: "rgba(31,27,22,0.18)", zIndex: 3 }} />}
      <div style={{ position: "fixed", right: 0, top: 56, width: 480, bottom: 0, transform: openRow ? "none" : "translateX(100%)", transition: `transform 400ms ${EASE}`, boxShadow: openRow ? "-12px 0 40px rgba(31,27,22,0.16)" : "none", zIndex: 4, background: "#fff" }}>{drawer}</div>
    </div>
  );
}

/** A row of the list: its call (the same drawer as Lịch sử) when Bonia talked to the customer, else its attempts and data. */
function RowPanel({ campaign, rowId, phone, onClose }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    financeApi.row(campaign.id, rowId).then((r) => { if (live) setData(r); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [campaign.id, rowId]);
  if (data?.call) return <CallDrawer item={data.call} phone={phone} onClose={onClose} onChange={(c) => setData((x) => ({ ...x, call: { ...x.call, ...c } }))} />;
  const r = data?.row;
  const lbl = { fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", color: "#6E6255" };
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#fff" }}>
      <div style={{ background: "#FBF5EC", padding: "18px 18px 14px", borderBottom: "1px solid #EFE9DD", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#4A4239" }}>↗ Gọi ra · {campaign.name}</span>
          <button type="button" onClick={onClose} aria-label="Đóng" style={{ border: 0, background: "none", fontSize: 18, lineHeight: 1, cursor: "pointer", color: "#4A4239" }}>✕</button>
        </div>
        <span style={{ fontSize: 20, fontWeight: 600 }}>{r ? r.name || spaced(r.phone) : "…"}</span>
        {r && <span style={{ fontFamily: MONO, fontSize: 11.5, color: "#7B4A2D" }}>{spaced(r.phone)} · <span style={{ color: "#4A4239" }}>{r.status_label}</span></span>}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        {failed && <div style={{ padding: 16, fontSize: 12.5, color: "#A0412D" }}>Không tải được.</div>}
        {r?.attempts?.length > 0 && (
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={lbl}>CÁC LẦN GỌI</span>
            {r.attempts.map((a) => <span key={a.n} style={{ fontFamily: MONO, fontSize: 11.5, color: "#4A4239" }}>Lần {a.n} · {a.hm} · {a.result}</span>)}
          </div>
        )}
        {r && (
          <div style={{ padding: "14px 16px", borderTop: r.attempts?.length ? "1px solid #EFE9DD" : "none", display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={lbl}>TRONG DANH SÁCH</span>
            <div style={{ display: "grid", gridTemplateColumns: "128px minmax(0,1fr)", rowGap: 6, columnGap: 10, fontSize: 12.5 }}>
              {(r.columns || []).filter((col) => r.data?.[col.name]).map((col) => (
                <React.Fragment key={col.name}>
                  <span style={{ color: "#6E6255" }}>{col.name}</span>
                  <span>{col.kind === "phone" ? spaced(r.data[col.name]) : r.data[col.name]}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Chỉnh chiến dịch ──────────────────────────────────────────────────────

function EditDrawer({ open, campaign, phone, onClose, onSaved, onToast }) {
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const file = useRef(null);
  useEffect(() => {
    if (open) {
      const s = campaign.settings;
      setDraft({ concurrency: s.concurrency, days: [...s.days], windows: s.windows.map((w) => [...w]), retries: s.retries, note: s.note || "" });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const up = (p) => setDraft((x) => ({ ...x, ...p }));
  const ended = ["stopped", "done"].includes(campaign.status);
  const okWindows = draft && draft.windows.every(([a, z]) => /^\d{2}:\d{2}$/.test(a) && /^\d{2}:\d{2}$/.test(z) && a < z);
  const apply = async () => {
    if (!okWindows || !draft.days.length) return;
    setSaving(true);
    try {
      const r = await financeApi.update(campaign.id, { settings: { ...draft, holiday_dates: holidayDates() } });
      onSaved(r.campaign, "Đã áp dụng · từ cuộc gọi tiếp theo");
    } catch {
      onToast("Không lưu được. Thử lại.");
    }
    setSaving(false);
  };
  const stop = async () => {
    if (!window.confirm("Dừng hẳn chiến dịch? Bonia không gọi thêm số nào; các cuộc đang gọi kết thúc tự nhiên.")) return;
    setSaving(true);
    try {
      const r = await financeApi.update(campaign.id, { status: "stopped" });
      onSaved(r.campaign, "Đã dừng chiến dịch. Các cuộc đang gọi sẽ kết thúc tự nhiên.");
    } catch {
      onToast("Không dừng được. Thử lại.");
    }
    setSaving(false);
  };
  const addRows = async (f) => {
    setAdding(true);
    try {
      const { headers, rows } = await readSheet(f);
      const phoneCol = campaign.columns.find((col) => col.kind === "phone")?.name;
      if (!phoneCol || !headers.includes(phoneCol)) { onToast(`File cần cột “${phoneCol || "Số điện thoại"}” như danh sách đầu.`, 4200); setAdding(false); return; }
      const r = await financeApi.addRows(campaign.id, rows);
      onToast(`Đã thêm ${fmt(r.added)} khách${r.wrong ? ` · ${fmt(r.wrong)} số sai` : ""}${r.duplicate ? ` · ${fmt(r.duplicate)} số đã có` : ""}`, 4200);
    } catch {
      onToast("Không đọc được file.");
    }
    setAdding(false);
  };
  const lbl = { color: "#6E6255" };
  const time = { height: 30, width: 74, border: "1px solid #D9D0BF", borderRadius: 8, padding: "0 8px", fontFamily: MONO, fontSize: 12.5 };
  return (
    <>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(31,27,22,0.18)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity 250ms ease", zIndex: 20 }} />
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: phone ? "100%" : 440, background: "#fff", borderLeft: "1px solid #D9D0BF", boxShadow: "-12px 0 32px rgba(31,27,22,0.10)", transform: open ? "none" : "translateX(105%)", transition: `transform 380ms ${EASE}`, zIndex: 21, display: "flex", flexDirection: "column", fontSize: 12.5 }}>
        <div style={{ padding: phone ? "calc(var(--tt-top) + 6px) 18px 14px" : "14px 18px", borderBottom: "1px solid #EFE9DD", display: "flex", justifyContent: "space-between", alignItems: "center", flex: "none" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontFamily: SERIF, fontSize: 20 }}>Chỉnh chiến dịch</span>
            <span style={{ color: "#6E6255" }}>Áp dụng cho các cuộc gọi tiếp theo. Cuộc đang gọi không bị ngắt.</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" style={{ width: 32, height: 32, border: 0, borderRadius: 16, background: "transparent", fontSize: 14, cursor: "pointer", color: "#4A4239" }}>✕</button>
        </div>
        {draft && (
          <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <span style={lbl}>Số cuộc gọi cùng lúc</span>
              <div style={{ display: "flex", gap: 5 }}>{CONCURRENCY.map((n) => <Choice key={n} mono on={draft.concurrency === n} onClick={() => up({ concurrency: n })}>{n}</Choice>)}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <span style={lbl}>Ngày gọi</span>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {DAYS.map((l, i) => { const on = draft.days.includes(i + 1); return <Choice key={l} copper on={on} style={{ minWidth: 38, padding: "0 6px" }} onClick={() => up({ days: on ? draft.days.filter((x) => x !== i + 1) : [...draft.days, i + 1].sort() })}>{l}</Choice>; })}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <span style={lbl}>Khung giờ gọi</span>
              {draft.windows.map(([a, z], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input value={a} onChange={(e) => up({ windows: draft.windows.map((w, j) => (j === i ? [e.target.value, w[1]] : w)) })} style={time} />
                  <span style={lbl}>đến</span>
                  <input value={z} onChange={(e) => up({ windows: draft.windows.map((w, j) => (j === i ? [w[0], e.target.value] : w)) })} style={time} />
                  {draft.windows.length > 1 && <button type="button" onClick={() => up({ windows: draft.windows.filter((_, j) => j !== i) })} aria-label="Xoá khung giờ" style={{ border: 0, background: "none", color: "#6E6255", cursor: "pointer", fontSize: 14 }}>✕</button>}
                </div>
              ))}
              {draft.windows.length < 4 && <button type="button" onClick={() => up({ windows: [...draft.windows, ["18:00", "20:00"]] })} style={{ alignSelf: "flex-start", border: 0, background: "none", color: "#7B4A2D", cursor: "pointer", padding: 0, fontSize: 12.5 }}>+ Thêm khung giờ</button>}
              {!okWindows && <span style={{ color: "#A0412D" }}>Giờ viết dạng 08:30, giờ bắt đầu trước giờ kết thúc.</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <span style={lbl}>Khách không nghe máy · gọi lại</span>
              <div style={{ display: "flex", gap: 4 }}>{[0, 1, 2, 3].map((n) => <Choice key={n} on={draft.retries === n} onClick={() => up({ retries: n })}>{n ? `${n} lần` : "Không"}</Choice>)}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <span style={lbl}>Kịch bản</span>
              <select disabled style={{ height: 32, border: "1px solid #D9D0BF", borderRadius: 8, padding: "0 8px", fontSize: 12.5, background: "#fff", color: "#1F1B16" }}><option>Kịch bản gọi ra của công ty</option></select>
              <span style={{ color: "#6E6255", lineHeight: 1.45 }}>Muốn Bonia nói khác đi? Ghi một dòng, ví dụ “Không nhắc lãi suất nếu khách không hỏi”.</span>
              <input value={draft.note} onChange={(e) => up({ note: e.target.value })} placeholder="Dặn thêm Bonia cho chiến dịch này" maxLength={1000} style={{ height: 32, border: "1px solid #D9D0BF", borderRadius: 8, padding: "0 10px", fontSize: 12.5 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingTop: 12, borderTop: "1px solid #EFE9DD" }}>
              <span style={lbl}>Danh sách</span>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span>{fmt(campaign.counts.total)} số · {campaign.columns.length} cột thông tin</span>
                {!ended && <button type="button" disabled={adding} onClick={() => file.current?.click()} style={{ height: 30, padding: "0 12px", border: "1px solid #D9D0BF", borderRadius: 15, background: "#fff", fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap" }}>{adding ? "Đang thêm…" : "+ Thêm khách"}</button>}
                <input ref={file} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) addRows(f); }} />
              </div>
            </div>
          </div>
        )}
        <div style={{ padding: "12px 18px", paddingBottom: phone ? "calc(12px + var(--tt-bot))" : 12, borderTop: "1px solid #EFE9DD", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flex: "none" }}>
          {!ended ? <button type="button" disabled={saving} onClick={stop} style={{ height: 34, padding: 0, border: 0, background: "transparent", color: "#A0412D", fontSize: 12.5, cursor: "pointer" }}>Dừng hẳn chiến dịch</button> : <span style={{ color: "#6E6255" }}>Chiến dịch đã {campaign.status === "done" ? "gọi xong" : "dừng"}.</span>}
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" onClick={onClose} style={{ height: 34, padding: "0 14px", border: "1px solid #D9D0BF", borderRadius: 17, background: "#fff", fontSize: 12.5, cursor: "pointer" }}>Huỷ</button>
            <button type="button" disabled={saving || !okWindows || !draft?.days.length} onClick={apply} style={{ height: 34, padding: "0 18px", border: 0, borderRadius: 17, background: "#7B4A2D", color: "#fff", fontSize: 12.5, fontWeight: 500, cursor: "pointer", opacity: okWindows && draft?.days.length ? 1 : 0.5 }}>Áp dụng</button>
          </div>
        </div>
      </div>
    </>
  );
}

