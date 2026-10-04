import React, { useEffect, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { CARDS, FIELDS, SECTIONS, VOICE_COUNT, pendingList } from "../data/settings.js";
import { DeskHeader, PhoneTabs, Switch, useLayout } from "../layout.jsx";
import { useApp } from "../state.jsx";
import { EASE, MONO, SERIF, dims } from "../ui.js";
import { playVoice } from "../voice.js";

// Cài đặt (handoff 13): one scrolling page, four sections (Tài khoản &
// thanh toán has its own page since 2026-10-04). Values Bonia found on the
// internet start unconfirmed (dashed); typing or picking confirms them. Review
// mode (after the AI search, or while anything is left to check) adds the
// "Còn N mục cần xem lại · Tới mục tiếp theo" bar.

const fmt = (n) => (n === "" || n == null ? "" : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "."));

export function Settings() {
  const app = useApp();
  const { phone } = useLayout();
  const d = dims(phone);
  const [, navigate] = useLocation();
  const search = useSearch();
  const { f, ok, rooms } = app.settings;
  const scRef = useRef(null);
  const [active, setActive] = useState("s1");
  const [openRoom, setOpenRoom] = useState(2);
  const [playing, setPlaying] = useState(null);
  const stopPlay = useRef(null);
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
      const top = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - (phone ? 110 : 20);
      sc.scrollTo({ top, behavior: "smooth" });
    }, 40);
  };

  useEffect(() => {
    const h = window.location.hash.replace("#", "");
    if (SECTIONS.some(([k]) => k === h)) setTimeout(() => jump(h), 300);
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
    if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 4) a = SECTIONS[SECTIONS.length - 1][0];
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

  const rowCols = phone ? "minmax(0,1fr)" : "150px minmax(0,1fr)";
  const topH = phone ? "var(--tt-top)" : "56px";
  const revH = review ? (phone ? 50 : 44) : 0;
  const input = { height: d.input, minWidth: 0, border: "1px solid #D9D0BF", borderRadius: 8, padding: "0 10px", fontSize: d.fs.body, background: "#fff", color: "#1F1B16" };
  const smallBtn = { height: d.btnSm, padding: "0 12px", borderRadius: d.btnSm / 2, fontSize: d.fs.small, whiteSpace: "nowrap" };

  // ── one field row ────────────────────────────────────────────────────
  const row = (k) => {
    const def = FIELDS[k];
    const v = f[k];
    const conflictOpen = def.k === "conflict" && v == null;
    const kind = def.k === "conflict" ? (conflictOpen ? "conflict" : "mono") : def.k;
    const needFill = v == null && def.k === "chips";
    const warn = needFill || conflictOpen;
    const set = (val) => app.setF(k, val, true);
    return (
      <div data-f={k} style={{ display: "grid", gridTemplateColumns: rowCols, gap: phone ? 5 : 12, alignItems: "center", padding: "6px 8px", borderRadius: 8, border: `1px ${warn || !ok[k] ? "dashed" : "solid"} ${warn ? "#A0412D" : ok[k] ? "#EFE9DD" : "#C9BCA5"}`, background: warn ? "#FBF8F2" : "#fff" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: d.fs.small, color: "#4A4239", lineHeight: 1.4 }}>{def.l}</span>
          {needFill && <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.12em", padding: "2px 5px", borderRadius: 4, background: "#F6E7E1", color: "#A0412D" }}>CẦN BẠN ĐIỀN</span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
          {kind === "text" && <input value={v ?? ""} onChange={(e) => set(e.target.value)} style={{ ...input, width: "100%" }} />}
          {kind === "mono" && <input value={v ?? ""} onChange={(e) => set(e.target.value)} style={{ ...input, width: 150, maxWidth: "100%", fontFamily: MONO }} />}
          {kind === "area" && <textarea value={v ?? ""} onChange={(e) => set(e.target.value)} rows={4} placeholder="Ví dụ: chợ Bến Thành đi bộ 10 phút · có két sắt ở quầy · không có bãi giữ xe buýt" style={{ width: "100%", minHeight: 90, resize: "vertical", border: "1px solid #D9D0BF", borderRadius: 8, padding: "8px 10px", fontSize: d.fs.body, lineHeight: 1.5, background: "#fff", color: "#1F1B16" }} />}
          {(def.k === "chips" || def.k === "multi") && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {def.o.map((o) => {
                const multi = def.k === "multi";
                const on = multi ? v.includes(o) : v === o;
                const go = () => (multi ? set(on ? v.filter((x) => x !== o) : [...v, o]) : set(o));
                const st = multi
                  ? { bg: on ? "#7B4A2D" : "#fff", b: on ? "#7B4A2D" : "#D9D0BF", c: on ? "#fff" : "#6E6255" }
                  : { bg: on ? "#FBF5EC" : "#fff", b: on ? "#7B4A2D" : "#D9D0BF", c: on ? "#7B4A2D" : "#1F1B16" };
                return (
                  <button key={o} type="button" onClick={go} style={{ height: d.chip, padding: "0 11px", borderRadius: d.chip / 2, border: `1px solid ${st.b}`, background: st.bg, color: st.c, fontSize: d.fs.small, whiteSpace: "nowrap" }}>
                    {multi && on ? "✓ " : ""}{o}
                  </button>
                );
              })}
            </div>
          )}
          {conflictOpen && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {def.o.map(([val, src]) => (
                <button key={val} type="button" className="h-clayline" onClick={() => app.setF("checkin", val, true)} style={{ height: d.input, padding: "0 12px", border: "1px solid #D9D0BF", borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontFamily: MONO, fontSize: 13.5, color: "#1F1B16" }}>{val}</span>
                  <span style={{ fontSize: d.fs.tiny, color: "#6E6255" }}>· {src}</span>
                </button>
              ))}
            </div>
          )}
          {def.k === "toggle" && (
            <button type="button" onClick={() => set(!v)} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: d.fs.body, color: "#1F1B16", textAlign: "left", minHeight: d.row }}>
              <Switch on={!!v} />
              {def.t}
            </button>
          )}
          {def.k === "voice" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Array.from({ length: VOICE_COUNT }, (_, j) => j + 1).map((i) => {
                const on = v === i;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, height: d.chip + 4, padding: "0 3px 0 10px", borderRadius: (d.chip + 4) / 2, border: `1px solid ${on ? "#7B4A2D" : "#E4DCCB"}`, background: on ? "#FBF5EC" : "#fff" }}>
                    <button type="button" onClick={() => set(i)} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: d.fs.small, color: "#1F1B16", height: "100%" }}>
                      <span style={{ width: 13, height: 13, borderRadius: 7, border: on ? "4px solid #7B4A2D" : "1.5px solid #C9BCA5", flex: "none" }} />
                      Giọng {i}
                    </button>
                    <button
                      type="button"
                      aria-label={`Nghe thử giọng ${i}`}
                      onClick={() => {
                        stopPlay.current?.();
                        if (playing === i) return setPlaying(null);
                        setPlaying(i);
                        stopPlay.current = playVoice(i, f.greeting || "Dạ xin nghe ạ.", () => setPlaying(null));
                        return undefined;
                      }}
                      className="h-line"
                      style={{ width: d.chip - 4, height: d.chip - 4, borderRadius: (d.chip - 4) / 2, fontSize: 10, color: "#7B4A2D" }}
                    >
                      {playing === i ? "■" : "▶"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {def.note && (
            <span style={{ display: "flex", gap: 7, alignItems: "center", fontSize: d.fs.tiny, color: "#6E6255" }}>
              <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.12em", border: "1px solid #6E6255", borderRadius: 4, padding: "1px 4px" }}>KHÓA</span>
              {def.note}
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
        <div key={title} style={{ background: "#fff", border: "1px solid #E4DCCB", borderRadius: 12, padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "0 2px 3px", minHeight: 28 }}>
            <span style={{ fontSize: d.fs.title, fontWeight: 600 }}>{title}</span>
            {p.length > 0 && <button type="button" className="b-ghost" onClick={() => app.confirmKeys(p)} style={smallBtn}>Đúng hết · {p.length}</button>}
          </div>
          {keys.map((k) => <React.Fragment key={k}>{row(k)}</React.Fragment>)}
        </div>
      );
    });

  // ── rooms (§02) ──────────────────────────────────────────────────────
  const roomsView = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "6px 12px", background: "#fff", border: "1px solid #E4DCCB", borderRadius: 10 }}>
        <button type="button" onClick={() => app.setF("quote", !f.quote, false)} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: d.fs.body, color: "#1F1B16", textAlign: "left", minHeight: d.row }}>
          <Switch on={!!f.quote} />
          Bonia được báo giá khi khách gọi
        </button>
        <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.14em", color: "#6E6255", whiteSpace: "nowrap" }}>{rooms.reduce((a, r) => a + (Number(r.count) || 0), 0)} PHÒNG · {rooms.length} LOẠI</span>
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
          <div key={i} data-f={`room:${i}`} style={{ background: "#fff", border: `1px ${r.ok ? "solid" : "dashed"} ${r.ok ? "#E4DCCB" : "#C9BCA5"}`, borderRadius: 10, overflow: "hidden" }}>
            <button type="button" onClick={() => setOpenRoom(open ? null : i)} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 3, padding: "9px 12px", textAlign: "left" }}>
              <span style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", width: "100%" }}>
                <span style={{ fontSize: d.fs.title, fontWeight: 600, color: "#1F1B16" }}>{r.name}</span>
                <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.1em", padding: "2px 7px", borderRadius: 9, whiteSpace: "nowrap", border: `1px solid ${r.ok ? "#D9D0BF" : "#7B4A2D"}`, color: r.ok ? "#4A6B3A" : "#7B4A2D" }}>{r.ok ? "✓" : "XEM LẠI GIÁ"}</span>
              </span>
              <span style={{ fontSize: d.fs.small, color: "#4A4239", lineHeight: 1.4 }}>{r.count} phòng · {r.size} m² · {r.bed} · tối đa {r.max} người</span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: "#1F1B16", lineHeight: 1.5 }}>{parts.join(" · ")}</span>
            </button>
            {open && (
              <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid #EFE9DD" }}>
                <div style={{ display: "grid", gridTemplateColumns: phone ? "1fr 1fr" : "repeat(auto-fill,minmax(130px,1fr))", gap: 7 }}>
                  {facts.map(([l, k, fn]) => (
                    <label key={k} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                      <span style={{ fontSize: d.fs.tiny, color: "#6E6255" }}>{l}</span>
                      <input value={r[k]} onChange={fn(k)} style={{ ...input, width: "100%" }} />
                    </label>
                  ))}
                </div>
                {modes.map((m) => (
                  <div key={m.l} style={{ display: "flex", flexDirection: "column", gap: 7, padding: "8px 10px", borderRadius: 8, background: m.on ? "#FFFFFF" : "#FAF7F1", border: "1px solid #EFE9DD" }}>
                    <button type="button" onClick={() => app.setRoom(i, { [m.key]: !m.on })} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: d.fs.body, fontWeight: 600, color: m.on ? "#1F1B16" : "#6E6255", minHeight: 26, width: "max-content" }}>
                      <Switch on={m.on} />
                      {m.l}
                      <span style={{ fontWeight: 400, fontSize: d.fs.small, color: "#6E6255" }}>{m.on ? "" : "· tắt"}</span>
                    </button>
                    {m.on && (
                      <div style={{ display: "grid", gridTemplateColumns: m.cols, gap: 7 }}>
                        {m.inputs.map(([l, k, suf, fn]) => (
                          <label key={k} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                            <span style={{ fontSize: d.fs.tiny, color: "#6E6255" }}>{l}</span>
                            <span style={{ position: "relative", display: "block" }}>
                              <input value={suf ? fmt(r[k]) : r[k]} onChange={fn(k)} inputMode={suf ? "numeric" : "text"} style={{ ...input, width: "100%", padding: "0 24px 0 10px", fontFamily: MONO, textAlign: "right" }} />
                              <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", fontSize: d.fs.small, color: "#6E6255" }}>{suf}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {!r.ok && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button type="button" className="b-primary" onClick={() => app.setRoom(i, { ok: true })} style={{ ...smallBtn, height: d.btn, padding: "0 16px", borderRadius: d.btn / 2 }}>Đúng giá này</button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      <button type="button" style={{ height: d.btn + 4, border: "1px dashed #C9BCA5", borderRadius: 10, fontSize: d.fs.body, color: "#4A4239", textAlign: "center" }}>+ Thêm loại phòng</button>
    </div>
  );

  // ── page ─────────────────────────────────────────────────────────────
  const index = SECTIONS.map(([k, num, l]) => {
    const c = pend.filter((p) => p[0] === k).length;
    return {
      k, num, l,
      mark: c ? `${c} cần xem lại` : "✓ Đã xong",
      mc: c ? "#7B4A2D" : "#4A6B3A",
      badge: c ? String(c) : "✓",
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
        <div style={{ position: "absolute", left: 0, right: 0, top: topH, height: revH, zIndex: 3, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: `0 ${phone ? 16 : 48}px`, background: pendN ? "#FBF5EC" : "#EEF0E6", borderBottom: "1px solid #D9D0BF" }}>
          <span style={{ fontSize: d.fs.body, fontWeight: 600, color: pendN ? "#7B4A2D" : "#4A6B3A" }}>{pendN ? `Còn ${pendN} mục cần xem lại` : "Đã xem lại hết"}</span>
          <button type="button" className="b-primary" onClick={revGo} style={{ ...smallBtn, height: d.btnSm + 2, padding: "0 14px" }}>{pendN ? (phone ? "Mục tiếp" : "Tới mục tiếp theo") : "Thử Bonia →"}</button>
        </div>
      )}
      <div ref={scRef} onScroll={onScroll} style={{ position: "absolute", left: 0, right: 0, top: `calc(${topH} + ${revH}px)`, bottom: phone ? "calc(57px + var(--tt-bot))" : 0, overflow: "auto" }}>
        {phone && (
          <div style={{ position: "sticky", top: 0, zIndex: 2, background: "#F2EEE6", padding: "6px 16px 8px", display: "flex", flexDirection: "column", gap: 6, borderBottom: "1px solid #E4DCCB" }}>
            <span style={{ fontFamily: SERIF, fontSize: d.fs.h1 }}>Cài đặt</span>
            <div className="tt-scroll-x" style={{ display: "flex", gap: 5, margin: "0 -16px", padding: "0 16px" }}>
              {index.map((it) => {
                const on = active === it.k;
                return (
                  <button key={it.k} type="button" onClick={it.go} style={{ height: d.chip, padding: "0 11px", borderRadius: d.chip / 2, border: `1px solid ${on ? "#1F1B16" : "#D9D0BF"}`, background: on ? "#1F1B16" : "#fff", color: on ? "#F7F3EC" : "#1F1B16", fontSize: d.fs.small, whiteSpace: "nowrap", flex: "none" }}>
                    {it.l}
                    <span style={{ fontFamily: MONO, fontSize: 10, marginLeft: 5, color: on ? "#F7F3EC" : it.mc }}>{it.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: phone ? "12px 16px 110px" : "24px 48px 110px", display: "grid", gridTemplateColumns: phone ? "minmax(0,1fr)" : "190px minmax(0,1fr)", gap: 40, alignItems: "start" }}>
          {!phone && (
            <aside style={{ position: "sticky", top: 20, display: "flex", flexDirection: "column", gap: 2 }}>
              {index.map((it) => {
                const on = active === it.k;
                return (
                  <button key={it.k} type="button" onClick={it.go} className="h-white" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, padding: "8px 10px", borderRadius: 8, background: on ? "#FFFFFF" : "transparent", textAlign: "left" }}>
                    <span style={{ display: "flex", gap: 9, alignItems: "baseline" }}>
                      <span style={{ fontFamily: MONO, fontSize: 9.5, color: "#6E6255", width: 16 }}>{it.num}</span>
                      <span style={{ fontSize: d.fs.title, fontWeight: on ? 600 : 400 }}>{it.l}</span>
                    </span>
                    <span style={{ paddingLeft: 25, fontSize: d.fs.tiny, color: it.mc }}>{it.mark}</span>
                  </button>
                );
              })}
            </aside>
          )}
          <main style={{ display: "flex", flexDirection: "column", gap: 30, minWidth: 0 }}>
            {SECTIONS.map(([k, num, title]) => (
              <section key={k} data-sec={k} id={k} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.2em", color: "#6E6255" }}>{num}</span>
                  <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 20 }}>{title}</h2>
                </div>
                {k === "s2" && roomsView()}
                {CARDS[k] && cards(k)}
              </section>
            ))}
          </main>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: phone ? "calc(57px + var(--tt-bot))" : 0, zIndex: 4, display: "flex", justifyContent: "center", padding: `8px ${phone ? 16 : 48}px`, background: "#fff", borderTop: "1px solid #D9D0BF", transform: dirtyN ? "translateY(0)" : "translateY(120%)", opacity: dirtyN ? 1 : 0, pointerEvents: dirtyN ? "auto" : "none", transition: `transform 280ms ${EASE}, opacity 200ms ease` }}>
        <div style={{ width: "100%", maxWidth: 1080, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: d.fs.body }}>{dirtyN} thay đổi chưa lưu</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="b-ghost" onClick={app.discard} style={{ ...smallBtn, height: d.btn, borderRadius: d.btn / 2 }}>Bỏ thay đổi</button>
            <button type="button" className="b-primary" onClick={app.save} style={{ ...smallBtn, height: d.btn, padding: "0 20px", borderRadius: d.btn / 2 }}>Lưu</button>
          </div>
        </div>
      </div>
      {phone && <PhoneTabs active={2} />}
    </div>
  );
}
