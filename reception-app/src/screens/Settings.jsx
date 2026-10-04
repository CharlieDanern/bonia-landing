import React, { useEffect, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { QrGrid } from "../components/StoreQR.jsx";
import { ACCOUNT, BILLING_INFO, DEVICES, INVOICE, PAY_HISTORY, PLAN, USAGE } from "../data/account.js";
import { CARDS, FIELDS, SECTIONS, VOICE_COUNT, pendingList } from "../data/settings.js";
import { decimal, groupVnd, vnd } from "../lib/format.js";
import { vietQrPayload } from "../lib/vietqr.js";
import { DeskHeader, PhoneTabs, Switch, useLayout } from "../layout.jsx";
import { copyToClipboard, useApp } from "../state.jsx";

// Cài đặt (handoff 13): one scrolling page, five sections. Values Bonia found
// on the internet start unconfirmed (dashed); typing or picking confirms them.
// Review mode (after the AI search, or while anything is left to check) adds
// the "Còn N mục cần xem lại · Tới mục tiếp theo" bar.

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Source Serif 4', Georgia, serif";
const fmt = (n) => (n === "" || n == null ? "" : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "."));
const VCB_BIN = "970436"; // Vietcombank

/** Voice preview: a recorded sample per voice when present, else the browser's voice. */
function playVoice(i, text, onEnd) {
  const audio = new Audio(`${import.meta.env.BASE_URL}voices/giong-${i}.mp3`);
  audio.onended = onEnd;
  audio.play().catch(() => {
    const ss = window.speechSynthesis;
    if (!ss) return onEnd();
    ss.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = ss.getVoices().find((x) => x.lang?.toLowerCase().startsWith("vi"));
    if (v) u.voice = v;
    u.lang = "vi-VN";
    u.onend = onEnd;
    u.onerror = onEnd;
    ss.speak(u);
    return undefined;
  });
  return () => {
    audio.pause();
    window.speechSynthesis?.cancel();
  };
}

export function Settings() {
  const app = useApp();
  const { phone } = useLayout();
  const [, navigate] = useLocation();
  const search = useSearch();
  const { f, ok, rooms } = app.settings;
  const scRef = useRef(null);
  const [active, setActive] = useState("s1");
  const [openRoom, setOpenRoom] = useState(2);
  const [playing, setPlaying] = useState(null);
  const stopPlay = useRef(null);
  const [payCopied, setPayCopied] = useState(false);
  const [devs, setDevs] = useState(DEVICES);
  const fromSetup = new URLSearchParams(search).has("xem-lai");

  const pend = pendingList(app.settings);
  const pendN = pend.length;
  const review = fromSetup || pendN > 0;

  const jump = (sec, fk) => {
    if (fk && fk.startsWith("room:")) setOpenRoom(Number(fk.split(":")[1]));
    setTimeout(() => {
      const sc = scRef.current;
      if (!sc) return;
      const el = (fk && sc.querySelector(`[data-f="${fk}"]`)) || sc.querySelector(`[data-sec="${sec}"]`);
      if (!el) return;
      const top = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - (phone ? 120 : 24);
      sc.scrollTo({ top, behavior: "smooth" });
    }, 40);
  };

  useEffect(() => {
    if (window.location.hash === "#s5") setTimeout(() => jump("s5"), 300);
    return () => stopPlay.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = () => {
    const sc = scRef.current;
    if (!sc) return;
    let a = "s1";
    SECTIONS.forEach(([k]) => {
      const el = sc.querySelector(`[data-sec="${k}"]`);
      if (el && el.getBoundingClientRect().top - sc.getBoundingClientRect().top < 140) a = k;
    });
    if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 4) a = "s5";
    if (a !== active) setActive(a);
  };

  const dirtyN = (() => {
    const s = JSON.parse(app.settings.saved);
    let c = 0;
    Object.keys(f).forEach((k) => {
      if (JSON.stringify(f[k]) !== JSON.stringify(s.f[k]) || ok[k] !== s.ok[k]) c++;
    });
    rooms.forEach((r, i) => {
      if (JSON.stringify(r) !== JSON.stringify(s.rooms[i])) c++;
    });
    return c;
  })();

  const rowCols = phone ? "minmax(0,1fr)" : "160px minmax(0,1fr)";
  const topH = phone ? "var(--tt-top)" : "64px";
  const revH = review ? (phone ? 56 : 52) : 0;

  // ── one field row ────────────────────────────────────────────────────
  const row = (k) => {
    const d = FIELDS[k];
    const v = f[k];
    const conflictOpen = d.k === "conflict" && v == null;
    const kind = d.k === "conflict" ? (conflictOpen ? "conflict" : "mono") : d.k;
    const needFill = v == null && d.k === "chips";
    const warn = needFill || conflictOpen;
    const set = (val) => app.setF(k, val, true);
    const input = { height: 44, minWidth: 0, border: "1px solid #D9D0BF", borderRadius: 10, padding: "0 12px", fontSize: 14.5, background: "#fff", color: "#1F1B16" };
    return (
      <div data-f={k} style={{ display: "grid", gridTemplateColumns: rowCols, gap: phone ? 6 : 14, alignItems: "center", padding: "8px 10px", borderRadius: 10, border: `1px ${warn || !ok[k] ? "dashed" : "solid"} ${warn ? "#A0412D" : ok[k] ? "#EFE9DD" : "#C9BCA5"}`, background: warn ? "#FBF8F2" : "#fff" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13.5, color: "#4A4239", lineHeight: 1.4 }}>{d.l}</span>
          {needFill && <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", padding: "3px 6px", borderRadius: 4, background: "#F6E7E1", color: "#A0412D" }}>CẦN BẠN ĐIỀN</span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
          {kind === "text" && <input value={v ?? ""} onChange={(e) => set(e.target.value)} style={{ ...input, width: "100%" }} />}
          {kind === "mono" && <input value={v ?? ""} onChange={(e) => set(e.target.value)} style={{ ...input, width: 170, maxWidth: "100%", fontFamily: MONO }} />}
          {kind === "area" && <textarea value={v ?? ""} onChange={(e) => set(e.target.value)} rows={5} placeholder="Ví dụ: chợ Bến Thành đi bộ 10 phút · có két sắt ở quầy · không có bãi giữ xe buýt" style={{ width: "100%", minHeight: 120, resize: "vertical", border: "1px solid #D9D0BF", borderRadius: 10, padding: "10px 12px", fontSize: 14.5, lineHeight: 1.5, background: "#fff", color: "#1F1B16" }} />}
          {(d.k === "chips" || d.k === "multi") && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {d.o.map((o) => {
                const multi = d.k === "multi";
                const on = multi ? v.includes(o) : v === o;
                const go = () => (multi ? set(on ? v.filter((x) => x !== o) : [...v, o]) : set(o));
                const st = multi
                  ? { bg: on ? "#7B4A2D" : "#fff", b: on ? "#7B4A2D" : "#D9D0BF", c: on ? "#fff" : "#6E6255" }
                  : { bg: on ? "#FBF5EC" : "#fff", b: on ? "#7B4A2D" : "#D9D0BF", c: on ? "#7B4A2D" : "#1F1B16" };
                return (
                  <button key={o} type="button" onClick={go} style={{ minHeight: 40, padding: "0 13px", borderRadius: 20, border: `1px solid ${st.b}`, background: st.bg, color: st.c, fontSize: 13.5, whiteSpace: "nowrap" }}>
                    {multi && on ? "✓ " : ""}{o}
                  </button>
                );
              })}
            </div>
          )}
          {conflictOpen && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {d.o.map(([val, src]) => (
                <button key={val} type="button" className="h-clayline" onClick={() => app.setF("checkin", val, true)} style={{ minHeight: 44, padding: "6px 14px", border: "1px solid #D9D0BF", borderRadius: 10, background: "#fff", display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontFamily: MONO, fontSize: 16, color: "#1F1B16" }}>{val}</span>
                  <span style={{ fontSize: 12.5, color: "#6E6255" }}>· {src}</span>
                </button>
              ))}
            </div>
          )}
          {d.k === "toggle" && (
            <button type="button" onClick={() => set(!v)} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#1F1B16", textAlign: "left", minHeight: 44 }}>
              <Switch on={!!v} />
              {d.t}
            </button>
          )}
          {d.k === "voice" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Array.from({ length: VOICE_COUNT }, (_, j) => j + 1).map((i) => {
                const on = v === i;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, minHeight: 48, padding: "4px 6px 4px 12px", borderRadius: 10, border: `1px solid ${on ? "#7B4A2D" : "#EFE9DD"}`, background: on ? "#FBF5EC" : "#fff" }}>
                    <button type="button" onClick={() => set(i)} style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, fontSize: 14.5, color: "#1F1B16", textAlign: "left", minHeight: 40 }}>
                      <span style={{ width: 18, height: 18, borderRadius: 9, border: on ? "5px solid #7B4A2D" : "1.5px solid #C9BCA5", flex: "none" }} />
                      Giọng {i}
                    </button>
                    <button
                      type="button"
                      className="b-ghost"
                      onClick={() => {
                        stopPlay.current?.();
                        if (playing === i) return setPlaying(null);
                        setPlaying(i);
                        stopPlay.current = playVoice(i, f.greeting || "Dạ xin nghe ạ.", () => setPlaying(null));
                        return undefined;
                      }}
                      style={{ height: 36, padding: "0 12px", borderRadius: 18, fontSize: 13, whiteSpace: "nowrap" }}
                    >
                      {playing === i ? "■ Đang phát" : "▶ Nghe thử"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {d.note && (
            <span style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, color: "#6E6255" }}>
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", border: "1px solid #6E6255", borderRadius: 4, padding: "2px 5px" }}>KHÓA</span>
              {d.note}
            </span>
          )}
        </div>
      </div>
    );
  };

  const cards = (sec) =>
    CARDS[sec].map(([title, keys]) => {
      const p = keys.filter((k) => !ok[k] && f[k] != null);
      return (
        <div key={title} style={{ background: "#fff", border: "1px solid #D9D0BF", borderRadius: 14, padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "2px 2px 4px", minHeight: 34 }}>
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>{title}</span>
            {p.length > 0 && <button type="button" className="b-ghost" onClick={() => app.confirmKeys(p)} style={{ height: 36, padding: "0 14px", borderRadius: 18, fontSize: 13, whiteSpace: "nowrap" }}>Đúng hết · {p.length}</button>}
          </div>
          {keys.map((k) => <React.Fragment key={k}>{row(k)}</React.Fragment>)}
        </div>
      );
    });

  // ── rooms (§02) ──────────────────────────────────────────────────────
  const roomsView = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 14px", background: "#fff", border: "1px solid #D9D0BF", borderRadius: 12 }}>
        <button type="button" onClick={() => app.setF("quote", !f.quote, false)} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#1F1B16", textAlign: "left", minHeight: 44 }}>
          <Switch on={!!f.quote} />
          Bonia được báo giá khi khách gọi
        </button>
        <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.14em", color: "#6E6255", whiteSpace: "nowrap" }}>{rooms.reduce((a, r) => a + (Number(r.count) || 0), 0)} PHÒNG · {rooms.length} LOẠI</span>
      </div>
      {rooms.map((r, i) => {
        const open = openRoom === i;
        const num = (key) => (e) => app.setRoom(i, { [key]: e.target.value.replace(/\D/g, "") });
        const txt = (key) => (e) => app.setRoom(i, { [key]: e.target.value });
        const modes = [
          { l: "Theo giờ", on: r.hOn, key: "hOn", cols: "1fr 1fr", inputs: [["2 giờ đầu", "h2", "đ", num], ["Mỗi giờ sau", "hn", "đ", num]] },
          { l: "Qua đêm", on: r.nOn, key: "nOn", cols: phone ? "1fr 1fr" : "1.4fr 1fr 1fr", inputs: [["Giá", "night", "đ", num], ["Từ", "nFrom", "", txt], ["Tới", "nTo", "", txt]] },
          { l: "Theo ngày", on: r.dOn, key: "dOn", cols: "1fr 1fr", inputs: [["Ngày thường", "wd", "đ", num], ["Cuối tuần · T6, T7", "we", "đ", num]] },
        ];
        const parts = [];
        if (r.hOn) parts.push(`Theo giờ ${fmt(r.h2)}đ`);
        if (r.nOn) parts.push(`Qua đêm ${fmt(r.night)}đ`);
        if (r.dOn) parts.push(`Theo ngày ${fmt(r.wd)}–${fmt(r.we)}đ`);
        const facts = [["Tên loại phòng", "name", txt], ["Số phòng", "count", num], ["Diện tích (m²)", "size", num], ["Giường", "bed", txt], ["Tối đa (người)", "max", num], ["Hướng nhìn", "view", txt]];
        return (
          <div key={i} data-f={`room:${i}`} style={{ background: "#fff", border: `1px ${r.ok ? "solid" : "dashed"} ${r.ok ? "#D9D0BF" : "#C9BCA5"}`, borderRadius: 12, overflow: "hidden" }}>
            <button type="button" onClick={() => setOpenRoom(open ? null : i)} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 4, padding: "12px 14px", textAlign: "left", minHeight: 56 }}>
              <span style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", width: "100%" }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#1F1B16" }}>{r.name}</span>
                <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.1em", padding: "4px 8px", borderRadius: 10, whiteSpace: "nowrap", border: `1px solid ${r.ok ? "#D9D0BF" : "#7B4A2D"}`, color: r.ok ? "#4A6B3A" : "#7B4A2D" }}>{r.ok ? "✓" : "XEM LẠI GIÁ"}</span>
              </span>
              <span style={{ fontSize: 12.5, color: "#4A4239", lineHeight: 1.4 }}>{r.count} phòng · {r.size} m² · {r.bed} · tối đa {r.max} người</span>
              <span style={{ fontFamily: MONO, fontSize: 12, color: "#1F1B16", lineHeight: 1.5 }}>{parts.join(" · ")}</span>
            </button>
            {open && (
              <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 14, borderTop: "1px solid #EFE9DD" }}>
                <div style={{ display: "grid", gridTemplateColumns: phone ? "1fr 1fr" : "repeat(auto-fill,minmax(140px,1fr))", gap: 8 }}>
                  {facts.map(([l, k, fn]) => (
                    <label key={k} style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
                      <span style={{ fontSize: 12, color: "#6E6255" }}>{l}</span>
                      <input value={r[k]} onChange={fn(k)} style={{ height: 44, width: "100%", minWidth: 0, border: "1px solid #D9D0BF", borderRadius: 10, padding: "0 12px", fontSize: 14.5, background: "#fff", color: "#1F1B16" }} />
                    </label>
                  ))}
                </div>
                {modes.map((m) => (
                  <div key={m.l} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 12px", borderRadius: 10, background: m.on ? "#FFFFFF" : "#FAF7F1", border: "1px solid #EFE9DD" }}>
                    <button type="button" onClick={() => app.setRoom(i, { [m.key]: !m.on })} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14.5, fontWeight: 600, color: m.on ? "#1F1B16" : "#6E6255", minHeight: 36, width: "max-content" }}>
                      <Switch on={m.on} />
                      {m.l}
                      <span style={{ fontWeight: 400, fontSize: 13, color: "#6E6255" }}>{m.on ? "" : "· tắt"}</span>
                    </button>
                    {m.on && (
                      <div style={{ display: "grid", gridTemplateColumns: m.cols, gap: 8 }}>
                        {m.inputs.map(([l, k, suf, fn]) => (
                          <label key={k} style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
                            <span style={{ fontSize: 12, color: "#6E6255" }}>{l}</span>
                            <span style={{ position: "relative", display: "block" }}>
                              <input value={suf ? fmt(r[k]) : r[k]} onChange={fn(k)} inputMode={suf ? "numeric" : "text"} style={{ height: 44, width: "100%", minWidth: 0, border: "1px solid #D9D0BF", borderRadius: 10, padding: "0 28px 0 12px", fontFamily: MONO, fontSize: 14.5, background: "#fff", textAlign: "right", color: "#1F1B16" }} />
                              <span style={{ position: "absolute", right: 11, top: 13, fontSize: 13, color: "#6E6255" }}>{suf}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {!r.ok && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button type="button" className="b-primary" onClick={() => app.setRoom(i, { ok: true })} style={{ height: 44, padding: "0 18px", borderRadius: 22, fontSize: 14 }}>Đúng giá này</button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      <button type="button" style={{ height: 48, border: "1px dashed #C9BCA5", borderRadius: 12, fontSize: 14, color: "#4A4239", textAlign: "center" }}>+ Thêm loại phòng</button>
    </div>
  );

  // ── account (§05) ────────────────────────────────────────────────────
  const card = { background: "#fff", border: "1px solid #D9D0BF", borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column" };
  const accountView = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ ...card, gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>{PLAN.name}</span>
          <span style={{ fontFamily: MONO, fontSize: 15 }}>{groupVnd(PLAN.price)}đ/tháng</span>
        </div>
        <span style={{ fontSize: 13.5, color: "#4A4239", lineHeight: 1.5 }}>Chưa gồm VAT · gồm {PLAN.minutes} phút · phút vượt {groupVnd(PLAN.overPerMin)}đ/phút, tính theo giây</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
            <span>{USAGE.month}</span>
            <span style={{ fontFamily: MONO }}>{decimal(USAGE.used)} / {PLAN.minutes} phút</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "#E4DCCB", overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, (USAGE.used / PLAN.minutes) * 100)}%`, height: "100%", background: "#7B4A2D" }} />
          </div>
        </div>
      </div>
      <div style={{ ...card, gap: 12, borderColor: INVOICE.paid ? "#D9D0BF" : "#EBCFC4" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>Hóa đơn {INVOICE.month.toLowerCase()}</span>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", padding: "4px 8px", borderRadius: 10, background: INVOICE.paid ? "#EEF0E6" : "#F6E7E1", color: INVOICE.paid ? "#4A6B3A" : "#A0412D" }}>{INVOICE.paid ? "ĐÃ THANH TOÁN" : "CHƯA THANH TOÁN"}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: "4px 16px", fontSize: 13.5 }}>
          {INVOICE.lines.map(([l, v]) => (
            <React.Fragment key={l}>
              <span style={{ color: "#6E6255" }}>{l}</span>
              <span style={{ fontFamily: MONO, textAlign: "right" }}>{vnd(v)}</span>
            </React.Fragment>
          ))}
          <span style={{ fontWeight: 600, paddingTop: 4 }}>Tổng</span>
          <span style={{ fontFamily: MONO, textAlign: "right", fontWeight: 600, paddingTop: 4 }}>{vnd(INVOICE.total)}</span>
        </div>
        {!INVOICE.paid && (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start", padding: 12, borderRadius: 12, background: "#FAF7F1" }}>
            <QrGrid text={vietQrPayload({ bin: VCB_BIN, account: INVOICE.account, amount: INVOICE.total, content: INVOICE.content })} size={168} pad={10} />
            <div style={{ flex: 1, minWidth: 180, display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: "6px 12px", fontSize: 13.5, alignContent: "start" }}>
              <span style={{ color: "#6E6255" }}>Ngân hàng</span><span>{INVOICE.bank}</span>
              <span style={{ color: "#6E6255" }}>Số tài khoản</span><span style={{ fontFamily: MONO }}>{INVOICE.account}</span>
              <span style={{ color: "#6E6255" }}>Chủ tài khoản</span><span>{INVOICE.holder}</span>
              <span style={{ color: "#6E6255" }}>Nội dung</span><span style={{ fontFamily: MONO }}>{INVOICE.content}</span>
              <span />
              <button type="button" className="b-ghost" onClick={() => { copyToClipboard(INVOICE.content); setPayCopied(true); setTimeout(() => setPayCopied(false), 1600); }} style={{ height: 40, width: "max-content", padding: "0 16px", borderRadius: 20, fontSize: 13.5, marginTop: 4 }}>{payCopied ? "Đã chép" : "Sao chép nội dung"}</button>
            </div>
          </div>
        )}
      </div>
      <div style={{ ...card, gap: 8 }}>
        <span style={{ fontSize: 14.5, fontWeight: 600 }}>Thông tin xuất hóa đơn</span>
        <div style={{ display: "grid", gridTemplateColumns: rowCols, gap: "6px 14px", fontSize: 13.5, alignItems: "center" }}>
          {[["Tên đơn vị", BILLING_INFO.company, false], ["Mã số thuế", BILLING_INFO.taxId, true], ["Email nhận hóa đơn", BILLING_INFO.email, false]].map(([l, v, mono]) => (
            <React.Fragment key={l}>
              <span style={{ color: "#6E6255" }}>{l}</span>
              <input defaultValue={v} style={{ height: 44, border: "1px solid #D9D0BF", borderRadius: 10, padding: "0 12px", fontSize: 14, background: "#fff", minWidth: 0, fontFamily: mono ? MONO : undefined }} />
            </React.Fragment>
          ))}
        </div>
      </div>
      <div style={{ ...card, gap: 4 }}>
        <span style={{ fontSize: 14.5, fontWeight: 600, paddingBottom: 4 }}>Lịch sử thanh toán</span>
        {PAY_HISTORY.map((p) => (
          <div key={p.m} style={{ display: "flex", justifyContent: "space-between", gap: 10, minHeight: 44, alignItems: "center", borderTop: "1px solid #EFE9DD", fontSize: 13.5 }}>
            <span>{p.m}</span>
            <span style={{ fontFamily: MONO }}>{vnd(p.v)}</span>
            <span style={{ color: p.paid ? "#4A6B3A" : "#A0412D", whiteSpace: "nowrap" }}>{p.s}</span>
          </div>
        ))}
      </div>
      <div style={{ ...card, gap: 6 }}>
        <span style={{ fontSize: 14.5, fontWeight: 600, paddingBottom: 4 }}>Tài khoản</span>
        <div style={{ display: "grid", gridTemplateColumns: rowCols, gap: "8px 14px", fontSize: 13.5, alignItems: "center" }}>
          <span style={{ color: "#6E6255" }}>Số đăng nhập</span><span style={{ fontFamily: MONO, fontSize: 14.5 }}>{ACCOUNT.login}</span>
          <span style={{ color: "#6E6255" }}>Lĩnh vực</span><span>{ACCOUNT.sector} · <span style={{ color: "#6E6255" }}>liên hệ hỗ trợ để đổi</span></span>
          <span style={{ color: "#6E6255" }}>Mã giới thiệu</span><span>Đăng ký qua: {ACCOUNT.referral.via} · <span style={{ fontFamily: MONO }}>{ACCOUNT.referral.code}</span></span>
        </div>
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: "#6E6255", paddingTop: 10 }}>MÁY ĐANG ĐĂNG NHẬP</span>
        {devs.map((d) => {
          const isThis = d.phone === phone;
          return (
            <div key={d.n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, minHeight: 52, borderTop: "1px solid #EFE9DD" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{d.n}</span>
                <span style={{ fontSize: 12, color: "#6E6255" }}>{isThis ? "Đang dùng" : d.s}</span>
              </div>
              {isThis ? (
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", color: "#4A6B3A" }}>MÁY NÀY</span>
              ) : (
                <button type="button" className="b-ghost" onClick={() => setDevs((ds) => ds.filter((x) => x !== d))} style={{ height: 40, padding: "0 14px", borderRadius: 20, fontSize: 13, whiteSpace: "nowrap" }}>Đăng xuất</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── page ─────────────────────────────────────────────────────────────
  const index = SECTIONS.map(([k, num, l]) => {
    const c = pend.filter((p) => p[0] === k).length;
    const acc = k === "s5";
    const unpaid = acc && !INVOICE.paid;
    return {
      k, num, l,
      mark: unpaid ? `Chưa thanh toán ${INVOICE.month.toLowerCase()}` : c ? `${c} cần xem lại` : "✓ Đã xong",
      mc: unpaid ? "#A0412D" : c ? "#7B4A2D" : "#4A6B3A",
      badge: unpaid ? "!" : c ? String(c) : acc ? "" : "✓",
      go: () => { setActive(k); jump(k); },
    };
  });
  const revGo = () => {
    if (pendN) {
      const [sec, fk] = pend[0];
      setActive(sec);
      jump(sec, fk);
    } else navigate("/thu-bonia");
  };

  return (
    <div style={{ position: "absolute", inset: 0, background: "#F2EEE6", overflow: "hidden" }}>
      {!phone && <DeskHeader active={2} solid />}
      {review && (
        <div style={{ position: "absolute", left: 0, right: 0, top: topH, height: revH, zIndex: 3, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: `0 ${phone ? 16 : 40}px`, background: pendN ? "#FBF5EC" : "#EEF0E6", borderBottom: "1px solid #D9D0BF" }}>
          <span style={{ fontSize: phone ? 14.5 : 15, fontWeight: 600, color: pendN ? "#7B4A2D" : "#4A6B3A" }}>{pendN ? `Còn ${pendN} mục cần xem lại` : "Đã xem lại hết"}</span>
          <button type="button" className="b-primary" onClick={revGo} style={{ height: 40, padding: "0 16px", borderRadius: 20, fontSize: 14, whiteSpace: "nowrap" }}>{pendN ? (phone ? "Mục tiếp" : "Tới mục tiếp theo") : "Thử Bonia →"}</button>
        </div>
      )}
      <div ref={scRef} onScroll={onScroll} style={{ position: "absolute", left: 0, right: 0, top: `calc(${topH} + ${revH}px)`, bottom: phone ? "calc(57px + var(--tt-bot))" : 0, overflow: "auto" }}>
        {phone && (
          <div style={{ position: "sticky", top: 0, zIndex: 2, background: "#F2EEE6", padding: "6px 16px 10px", display: "flex", flexDirection: "column", gap: 8, borderBottom: "1px solid #E4DCCB" }}>
            <span style={{ fontFamily: SERIF, fontSize: 26 }}>Cài đặt</span>
            <div className="tt-scroll-x" style={{ display: "flex", gap: 6, margin: "0 -16px", padding: "0 16px" }}>
              {index.map((it) => {
                const on = active === it.k;
                return (
                  <button key={it.k} type="button" onClick={it.go} style={{ height: 40, padding: "0 13px", borderRadius: 20, border: `1px solid ${on ? "#1F1B16" : "#D9D0BF"}`, background: on ? "#1F1B16" : "#fff", color: on ? "#F7F3EC" : "#1F1B16", fontSize: 13.5, whiteSpace: "nowrap", flex: "none" }}>
                    {it.l}
                    <span style={{ fontFamily: MONO, fontSize: 11, marginLeft: 5, color: it.mc }}>{it.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: phone ? "14px 16px 120px" : "28px 40px 120px", display: "grid", gridTemplateColumns: phone ? "minmax(0,1fr)" : "210px minmax(0,1fr)", gap: 44, alignItems: "start" }}>
          {!phone && (
            <aside style={{ position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 2 }}>
              {index.map((it) => {
                const on = active === it.k;
                return (
                  <button key={it.k} type="button" onClick={it.go} className="h-white" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3, padding: "10px 12px", borderRadius: 10, background: on ? "#FFFFFF" : "transparent", textAlign: "left" }}>
                    <span style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, color: "#6E6255", width: 18 }}>{it.num}</span>
                      <span style={{ fontSize: 14.5, fontWeight: on ? 600 : 400 }}>{it.l}</span>
                    </span>
                    <span style={{ paddingLeft: 28, fontSize: 11.5, color: it.mc }}>{it.mark}</span>
                  </button>
                );
              })}
            </aside>
          )}
          <main style={{ display: "flex", flexDirection: "column", gap: 36, minWidth: 0 }}>
            {SECTIONS.map(([k, num, title]) => (
              <section key={k} data-sec={k} id={k} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", color: "#6E6255" }}>{num}</span>
                  <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 24 }}>{title}</h2>
                </div>
                {k === "s2" && roomsView()}
                {CARDS[k] && cards(k)}
                {k === "s5" && accountView()}
              </section>
            ))}
          </main>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: phone ? "calc(57px + var(--tt-bot))" : 0, zIndex: 4, display: "flex", justifyContent: "center", padding: `10px ${phone ? 16 : 40}px`, background: "#fff", borderTop: "1px solid #D9D0BF", transform: dirtyN ? "translateY(0)" : "translateY(120%)", opacity: dirtyN ? 1 : 0, pointerEvents: dirtyN ? "auto" : "none", transition: "transform 280ms cubic-bezier(.2,.8,.2,1), opacity 200ms ease" }}>
        <div style={{ width: "100%", maxWidth: 1100, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13.5 }}>{dirtyN} thay đổi chưa lưu</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="b-ghost" onClick={app.discard} style={{ height: 44, padding: "0 14px", borderRadius: 22, fontSize: 13.5, whiteSpace: "nowrap" }}>Bỏ thay đổi</button>
            <button type="button" className="b-primary" onClick={app.save} style={{ height: 44, padding: "0 22px", borderRadius: 22, fontSize: 14 }}>Lưu</button>
          </div>
        </div>
      </div>
      {phone && <PhoneTabs active={2} />}
    </div>
  );
}
