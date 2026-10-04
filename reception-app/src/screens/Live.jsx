import React, { useState } from "react";
import { Link } from "wouter";
import { Orb } from "../components/Orb.jsx";
import { RequestCard, RequestDetail } from "../components/Request.jsx";
import { LiveCallCard, callVm } from "../components/LiveCall.jsx";
import { title as titleOf } from "../data/sample.js";
import { BONIA_MARK } from "../lib/assets.js";
import { DEMO_LABEL_SHORT } from "../lib/clock.js";
import { DeskHeader, PhoneTabs, useLayout, useRefWidth } from "../layout.jsx";
import { hm, useApp } from "../state.jsx";

// Trực tiếp (handoff 13 direction D): Cần xử lý · the orb · Đã xong hôm nay.
// A call slides its card in (right; a second call on the left), the screen
// turns soft green (soft brick when urgent), and when it ends the card folds
// into a one-line summary and drops into Cần xử lý.

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Source Serif 4', Georgia, serif";
const EASE = "cubic-bezier(.2,.8,.2,1)";

function useLiveModel() {
  const app = useApp();
  const { phone, reduce, device } = useLayout();
  const { reqs, calls, now, offline, focus } = app;
  const vms = calls.map((c) => callVm(c, now, app.listen)).filter((v) => v.phase !== "gone").sort((a, b) => a.slot - b.slot);
  const live = vms.filter((v) => v.phase === "live");
  const count = vms.length;
  const anyUrgent = live.some((v) => v.urgent);
  const focusV = vms.find((v) => v.id === focus && v.phase === "live") || live[live.length - 1];
  let mood = "idle";
  let tone = "warm";
  if (offline) {
    mood = "off";
    tone = "muted";
  } else if (focusV) {
    mood = focusV.mood;
    tone = anyUrgent ? "urgent" : "green";
  }
  const bg = offline ? "#ECE9E3" : anyUrgent ? "#F6E6DE" : live.length ? "#EEF0E6" : "#F2EEE6";
  const trCard = reduce ? "opacity 200ms linear" : `transform 650ms ${EASE}, opacity 450ms ease, height 450ms ${EASE}`;
  const today = reqs.filter((r) => r.day === 0);
  const open = today.filter((r) => r.status === "open").sort((a, b) => (b.urgent - a.urgent) || b.at.localeCompare(a.at));
  const done = today.filter((r) => r.status !== "open").sort((a, b) => (b.doneAt || b.at).localeCompare(a.doneAt || a.at));
  return { app, phone, reduce, device, vms, live, count, focusV, mood, tone, bg, trCard, open, done, now };
}

export function Live() {
  const m = useLiveModel();
  const [openId, setOpenId] = useState(null);
  const { app } = m;
  const or = app.reqs.find((r) => r.id === openId) || null;
  const detShown = !!or && !m.count;
  const detail = (radius) => (
    <RequestDetail
      r={or}
      when={or ? `Hôm nay ${or.at}` : ""}
      radius={radius}
      copied={or && app.copied === or.id}
      onClose={() => setOpenId(null)}
      onCopy={() => or && app.copy(or)}
      onDone={() => {
        if (!or) return;
        app.markDone(or.id, m.device);
        setOpenId(null);
      }}
    />
  );
  const cardProps = (r) => ({
    r,
    flash: !!(r.addedAt && m.now - r.addedAt < 2600),
    selected: openId === r.id,
    copied: app.copied === r.id,
    onOpen: () => setOpenId(r.id),
    onCopy: () => app.copy(r),
    onDone: () => {
      app.markDone(r.id, m.device);
      if (openId === r.id) setOpenId(null);
    },
  });
  return m.phone ? <PhoneLive m={m} or={or} detShown={detShown} detail={detail} cardProps={cardProps} openId={openId} setOpenId={setOpenId} /> : <DeskLive m={m} detShown={detShown} detail={detail} cardProps={cardProps} openId={openId} setOpenId={setOpenId} />;
}

function DoneRow({ r, now, selected, onOpen, phone }) {
  const flash = r.doneFlash && now - r.doneFlash < 2600;
  const auto = r.status === "auto";
  const by = auto ? "Bonia đã trả lời" : `Đã xử lý · ${r.doneBy}`;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(); }}
      className="h-cream"
      style={{ display: "grid", gridTemplateColumns: phone ? "18px 42px minmax(0,1fr)" : "20px 44px minmax(0,1fr)", gap: 8, minHeight: phone ? 52 : undefined, padding: phone ? "10px 6px" : "10px 8px", borderTop: "1px solid #E4DCCB", borderRadius: phone ? 0 : 8, background: flash ? "#E6EBDC" : "transparent", boxShadow: `inset 0 0 0 1px ${selected ? "#7B4A2D" : "transparent"}`, cursor: "pointer", transition: "background-color 1.2s ease" }}
    >
      <span style={{ color: "#4A6B3A", fontSize: 13 }}>✓</span>
      <span style={{ fontFamily: MONO, fontSize: 11.5, color: "#6E6255", paddingTop: 1 }}>{r.doneAt || r.at}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 13.5, color: "#4A4239" }}>
          <span style={{ fontWeight: 600, color: "#1F1B16" }}>{titleOf(r)}</span> · {(r.fields[0] || ["", ""])[1]}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6E6255" }}>
          {phone ? (auto ? "Bonia tự xong" : by) : by}
          {!phone && auto && <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", padding: "2px 6px", borderRadius: 8, border: "1px solid #D9D0BF", whiteSpace: "nowrap" }}>BONIA TỰ XONG</span>}
        </span>
      </div>
    </div>
  );
}

function OfflineNote({ compact = false }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center" }}>
      <span style={{ fontSize: 17, fontWeight: 600, color: "#A0412D" }}>Offline</span>
      <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", color: "#6E6255", maxWidth: compact ? 300 : undefined }}>CHƯA THANH TOÁN THÁNG 9 · BONIA KHÔNG NHẬN CUỘC GỌI</span>
      <Link href="/cai-dat#s5" className="b-primary" style={{ height: 44, padding: "0 20px", borderRadius: 22, fontSize: 14, display: "flex", alignItems: "center", marginTop: 6 }}>Thanh toán</Link>
    </div>
  );
}

// ── desktop ─────────────────────────────────────────────────────────────

function DeskLive({ m, detShown, detail, cardProps, openId, setOpenId }) {
  const [ref, width] = useRefWidth();
  const { app, count, reduce, trCard } = m;
  // The orb grows to 340 px on a call; on narrower desktops it shrinks to fit
  // between Cần xử lý (440 px) and the call card (460 px).
  const callScale = Math.max(0.5, Math.min(1, (width - 920) / 340));
  const orbTf = count ? `scale(${callScale})` : "scale(0.56)";
  const empty = { isFull: true, bubbles: [], fields: [] };
  const slots = [0, 1].map((i) => {
    const v = m.vms.find((x) => x.slot === i);
    const two = m.vms.length === 2;
    const side = two && m.vms.indexOf(v) === 0 ? "left" : "right";
    if (!v) {
      const s = m.vms.length === 1 && m.vms[0].slot !== i ? "left" : "right";
      return { side: s, h: null, tf: reduce ? "none" : s === "right" ? "translateX(520px)" : "translateX(-520px)", op: 0, pe: "none", vm: null, key: i };
    }
    let tf = "none";
    let op = 1;
    let h = null;
    if (v.phase === "summary") h = 76;
    if (v.phase === "fly") {
      h = 76;
      op = 0;
      // fly towards Cần xử lý (left column)
      tf = reduce ? "none" : side === "right" ? `translate(${-(width - 40 - 420 - 40)}px,60px) scale(0.6)` : "translate(0px,60px) scale(0.6)";
    }
    return { side, h, tf, op, pe: v.phase === "live" ? "auto" : "none", vm: v, key: i };
  });
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0, background: m.bg, transition: "background-color 900ms ease", overflow: "hidden" }}>
      <DeskHeader active={0} right={`${DEMO_LABEL_SHORT} · ${hm()}`} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 64, bottom: 0 }}>
        <div style={{ position: "absolute", left: 40, top: 24, bottom: 0, width: 400, display: "flex", flexDirection: "column", gap: 10, opacity: count === 2 ? 0 : 1, transition: "opacity 400ms ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flex: "none" }}>
            <span style={{ fontFamily: SERIF, fontSize: 24 }}>Cần xử lý</span>
            <span style={{ fontFamily: MONO, fontSize: 20, color: "#7B4A2D" }}>{m.open.length}</span>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 24 }}>
            {!m.open.length && <div style={{ padding: "16px 2px", fontSize: 14, color: "#6E6255" }}>Không còn việc nào.</div>}
            {m.open.map((r) => <RequestCard key={r.id} {...cardProps(r)} />)}
          </div>
        </div>
        <div style={{ position: "absolute", right: 40, top: 24, bottom: 24, width: 360, display: "flex", flexDirection: "column", gap: 6, overflow: "auto", opacity: count || detShown ? 0 : 1, transition: "opacity 400ms ease", pointerEvents: count || detShown ? "none" : "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingBottom: 4 }}>
            <span style={{ fontFamily: SERIF, fontSize: 24, color: "#4A4239" }}>Đã xong hôm nay</span>
            <span style={{ fontFamily: MONO, fontSize: 20, color: "#4A6B3A" }}>{m.done.length}</span>
          </div>
          {m.done.map((r) => <DoneRow key={r.id} r={r} now={m.now} selected={openId === r.id} onOpen={() => setOpenId(r.id)} />)}
        </div>
        <div style={{ position: "absolute", left: "50%", marginLeft: -250, top: count ? 150 : 210, width: 500, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transition: `top 800ms ${EASE}`, pointerEvents: "none" }}>
          <div style={{ transform: orbTf, transformOrigin: "50% 0", marginBottom: count ? 0 : -150, transition: `transform 800ms ${EASE}, margin-bottom 800ms ${EASE}` }}>
            <Orb size={340} mood={m.mood} tone={m.tone} pickup={app.pickups} reduce={reduce} lively={m.live.length > 0} />
          </div>
          {app.offline && <div style={{ pointerEvents: "auto" }}><OfflineNote /></div>}
        </div>
        {slots.map((s) => (
          <div key={s.key} style={{ position: "absolute", [s.side === "right" ? "right" : "left"]: 40, top: 24, width: 420, height: s.h ? s.h : "calc(100% - 48px)", transform: s.tf, opacity: s.op, pointerEvents: s.pe, transition: trCard }}>
            {s.vm && <LiveCallCard c={s.vm} />}
          </div>
        ))}
        <div style={{ position: "absolute", right: 40, top: 24, width: 420, bottom: 24, transform: detShown ? "none" : reduce ? "none" : "translateX(520px)", opacity: detShown ? 1 : 0, pointerEvents: detShown ? "auto" : "none", transition: trCard }}>
          {detail(18)}
        </div>
      </div>
    </div>
  );
}

// ── phone ───────────────────────────────────────────────────────────────

function PhoneLive({ m, detShown, detail, cardProps, setOpenId }) {
  const { app, count, reduce, trCard } = m;
  const [expanded, setExpanded] = useState(false);
  const [doneOpen, setDoneOpen] = useState(false);
  const fv = m.vms.find((v) => v.id === app.focus && v.phase !== "gone") || m.live[m.live.length - 1] || m.vms[m.vms.length - 1];
  const other = m.vms.find((v) => v !== fv && v.phase === "live");
  let sheet = { h: 470, tf: reduce ? "none" : "translateY(105%)", op: 0, pe: "none", vm: null, hideT: true };
  if (fv) {
    let h = expanded ? 760 : 470;
    let tf = "none";
    let op = 1;
    if (fv.phase === "summary") h = 104;
    if (fv.phase === "fly") {
      h = 104;
      op = 0;
      tf = reduce ? "none" : "translateY(-380px) scale(0.9)";
    }
    sheet = { h, tf, op, pe: fv.phase === "live" ? "auto" : "none", vm: fv, hideT: !expanded };
  }
  return (
    <div style={{ position: "absolute", inset: 0, background: m.bg, transition: "background-color 900ms ease", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: "var(--tt-top)", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src={BONIA_MARK} alt="Bonia" style={{ height: 18, width: "auto" }} />
          <span style={{ fontSize: 15, fontWeight: 600 }}>Sân Nhài</span>
        </div>
        {app.offline && (
          <Link href="/cai-dat#s5" style={{ height: 32, padding: "0 12px", borderRadius: 16, background: "#F6E7E1", color: "#A0412D", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center" }}>Offline · Thanh toán</Link>
        )}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: "calc(var(--tt-top) + 52px)", bottom: "calc(57px + var(--tt-bot))", overflow: "auto" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", height: count ? 230 : 150, transition: `height 700ms ${EASE}` }}>
            <div style={{ transform: count ? "scale(1)" : "scale(0.66)", transformOrigin: "50% 0", transition: `transform 700ms ${EASE}` }}>
              <Orb size={200} mood={m.mood} tone={m.tone} pickup={app.pickups} reduce={reduce} lively={m.live.length > 0} />
            </div>
          </div>
          <div style={{ padding: "0 16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: SERIF, fontSize: 22 }}>Cần xử lý</span>
              <span style={{ fontFamily: MONO, fontSize: 18, color: "#7B4A2D" }}>{m.open.length}</span>
            </div>
            {!m.open.length && <div style={{ padding: "8px 2px", fontSize: 14, color: "#6E6255" }}>Không còn việc nào.</div>}
            {m.open.map((r) => <RequestCard key={r.id} {...cardProps(r)} />)}
            <button type="button" onClick={() => setDoneOpen((d) => !d)} style={{ minHeight: 52, marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 14px", border: "1px solid #D9D0BF", borderRadius: 12, background: "rgba(255,255,255,0.6)", fontSize: 14.5, color: "#4A4239" }}>
              <span>Đã xong hôm nay · <span style={{ fontFamily: MONO, color: "#4A6B3A" }}>{m.done.length}</span></span>
              <span style={{ fontSize: 13 }}>{doneOpen ? "Thu gọn ▴" : "Xem ▾"}</span>
            </button>
            {doneOpen && m.done.map((r) => <DoneRow key={r.id} r={r} now={m.now} phone onOpen={() => setOpenId(r.id)} />)}
          </div>
        </div>
      </div>
      <PhoneTabs active={0} />
      {other && (
        <button type="button" onClick={() => { app.setFocus(other.id); setExpanded(false); }} style={{ position: "absolute", left: 14, right: 14, bottom: sheet.h + 10, height: 44, zIndex: 5, border: `1px solid ${other.urgent ? "#EBCFC4" : "#D9D0BF"}`, borderRadius: 22, background: other.urgent ? "#F6E7E1" : "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13.5, color: other.urgent ? "#A0412D" : "#7B4A2D" }}>
          <span style={{ width: 7, height: 7, borderRadius: 4, background: other.urgent ? "#A0412D" : "#7B4A2D" }} />
          {other.otherText} · chạm để xem
        </button>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `min(${sheet.h}px, calc(100% - var(--tt-top) - 8px))`, transform: sheet.tf, opacity: sheet.op, pointerEvents: sheet.pe, transition: trCard, zIndex: 4, display: "flex", flexDirection: "column", background: "#fff", borderRadius: "22px 22px 0 0", boxShadow: "0 -8px 28px rgba(31,27,22,0.12)", overflow: "hidden", paddingBottom: "max(22px, var(--tt-bot))" }}>
        <button type="button" onClick={() => setExpanded((e) => !e)} aria-label="Kéo lên để xem lời thoại" style={{ height: 26, display: "flex", alignItems: "center", justifyContent: "center", flex: "none", width: "100%" }}>
          <span style={{ width: 40, height: 5, borderRadius: 3, background: "#D9D0BF" }} />
        </button>
        <div style={{ flex: 1, minHeight: 0 }}>{sheet.vm && <LiveCallCard c={sheet.vm} hideTranscript={sheet.hideT} radius={0} />}</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: "calc(var(--tt-top) + 7px)", bottom: 0, transform: detShown ? "none" : "translateY(105%)", transition: trCard, zIndex: 6, boxShadow: "0 -8px 28px rgba(31,27,22,0.14)", borderRadius: "20px 20px 0 0", pointerEvents: detShown ? "auto" : "none" }}>
        {detail("20px 20px 0 0")}
      </div>
    </div>
  );
}
