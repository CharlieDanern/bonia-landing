import React, { useCallback, useEffect, useRef, useState } from "react";
import { Orb } from "../components/Orb.jsx";
import { Bubble } from "../components/Request.jsx";
import { startRealCall } from "../test-call/realCall.js";
import { api } from "../api.js";
import { useLayout } from "../layout.jsx";
import { useApp } from "../state.jsx";
import { BONIA_MARK } from "../lib/assets.js";
import { EASE, MONO, SERIF, dims } from "../ui.js";
import { Reader } from "./Reader.jsx";
import { Select } from "./Select.jsx";
import { RecentCalls, ResultCard, mmss } from "./Result.jsx";

// The partner demo playground (founder 2026-10-13): a reseller shows Bonia to his clients. He picks one of 8 sectors,
// types the business (name, address, opening hours, what it sells and its prices), picks a voice and the greeting,
// and calls Bonia from this browser: gpt-realtime + ElevenLabs (voice agent src/demo), answering as that business.
// What is typed is kept per sector (backend services/playground.ts, saved as you type); each sector starts from a
// fictional sample. The call shows its lines and what Bonia recorded as they happen.
// Phase 2: a menu, price list or promotion dropped on "Thông tin cho Bonia" is read by Bonia ("Bonia đã đọc",
// ./Reader.jsx). Phase 3: after the call, the result card the owner would get (./Result.jsx), and the account's last
// calls to open again.
// Kịch bản (founder 2026-10-13: "kịch bản only for calls-out. calls-in are free"): Gọi vào, the tester calls as any
// customer; or one of the sector's Gọi ra scenarios (the voice agent's, edited in the founder's prompt editor): Bonia
// calls the tester, who plays the customer the card describes.

const SAVE_MS = 800;
const ERRORS = {
  too_many: "Tài khoản này đã gọi thử nhiều lần hôm nay. Mai thử tiếp nhé.",
  name: "Nhập tên doanh nghiệp trước khi gọi.",
  network: "Không kết nối được tới Bonia. Thử lại sau ít phút.",
};
const eyebrow = { fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", color: "#6E6255" };
const RESULT_WAIT_MS = 45_000; // the result card is written after the call (a few seconds)

export function Playground() {
  const app = useApp();
  const { phone, reduce } = useLayout();
  const d = dims(phone);
  const [pg, setPg] = useState(null); // the backend's view: { sector, voice, sectors, catalog, voices, limits }
  const [loadErr, setLoadErr] = useState("");
  const [saving, setSaving] = useState("saved"); // saved | dirty | saving | error
  const [call, setCall] = useState({ live: false, phase: "idle", lines: [], records: [], err: "", t0: 0, level: 0, done: false });
  const [now, setNow] = useState(Date.now());
  const [pickups, setPickups] = useState(0);
  const [result, setResult] = useState({ state: "idle" }); // the result card: idle | waiting | done | none
  const [resultUuid, setResultUuid] = useState(null);
  const [recent, setRecent] = useState([]);
  const C = useRef(call);
  C.current = call;
  const R = useRef({});
  const pgRef = useRef(pg);
  pgRef.current = pg;
  const patch = (p) => setCall((s) => ({ ...s, ...(typeof p === "function" ? p(s) : p) }));

  const load = useCallback(() => {
    setLoadErr("");
    api.playground().then(setPg).catch((e) => setLoadErr(e?.status === 403 ? "Tài khoản này không mở được playground." : ERRORS.network));
  }, []);
  useEffect(load, [load]);
  const loadRecent = useCallback(() => { api.playgroundCalls().then((r) => setRecent(r.calls || [])).catch(() => {}); }, []);
  useEffect(loadRecent, [loadRecent]);

  // what the backend keeps: the picks and the current sector's text
  const bodyOf = (p) => {
    const s = p.sectors[p.sector];
    return { sector: p.sector, voice: p.voice, data: { business: s.business, knowledge: s.knowledge, greeting: s.greeting, scenario: s.scenario || null } };
  };
  const saveNow = useCallback(async () => {
    clearTimeout(R.current.saveT);
    const p = pgRef.current;
    if (!p || !p.sectors[p.sector].business.name.trim()) return;
    setSaving("saving");
    try {
      await api.savePlayground(bodyOf(p));
      setSaving((s) => (s === "saving" ? "saved" : s));
    } catch {
      setSaving("error");
    }
  }, []);
  const change = (fn) => {
    setPg((p) => fn(p));
    setSaving("dirty");
    clearTimeout(R.current.saveT);
    R.current.saveT = setTimeout(saveNow, SAVE_MS);
  };
  useEffect(() => () => clearTimeout(R.current.saveT), []);
  const setField = (k, v) => change((p) => {
    const s = p.sectors[p.sector];
    const next = k in s.business ? { ...s, business: { ...s.business, [k]: v } } : { ...s, [k]: v };
    return { ...p, sectors: { ...p.sectors, [p.sector]: next } };
  });
  const pickSector = (id) => change((p) => ({ ...p, sector: id }));
  const pickVoice = (id) => change((p) => ({ ...p, voice: id }));
  const useSample = () => change((p) => {
    const sample = p.catalog.find((c) => c.id === p.sector).sample;
    return { ...p, sectors: { ...p.sectors, [p.sector]: { ...sample, scenario: p.sectors[p.sector].scenario || null } } };
  });

  // ── the call ────────────────────────────────────────────────────────────
  const teardown = () => {
    R.current.call?.stop();
    R.current.call = null;
    clearInterval(R.current.tick);
  };
  useEffect(() => () => { teardown(); clearTimeout(R.current.pollT); }, []);
  // the result card: the call server reports the call once its card is written; asked for until then
  const waitResult = (uuid) => {
    clearTimeout(R.current.pollT);
    const until = Date.now() + RESULT_WAIT_MS;
    setResultUuid(uuid);
    setResult({ state: "waiting" });
    const ask = async () => {
      if (R.current.resultFor !== uuid) return;
      try {
        const r = await api.playgroundCallOf(uuid);
        if (R.current.resultFor !== uuid) return;
        setResult({ state: "done", call: r.call });
        loadRecent();
        return;
      } catch { /* not reported yet */ }
      if (Date.now() > until) return setResult({ state: "none" });
      R.current.pollT = setTimeout(ask, 1500);
    };
    R.current.resultFor = uuid;
    R.current.pollT = setTimeout(ask, 2500);
  };
  const finish = () => {
    if (R.current.ended) return;
    R.current.ended = true;
    teardown();
    patch({ live: false, phase: "idle", level: 0, done: true, len: Math.max(0, Math.round((Date.now() - C.current.t0) / 1000)) });
    if (R.current.uuid) waitResult(R.current.uuid);
  };
  // a past call, opened again from Cuộc gọi gần đây
  const openPast = async (uuid) => {
    if (C.current.live) return;
    try {
      const { call: c } = await api.playgroundCallOf(uuid);
      R.current.resultFor = uuid;
      clearTimeout(R.current.pollT);
      setResultUuid(uuid);
      setResult({ state: "done", call: c });
      patch({
        live: false, done: true, err: "", len: Math.round(c.duration_ms / 1000), title: c.business_name, out: c.direction === "outbound" ? c.scenario || "Gọi ra" : null,
        lines: (c.transcript || []).map((t) => ({ w: t.who === "bonia" ? "B" : "K", text: t.text })),
        records: (c.records || []).map((r) => ({ id: r.id, type: r.type || "Ghi nhận" })),
      });
    } catch { /* gone */ }
  };
  const start = async () => {
    if (C.current.live || !pg) return;
    const cur = pg.sectors[pg.sector];
    if (!cur.business.name.trim()) return patch({ err: ERRORS.name, done: false });
    R.current.ended = false;
    R.current.uuid = null;
    R.current.resultFor = null;
    clearTimeout(R.current.pollT);
    setResult({ state: "idle" });
    setResultUuid(null);
    setPickups((n) => n + 1);
    const t0 = Date.now();
    const sc = (pg.scenarios?.[pg.sector] || []).find((x) => x.id === cur.scenario) || null;
    patch({ live: true, phase: "connecting", lines: [], records: [], err: "", t0, level: 0, done: false, title: cur.business.name, out: sc ? sc.name : null });
    setNow(t0);
    R.current.tick = setInterval(() => setNow(Date.now()), 500);
    clearTimeout(R.current.saveT);
    let ticket;
    try {
      ticket = await api.playgroundCall(bodyOf(pg));
      setSaving("saved");
    } catch (e) {
      patch({ err: ERRORS[e?.error] || ERRORS.network });
      setTimeout(finish, 2200);
      return;
    }
    try {
      R.current.call = await startRealCall({
        url: ticket.url,
        ticket: ticket.ticket,
        on: {
          state: (phase) => { if (C.current.live && C.current.phase !== phase) patch({ phase }); },
          // m.uuid: this call, to ask for its result card once it is over
          ready: (m) => { R.current.uuid = m?.uuid || null; const at = Date.now(); patch({ t0: at }); setNow(at); },
          level: (lv) => { if (Math.abs(lv - C.current.level) > 0.01) patch({ level: lv }); },
          // gpt-realtime + ElevenLabs sends whole lines: one bubble each
          transcript: (who, text) => {
            const t = String(text || "").trim();
            if (t) patch((s) => ({ lines: [...s.lines, { w: who === "bonia" ? "B" : "K", text: t }] }));
          },
          request: (m) => patch((s) => ({ records: [...s.records.filter((r) => r.id !== m.id), { id: m.id, type: m.card?.type || "Ghi nhận" }] })),
          end: () => finish(),
          error: (msg) => patch({ err: msg }),
        },
      });
    } catch (e) {
      patch({ err: e?.name === "NotAllowedError" ? "Cần cho phép micro để gọi thử." : "Không bắt đầu được cuộc gọi thử. Thử lại sau." });
      setTimeout(finish, 1800);
    }
    return undefined;
  };

  // keep the newest line in view
  const listRef = useRef(null);
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [call.lines.length, call.records.length, result.state]);

  if (!pg) {
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 12, alignItems: "center", justifyContent: "center", background: "#F2EEE6", color: "#4A4239", fontSize: 14 }}>
        {loadErr ? (
          <>
            <span>{loadErr}</span>
            <button type="button" className="b-ghost" onClick={loadErr.includes("không mở") ? app.signOut : load} style={{ height: 40, padding: "0 18px", borderRadius: 20 }}>{loadErr.includes("không mở") ? "Đăng xuất" : "Thử lại"}</button>
          </>
        ) : <span>Đang mở…</span>}
      </div>
    );
  }

  const cur = pg.sectors[pg.sector];
  const entry = pg.catalog.find((c) => c.id === pg.sector);
  const sectorName = entry?.name || "";
  const edited = !!entry && JSON.stringify([cur.business, cur.knowledge, cur.greeting]) !== JSON.stringify([entry.sample.business, entry.sample.knowledge, entry.sample.greeting]);
  // the Gọi ra scenario picked (one the sector no longer has: Gọi vào)
  const scenarios = pg.scenarios?.[pg.sector] || [];
  const picked = scenarios.find((x) => x.id === cur.scenario) || null;
  const fill = (t, sc) => t.replace(/\{\{name\}\}/g, cur.business.name || "…").replace(/\{\{customer\}\}/g, sc.customer);
  const live = call.live;
  const showPanel = live || call.done;
  const sec = Math.max(0, Math.floor((now - call.t0) / 1000));
  const talking = call.phase === "listening" && call.level > 0.045;
  const mood = !live || call.phase === "connecting" ? "idle" : call.phase === "speaking" ? "bonia" : talking ? "guest" : "idle";
  const phaseLabel = { connecting: "ĐANG KẾT NỐI · BONIA SẮP NHẤC MÁY…", speaking: "BONIA ĐANG NÓI", listening: talking ? "BẠN ĐANG NÓI" : "BONIA ĐANG NGHE · MỜI BẠN NÓI" }[call.phase] || "";
  const phaseC = call.phase === "listening" ? "#4A6B3A" : "#7B4A2D";
  const savedLabel = { saved: "ĐÃ LƯU", dirty: "ĐANG SỬA…", saving: "ĐANG LƯU…", error: "CHƯA LƯU ĐƯỢC" }[saving];

  // ── the form ────────────────────────────────────────────────────────────
  const input = { width: "100%", height: d.input, border: "1px solid #D9D0BF", borderRadius: 8, padding: "0 10px", fontSize: d.fs.body, background: "#fff", color: "#1F1B16" };
  const area = { ...input, height: "auto", padding: "7px 10px", lineHeight: 1.5, resize: "vertical" };
  const field = (k, label, opts = {}) => (
    <label key={k} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={eyebrow}>{label}</span>
      {opts.rows ? (
        <textarea rows={opts.rows} value={cur.business[k] ?? cur[k]} maxLength={pg.limits[k]} placeholder={opts.ph || ""} onChange={(e) => setField(k, e.target.value)} style={area} />
      ) : (
        <input value={cur.business[k]} maxLength={pg.limits[k]} placeholder={opts.ph || ""} onChange={(e) => setField(k, e.target.value)} style={input} />
      )}
    </label>
  );
  const section = (title, children, right = null, after = null) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontFamily: SERIF, fontSize: phone ? 18 : 19 }}>{title}</span>
        {right}
      </div>
      {children}
      {after}
    </div>
  );

  const sectors = section("Ngành", (
    <Select d={d} label="Ngành" value={pg.sector} disabled={live} onChange={pickSector}
      options={pg.catalog.map((c) => ({ value: c.id, label: c.name, hint: c.hint }))} />
  ));
  // Kịch bản: every choice on show (Gọi vào, then the sector's Gọi ra scenarios); the picked one opens up
  const scenarioCard = (sc) => {
    const on = sc ? picked?.id === sc.id : !picked;
    const tag = (
      <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.14em", padding: "2px 6px", borderRadius: 6, flex: "none", whiteSpace: "nowrap",
        color: sc ? "#7B4A2D" : "#4A6B3A", background: sc ? "#FBF0E4" : "#EEF3EA", border: `1px solid ${sc ? "#E9D3BC" : "#C9D8BF"}` }}>{sc ? "GỌI RA" : "GỌI VÀO"}</span>
    );
    return (
      <button key={sc?.id || "in"} type="button" disabled={live} onClick={() => setField("scenario", sc ? sc.id : null)}
        style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: "left", padding: "10px 12px", borderRadius: 10, border: `1px solid ${on ? "#7B4A2D" : "#D9D0BF"}`, background: on ? "#FBF5EC" : "#fff", opacity: live && !on ? 0.5 : 1, boxShadow: on ? "0 0 0 3px rgba(123,74,45,0.08)" : "none" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {tag}
          <span style={{ fontSize: d.fs.body, fontWeight: 600, color: on ? "#7B4A2D" : "#1F1B16", lineHeight: 1.3 }}>{sc ? sc.name : "Khách gọi tới"}</span>
        </span>
        <span style={{ fontSize: d.fs.tiny, color: "#6E6255", lineHeight: 1.45 }}>{sc ? `Bonia gọi cho ${sc.customer}.` : "Bạn gọi như một khách, hỏi gì cũng được."}</span>
        {on && sc && (
          <span style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 6, borderTop: "1px solid #EADFCD" }}>
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={eyebrow}>BẠN ĐÓNG VAI</span>
              <span style={{ fontSize: d.fs.small, color: "#1F1B16", lineHeight: 1.5 }}>{sc.hint}</span>
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={eyebrow}>BONIA MỞ ĐẦU</span>
              <span style={{ fontSize: d.fs.small, color: "#4A4239", lineHeight: 1.5, fontStyle: "italic" }}>“{fill(sc.opening, sc)}”</span>
            </span>
          </span>
        )}
      </button>
    );
  };
  const script = section("Kịch bản", (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {scenarioCard(null)}
      {scenarios.map((sc) => scenarioCard(sc))}
    </div>
  ));
  const business = section("Doanh nghiệp", (
    <>
      {field("name", "TÊN", { ph: "Tên khách hàng nghe Bonia nói" })}
      {field("address", "ĐỊA CHỈ")}
      {field("hours", "GIỜ LÀM VIỆC", { ph: "Ví dụ: 8:00–21:00 hằng ngày" })}
      {field("about", "GIỚI THIỆU NGẮN", { rows: 2 })}
    </>
  ), edited ? <button type="button" disabled={live} onClick={useSample} style={{ fontSize: d.fs.small, color: "#7B4A2D" }}>Dùng lại mẫu</button> : <span style={eyebrow}>MẪU</span>);
  const voice = section("Giọng và lời chào", (
    <>
      <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={eyebrow}>GIỌNG</span>
        <Select d={d} label="Giọng" value={pg.voice} disabled={live} onChange={pickVoice} options={pg.voices.map((v) => ({ value: v.id, label: v.label }))} />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={eyebrow}>LỜI CHÀO KHI KHÁCH GỌI VÀO</span>
        <textarea rows={2} value={cur.greeting} maxLength={pg.limits.greeting} placeholder={`Dạ ${cur.business.name || "…"} xin nghe ạ.`} onChange={(e) => setField("greeting", e.target.value)} style={area} />
        {picked && <span style={{ fontSize: d.fs.tiny, color: "#6E6255", lineHeight: 1.45 }}>Kịch bản gọi ra: Bonia mở đầu bằng câu của kịch bản.</span>}
      </label>
    </>
  ));
  const knowledge = section("Thông tin cho Bonia", (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: d.fs.small, color: "#4A4239", lineHeight: 1.5 }}>Sản phẩm, dịch vụ, bảng giá, khuyến mãi, chính sách. Bonia chỉ trả lời theo phần này.</span>
      <textarea rows={phone ? 10 : 14} value={cur.knowledge} maxLength={pg.limits.knowledge} onChange={(e) => setField("knowledge", e.target.value)} style={{ ...area, fontSize: d.fs.small }} />
      <span style={{ ...eyebrow, alignSelf: "flex-end" }}>{cur.knowledge.length.toLocaleString("vi-VN")} / {pg.limits.knowledge.toLocaleString("vi-VN")} KÝ TỰ</span>
    </label>
  ), null, (
    <Reader d={d} business={cur.business.name} sector={pg.sector} isSample={!!entry && cur.knowledge === entry.sample.knowledge} disabled={live}
      onAdd={(parts, mode) => {
        // each file its own section, under its title; nothing is cut: too long, nothing is added and the card says so
        const block = parts.map((x) => `## ${x.title.trim() || "Thông tin"}\n${x.text.trim()}`).join("\n\n");
        const next = mode === "replace" || !cur.knowledge.trim() ? block : `${cur.knowledge.trim()}\n\n${block}`;
        if (next.length > pg.limits.knowledge) return "full";
        setField("knowledge", next);
        return null;
      }} />
  ));
  const form = (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      {sectors}
      {script}
      {business}
      {voice}
      {knowledge}
    </div>
  );

  // ── the call panel ──────────────────────────────────────────────────────
  const startBtn = (
    <button type="button" className="b-primary" onClick={start} style={{ height: phone ? 44 : 42, padding: "0 26px", borderRadius: 22, fontSize: phone ? 14.5 : 14 }}>{picked ? "▶ Bonia gọi cho bạn" : call.done ? "▶ Gọi lại" : "▶ Gọi thử"}</button>
  );
  const panel = (
    <div style={{ height: "100%", background: "#fff", border: "1px solid #D9D0BF", borderRadius: phone ? "18px 18px 0 0" : 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "9px 12px 9px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: live ? "#F1F3EA" : "#F3F3EC", borderBottom: "1px solid #E2E6D6", flex: "none" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", color: live ? "#4A6B3A" : "#4A4239" }}>{live ? (call.out ? "BONIA ĐANG GỌI RA" : "ĐANG GỌI THỬ") : call.out ? "CUỘC GỌI RA ĐÃ XONG" : "CUỘC GỌI THỬ ĐÃ XONG"}</span>
          <span style={{ fontSize: 15, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{call.title || cur.business.name}</span>
          {call.out && <span style={{ fontSize: d.fs.tiny, color: "#6E6255", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Kịch bản: {call.out}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: MONO, fontSize: 11.5, color: "#4A4239" }}>{live ? mmss(sec) : mmss(call.len || 0)}</span>
          {!live && (
            <button type="button" onClick={() => patch({ done: false })} aria-label="Đóng" className="h-line" style={{ width: 34, height: 34, borderRadius: 17, fontSize: 14, color: "#4A4239", textAlign: "center" }}>✕</button>
          )}
        </div>
      </div>
      <div ref={listRef} style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", flexDirection: "column", gap: 8, padding: "12px 14px" }}>
        {call.lines.map((t, i) => <Bubble key={i} who={t.w} text={t.text} />)}
        {(call.records.length > 0 || !live) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 10, borderTop: "1px solid #EFE9DD", marginTop: 4, flex: "none" }}>
            <span style={eyebrow}>BONIA ĐÃ GHI</span>
            {call.records.length ? call.records.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 11px", borderRadius: 9, border: "1px solid #E4DCCB", background: "#FBF7F0" }}>
                <span style={{ fontSize: d.fs.body, fontWeight: 600, color: "#1F1B16" }}>{r.type}</span>
                <span style={{ fontFamily: MONO, fontSize: d.fs.tiny, color: "#6E6255" }}>{r.id}</span>
              </div>
            )) : <span style={{ fontSize: d.fs.small, color: "#6E6255", lineHeight: 1.5 }}>Không có gì để ghi: cuộc gọi chỉ hỏi thông tin.</span>}
          </div>
        )}
        {!live && <ResultCard d={d} result={result} uuid={resultUuid} />}
      </div>
      <div style={{ padding: `8px 12px ${phone ? "max(22px, var(--tt-bot))" : "12px"}`, borderTop: "1px solid #EFE9DD", display: "flex", flexDirection: "column", gap: 6, flex: "none" }}>
        {live && phone && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.14em", color: phaseC, textAlign: "center" }}>{phaseLabel}</span>}
        {call.err && <span role="alert" style={{ fontSize: 11.5, color: "#A0412D", textAlign: "center", lineHeight: 1.45 }}>{call.err}</span>}
        {live && <span style={{ fontSize: d.fs.tiny, color: "#6E6255", textAlign: "center", lineHeight: 1.45 }}>Nói vào micro như một khách hàng. Nên đeo tai nghe để Bonia không nghe lại giọng của chính mình.</span>}
        {live ? (
          <button type="button" className="b-ghost" onClick={finish} style={{ height: d.btn, borderRadius: d.btn / 2, fontSize: d.fs.body, textAlign: "center" }}>Kết thúc cuộc gọi</button>
        ) : (
          <button type="button" className="b-primary" onClick={start} style={{ height: d.btn, borderRadius: d.btn / 2, fontSize: d.fs.body, textAlign: "center" }}>Gọi lại</button>
        )}
      </div>
    </div>
  );

  const signOut = <button type="button" onClick={app.signOut} style={{ fontSize: d.fs.small, color: "#4A4239" }}>Đăng xuất</button>;
  const bg = live ? "#EEF0E6" : "#F2EEE6";
  if (phone) {
    return (
      <div style={{ position: "absolute", inset: 0, background: bg, transition: "background-color 900ms ease", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, top: "var(--tt-top)", overflow: "auto" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "10px 16px 40px", display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <img src={BONIA_MARK} alt="Bonia" style={{ height: 22 }} />
                <span style={eyebrow}>PLAYGROUND</span>
              </span>
              {signOut}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Orb size={170} mood={mood} tone={live ? "green" : "warm"} pickup={pickups} lively={live} reduce={reduce} />
              <div style={{ marginTop: -14 }}>{startBtn}</div>
              <span style={{ ...eyebrow, textAlign: "center", lineHeight: 1.7 }}>{picked ? `GỌI RA · BẠN LÀ ${picked.customer.toUpperCase()}` : sectorName.toUpperCase()} · {savedLabel}</span>
              {!live && call.err && <span role="alert" style={{ fontSize: 12, color: "#A0412D", textAlign: "center" }}>{call.err}</span>}
            </div>
            <RecentCalls d={d} calls={recent} open={resultUuid} onOpen={openPast} max={3} />
            {form}
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: "calc(var(--tt-top) + 7px)", bottom: 0, transform: showPanel ? "none" : "translateY(105%)", opacity: showPanel ? 1 : 0, pointerEvents: showPanel ? "auto" : "none", transition: `transform 650ms ${EASE}, opacity 400ms ease`, zIndex: 6, boxShadow: "0 -8px 28px rgba(31,27,22,0.14)", borderRadius: "18px 18px 0 0" }}>
          {panel}
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", inset: 0, background: bg, transition: "background-color 900ms ease", overflow: "hidden" }}>
      <header className="tt-head">
        <div className="tt-head-brand">
          <img src={BONIA_MARK} alt="Bonia" />
          <span className="tt-mono-label">PLAYGROUND</span>
          <span className="tt-head-name">{cur.business.name || sectorName}</span>
        </div>
        <span style={{ flex: 1 }} />
        <div className="tt-head-right" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 18 }}>
          <span style={eyebrow}>{savedLabel}</span>
          {signOut}
        </div>
      </header>
      <div style={{ position: "absolute", left: 48, top: 56 + 24, width: 420, bottom: 0, overflow: "auto", paddingBottom: 40, paddingRight: 6 }}>
        {form}
      </div>
      <div style={{ position: "absolute", left: 48 + 420 + 40, right: showPanel ? 48 + 400 + 40 : 48, top: 56, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, transition: `right 650ms ${EASE}` }}>
        <div style={{ transform: live ? "scale(1)" : "scale(0.85)", transition: `transform 800ms ${EASE}`, marginTop: -40 }}>
          <Orb size={340} mood={mood} tone={live ? "green" : "warm"} pickup={pickups} lively={live} reduce={reduce} />
        </div>
        {!live && startBtn}
        {live && <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", color: phaseC }}>{phaseLabel}</span>}
        <span style={{ ...eyebrow, marginTop: 6, textAlign: "center", maxWidth: 420, lineHeight: 1.7 }}>{picked ? `BONIA GỌI RA · BẠN LÀ ${picked.customer.toUpperCase()}` : `BONIA NGHE MÁY CHO ${cur.business.name ? cur.business.name.toUpperCase() : "…"}`}</span>
        {!live && call.err && <span role="alert" style={{ fontSize: 12, color: "#A0412D", textAlign: "center", maxWidth: 400, lineHeight: 1.5 }}>{call.err}</span>}
        {!live && <div style={{ width: "min(380px, 100%)", marginTop: 18 }}><RecentCalls d={d} calls={recent} open={resultUuid} onOpen={openPast} /></div>}
      </div>
      <div style={{ position: "absolute", right: 48, width: 400, top: 56 + 24, bottom: 28, transform: showPanel ? "none" : "translateX(480px)", opacity: showPanel ? 1 : 0, pointerEvents: showPanel ? "auto" : "none", transition: `transform 650ms ${EASE}, opacity 400ms ease`, zIndex: 6 }}>
        {panel}
      </div>
    </div>
  );
}
