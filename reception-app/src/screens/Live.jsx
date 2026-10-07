import React, { useState } from "react";
import { Link } from "wouter";
import { Orb } from "../components/Orb.jsx";
import { RequestCard, RequestDetail } from "../components/Request.jsx";
import { LiveCallCard, callVm } from "../components/LiveCall.jsx";
import { OnOffStatus, OrbTip, SwitchDialog } from "../components/OnOff.jsx";
import { TodayBar, TodaySheet } from "../components/Today.jsx";
import { title as titleOf } from "../data/sample.js";
import { flat } from "../data/settings.js";
import { BONIA_MARK } from "../lib/assets.js";
import { DEMO_LABEL_SHORT } from "../lib/clock.js";
import { dayLabel } from "../lib/today.js";
import { DeskHeader, PhoneTabs, useLayout, useRefWidth } from "../layout.jsx";
import { hm, useApp } from "../state.jsx";
import { EASE, MONO, SERIF } from "../ui.js";

// Trực tiếp: a calm work desk (founder 2026-10-04) built on handoff 13
// direction D. The orb sits in the middle of the desk (small when idle, it
// grows on a call); Cần xử lý on the left,
// Đã xong hôm nay on the right, both compact. A call slides its card in from
// the right (a second call on the left), the desk turns soft green (soft brick
// when urgent), and when it ends the card folds and drops into Cần xử lý.
// Handoff 14 (founder 2026-10-06): the Orb is the on/off switch (click,
// confirm); off it turns red and the desk pink, and forwarded calls are
// rejected. The Hôm nay bar sits under it. The Orb keeps its place in the
// middle of the desk (founder: not where the handoff moved it).

const SIDE = 48; // page margin
const LEFT_W = 340; // Cần xử lý
const RIGHT_W = 300; // Đã xong hôm nay
const CARD_W = 400; // a live call / the request panel
const GAP = 40;
const ORB = 420; // canvas size on desktop (the sphere is ~64% of it)

function useLiveModel() {
  const app = useApp();
  const { phone, reduce, device } = useLayout();
  const { reqs, calls, now, offline, focus } = app;
  // the owner switched Bonia off (or never switched her on): forwarded calls are rejected
  const off = !app.biz.active;
  // the desk shows two calls at once; a third real call waits for a free place (slot null)
  const vms = calls.map((c) => callVm(c, now, app.listen)).filter((v) => v.phase !== "gone" && v.slot != null).sort((a, b) => a.slot - b.slot);
  const live = vms.filter((v) => v.phase === "live");
  const count = vms.length;
  const anyUrgent = live.some((v) => v.urgent);
  const focusV = vms.find((v) => v.id === focus && v.phase === "live") || live[live.length - 1];
  let mood = "idle";
  let tone = "warm";
  if (offline) {
    mood = "off";
    tone = "muted";
  } else if (off) {
    tone = "urgent";
  } else if (focusV) {
    mood = focusV.mood;
    tone = anyUrgent ? "urgent" : "green";
  }
  const bg = offline ? "#ECE9E3" : off ? "#F4ECE7" : anyUrgent ? "#F6E6DE" : live.length ? "#EEF0E6" : "#F2EEE6";
  const trCard = reduce ? "opacity 200ms linear" : `transform 650ms ${EASE}, opacity 450ms ease, height 450ms ${EASE}`;
  const today = reqs.filter((r) => r.day === 0);
  const open = today.filter((r) => r.status === "open").sort((a, b) => (b.urgent - a.urgent) || b.at.localeCompare(a.at));
  const done = today.filter((r) => r.status !== "open").sort((a, b) => (b.doneAt || b.at).localeCompare(a.doneAt || a.at));
  // W6: the tip, once, the first time Trực tiếp opens after Bật Bonia
  const tip = !off && !offline && !!app.biz.activatedAt && !app.biz.tipSeen && !count;
  return { app, phone, reduce, device, vms, live, count, focusV, mood, tone, bg, trCard, open, done, today, now, off, tip };
}

export function Live() {
  const m = useLiveModel();
  const [openId, setOpenId] = useState(null);
  const { app } = m;
  // the Orb's confirm dialog (W7) and the Hôm nay sheet (W9)
  const [ask, setAsk] = useState(null);
  const [todayOpen, setTodayOpen] = useState(false);
  const tapOrb = () => {
    if (app.offline) return; // unpaid: Thanh toán, not the switch
    if (m.tip) app.dismissTip();
    setAsk({ busy: false, error: "" });
  };
  const confirm = async () => {
    setAsk((a) => ({ ...a, busy: true, error: "" }));
    const r = await app.setActive(m.off);
    if (r.ok) setAsk(null);
    else setAsk({ busy: false, error: r.error });
  };
  const sw = { tapOrb, openToday: () => setTodayOpen(true) };
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
    clamp: 3,
    hoverActions: true,
    onOpen: () => setOpenId(r.id),
    onCopy: () => app.copy(r),
    onDone: () => {
      app.markDone(r.id, m.device);
      if (openId === r.id) setOpenId(null);
    },
  });
  const props = { m, detShown, detail, cardProps, openId, setOpenId, sw };
  return (
    <>
      {m.phone ? <PhoneLive {...props} /> : <DeskLive {...props} />}
      {ask && <SwitchDialog on={!m.off} name={flat(app.settings).name} busy={ask.busy} error={ask.error} phone={m.phone} onCancel={() => setAsk(null)} onConfirm={confirm} />}
      <TodaySheet open={todayOpen} onClose={() => setTodayOpen(false)} phone={m.phone} />
    </>
  );
}

function DoneRow({ r, now, selected, onOpen, phone }) {
  const flash = r.doneFlash && now - r.doneFlash < 2600;
  const auto = r.status === "auto";
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(); }}
      className="h-cream"
      style={{ display: "grid", gridTemplateColumns: "14px 38px minmax(0,1fr)", gap: 8, padding: phone ? "9px 4px" : "8px 6px", borderTop: "1px solid #E4DCCB", borderRadius: phone ? 0 : 6, background: flash ? "#E6EBDC" : "transparent", boxShadow: `inset 0 0 0 1px ${selected ? "#7B4A2D" : "transparent"}`, cursor: "pointer", transition: "background-color 1.2s ease" }}
    >
      <span style={{ color: "#4A6B3A", fontSize: 11.5 }}>✓</span>
      <span style={{ fontFamily: MONO, fontSize: 10.5, color: "#6E6255", paddingTop: 1 }}>{r.doneAt || r.at}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12.5, color: "#4A4239", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          <span style={{ fontWeight: 600, color: "#1F1B16" }}>{titleOf(r)}</span> · {r.summary}
        </span>
        <span style={{ fontSize: 11, color: "#6E6255" }}>{auto ? "Bonia tự xong" : `Đã xử lý · ${r.doneBy}`}</span>
      </div>
    </div>
  );
}

function OfflineNote({ trial }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" }}>
      <span style={{ fontSize: 15, fontWeight: 600, color: "#A0412D" }}>{trial ? "Hết dùng thử" : "Offline"}</span>
      <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.14em", color: "#6E6255" }}>{trial ? "HẾT 14 NGÀY DÙNG THỬ · CUỘC GỌI CHUYỂN TỚI ĐANG BỊ TỪ CHỐI" : "CHƯA THANH TOÁN THÁNG 9 · BONIA KHÔNG NHẬN CUỘC GỌI"}</span>
      <Link href="/tai-khoan" className="b-primary" style={{ height: 34, padding: "0 18px", borderRadius: 17, fontSize: 12.5, display: "flex", alignItems: "center", marginTop: 6 }}>Thanh toán</Link>
    </div>
  );
}

/** Off: why the desk is quiet, and how to switch Bonia back on (before the first Bật Bonia: via Thử Bonia). */
function OffNote({ never }) {
  return (
    <span style={{ fontSize: 13.5, lineHeight: 1.5, color: "#4A4239", textAlign: "center", pointerEvents: "auto" }}>
      {never ? <>Cuộc gọi chuyển tới đang bị từ chối · <Link href="/thu-bonia">gọi thử rồi bật Bonia</Link></> : "Cuộc gọi chuyển tới đang bị từ chối · bấm Orb để bật lại"}
    </span>
  );
}

function ColumnHead({ title, n, color, muted }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flex: "none", paddingBottom: 2 }}>
      <span style={{ fontFamily: SERIF, fontSize: 20, color: muted ? "#4A4239" : "#1F1B16" }}>{title}</span>
      <span style={{ fontFamily: MONO, fontSize: 14, color }}>{n}</span>
    </div>
  );
}

// ── desktop ─────────────────────────────────────────────────────────────

function DeskLive({ m, detShown, detail, cardProps, openId, setOpenId, sw }) {
  const [ref, width] = useRefWidth();
  const { app, count, reduce, trCard } = m;
  // The free space for the orb: between Cần xử lý and Đã xong when idle,
  // between Cần xử lý and the call card during a call.
  const leftEdge = SIDE + LEFT_W + GAP;
  const rightEdge = count || detShown ? SIDE + CARD_W + GAP : SIDE + RIGHT_W + GAP;
  const room = Math.max(160, width - leftEdge - rightEdge);
  // idle: small, as in handoff 13 direction D (founder 2026-10-04); a call grows it
  const scale = count ? Math.min(0.82, room / ORB) : 0.38;
  const slots = [0, 1].map((i) => {
    const v = m.vms.find((x) => x.slot === i);
    const two = m.vms.length === 2;
    const side = two && m.vms.indexOf(v) === 0 ? "left" : "right";
    if (!v) {
      const s = m.vms.length === 1 && m.vms[0].slot !== i ? "left" : "right";
      return { side: s, h: null, tf: reduce ? "none" : s === "right" ? `translateX(${CARD_W + 80}px)` : `translateX(-${CARD_W + 80}px)`, op: 0, pe: "none", vm: null, key: i };
    }
    let tf = "none";
    let op = 1;
    let h = null;
    if (v.phase === "summary") h = 64;
    if (v.phase === "fly") {
      h = 64;
      op = 0;
      tf = reduce ? "none" : side === "right" ? `translate(${-(width - 2 * SIDE - CARD_W)}px,40px) scale(0.6)` : "translate(0px,40px) scale(0.6)";
    }
    return { side, h, tf, op, pe: v.phase === "live" ? "auto" : "none", vm: v, key: i };
  });
  const handled = m.today.length;
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0, background: m.bg, transition: "background-color 900ms ease", overflow: "hidden" }}>
      <DeskHeader active={0} right={`${app.demo ? DEMO_LABEL_SHORT : dayLabel().toUpperCase()} · ${hm()}`} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 56, bottom: 0 }}>
        {/* Cần xử lý */}
        <div style={{ position: "absolute", left: SIDE, top: 36, bottom: 0, width: LEFT_W, display: "flex", flexDirection: "column", gap: 10, opacity: count === 2 ? 0 : 1, transition: "opacity 400ms ease" }}>
          <ColumnHead title="Cần xử lý" n={m.open.length} color="#7B4A2D" />
          <div style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", flexDirection: "column", gap: 8, paddingBottom: 36 }}>
            {!m.open.length && <div style={{ padding: "12px 2px", fontSize: 12.5, color: "#6E6255" }}>Không còn việc nào.</div>}
            {m.open.map((r) => <RequestCard key={r.id} {...cardProps(r)} />)}
          </div>
        </div>
        {/* Đã xong hôm nay */}
        <div style={{ position: "absolute", right: SIDE, top: 36, bottom: 36, width: RIGHT_W, display: "flex", flexDirection: "column", gap: 8, overflow: "auto", opacity: count || detShown ? 0 : 1, transition: "opacity 400ms ease", pointerEvents: count || detShown ? "none" : "auto" }}>
          <ColumnHead title="Đã xong hôm nay" n={m.done.length} color="#4A6B3A" muted />
          <div>{m.done.map((r) => <DoneRow key={r.id} r={r} now={m.now} selected={openId === r.id} onOpen={() => setOpenId(r.id)} />)}</div>
        </div>
        {/* the orb, centred in the free space */}
        <div style={{ position: "absolute", left: leftEdge, right: rightEdge, top: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, transition: `right 650ms ${EASE}`, pointerEvents: "none" }}>
          <div style={{ position: "relative", width: ORB * scale, height: ORB * scale, transition: `width 800ms ${EASE}, height 800ms ${EASE}`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: -48 }}>
            {/* the Orb is the switch (W7): click, then confirm */}
            <button type="button" onClick={sw.tapOrb} disabled={app.offline} aria-label={m.off ? "Bật Bonia" : "Tắt Bonia"} title={m.off ? "Bật Bonia" : "Tắt Bonia"} style={{ position: "absolute", inset: "8%", borderRadius: "50%", pointerEvents: "auto", cursor: app.offline ? "default" : "pointer", zIndex: 1 }} />
            <div style={{ transform: `scale(${scale})`, transition: `transform 800ms ${EASE}`, flex: "none" }}>
              <Orb size={ORB} mood={m.mood} tone={m.tone} pickup={app.pickups} reduce={reduce} lively={m.live.length > 0} />
            </div>
            {m.tip && <OrbTip onDone={app.dismissTip} style={{ left: "calc(100% + 16px)", top: "50%", transform: "translateY(-62%)" }} />}
          </div>
          {app.offline ? (
            <div style={{ pointerEvents: "auto" }}><OfflineNote trial={app.trialEnded} /></div>
          ) : (
            <span style={{ opacity: count ? 0 : 1, transition: "opacity 400ms ease", display: "flex" }}><OnOffStatus on={!m.off} calls={handled} /></span>
          )}
          {/* under the line, out of the flow: the Orb stays where it was */}
          {!app.offline && (
            <div style={{ position: "relative", width: "100%", height: 0, marginTop: -4 /* cancels the column's gap */ }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: count ? 0 : 1, transition: "opacity 400ms ease", pointerEvents: count ? "none" : "auto" }}>
                {m.off && <OffNote never={!app.biz.activatedAt} />}
                <TodayBar note={app.biz.today} onOpen={sw.openToday} width={Math.min(440, room - 24)} />
              </div>
            </div>
          )}
        </div>
        {/* live calls */}
        {slots.map((s) => (
          <div key={s.key} style={{ position: "absolute", [s.side === "right" ? "right" : "left"]: SIDE, top: 36, width: CARD_W, height: s.h ? s.h : "calc(100% - 72px)", transform: s.tf, opacity: s.op, pointerEvents: s.pe, transition: trCard }}>
            {s.vm && <LiveCallCard c={s.vm} />}
          </div>
        ))}
        {/* request panel */}
        <div style={{ position: "absolute", right: SIDE, top: 36, width: CARD_W, bottom: 36, transform: detShown || reduce ? "none" : `translateX(${CARD_W + 80}px)`, opacity: detShown ? 1 : 0, pointerEvents: detShown ? "auto" : "none", transition: trCard }}>
          {detail(14)}
        </div>
      </div>
    </div>
  );
}

// ── phone ───────────────────────────────────────────────────────────────

function PhoneLive({ m, detShown, detail, cardProps, setOpenId, sw }) {
  const { app, count, reduce, trCard } = m;
  const [expanded, setExpanded] = useState(false);
  const [doneOpen, setDoneOpen] = useState(false);
  const fv = m.vms.find((v) => v.id === app.focus && v.phase !== "gone") || m.live[m.live.length - 1] || m.vms[m.vms.length - 1];
  const other = m.vms.find((v) => v !== fv && v.phase === "live");
  let sheet = { h: 440, tf: reduce ? "none" : "translateY(105%)", op: 0, pe: "none", vm: null, hideT: true };
  if (fv) {
    let h = expanded ? 760 : 440;
    let tf = "none";
    let op = 1;
    if (fv.phase === "summary") h = 92;
    if (fv.phase === "fly") {
      h = 92;
      op = 0;
      tf = reduce ? "none" : "translateY(-380px) scale(0.9)";
    }
    sheet = { h, tf, op, pe: fv.phase === "live" ? "auto" : "none", vm: fv, hideT: !expanded };
  }
  return (
    <div style={{ position: "absolute", inset: 0, background: m.bg, transition: "background-color 900ms ease", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: "var(--tt-top)", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src={BONIA_MARK} alt="Bonia" style={{ height: 17, width: "auto" }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>{(flat(app.settings).name || "").replace(/^Khách sạn\s+/i, "")}</span>
        </div>
        {app.offline && (
          <Link href="/tai-khoan" style={{ height: 30, padding: "0 12px", borderRadius: 15, background: "#F6E7E1", color: "#A0412D", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center" }}>Offline · Thanh toán</Link>
        )}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: "calc(var(--tt-top) + 48px)", bottom: "calc(57px + var(--tt-bot))", overflow: "auto" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", height: count ? 200 : 140, transition: `height 700ms ${EASE}` }}>
            <div style={{ position: "relative", transform: count ? "scale(0.86)" : "scale(0.56)", transformOrigin: "50% 0", transition: `transform 700ms ${EASE}` }}>
              <Orb size={210} mood={m.mood} tone={m.tone} pickup={app.pickups} reduce={reduce} lively={m.live.length > 0} />
              <button type="button" onClick={sw.tapOrb} disabled={app.offline} aria-label={m.off ? "Bật Bonia" : "Tắt Bonia"} style={{ position: "absolute", inset: "12%", borderRadius: "50%" }} />
            </div>
            {!count && !app.offline && <span style={{ marginTop: -84, display: "flex" }}><OnOffStatus on={!m.off} calls={m.today.length} size={9} /></span>}
            {m.tip && <OrbTip arrow="up" onDone={app.dismissTip} style={{ top: 132, left: "calc(50% - 125px)" }} />}
          </div>
          {!count && !app.offline && (
            <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              {m.off && <OffNote never={!app.biz.activatedAt} />}
              <TodayBar note={app.biz.today} onOpen={sw.openToday} width="100%" />
            </div>
          )}
          <div style={{ padding: "0 16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            <ColumnHead title="Cần xử lý" n={m.open.length} color="#7B4A2D" />
            {!m.open.length && <div style={{ padding: "8px 2px", fontSize: 13, color: "#6E6255" }}>Không còn việc nào.</div>}
            {m.open.map((r) => <RequestCard key={r.id} {...cardProps(r)} />)}
            <button type="button" onClick={() => setDoneOpen((d) => !d)} style={{ minHeight: 44, marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 14px", border: "1px solid #D9D0BF", borderRadius: 10, background: "rgba(255,255,255,0.6)", fontSize: 13, color: "#4A4239" }}>
              <span>Đã xong hôm nay · <span style={{ fontFamily: MONO, color: "#4A6B3A" }}>{m.done.length}</span></span>
              <span style={{ fontSize: 12 }}>{doneOpen ? "Thu gọn ▴" : "Xem ▾"}</span>
            </button>
            {doneOpen && <div>{m.done.map((r) => <DoneRow key={r.id} r={r} now={m.now} phone onOpen={() => setOpenId(r.id)} />)}</div>}
          </div>
        </div>
      </div>
      <PhoneTabs active={0} />
      {other && (
        <button type="button" onClick={() => { app.setFocus(other.id); setExpanded(false); }} style={{ position: "absolute", left: 14, right: 14, bottom: sheet.h + 10, height: 40, zIndex: 5, border: `1px solid ${other.urgent ? "#EBCFC4" : "#D9D0BF"}`, borderRadius: 20, background: other.urgent ? "#F6E7E1" : "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 12.5, color: other.urgent ? "#A0412D" : "#7B4A2D" }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: other.urgent ? "#A0412D" : "#7B4A2D" }} />
          {other.otherText} · chạm để xem
        </button>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `min(${sheet.h}px, calc(100% - var(--tt-top) - 8px))`, transform: sheet.tf, opacity: sheet.op, pointerEvents: sheet.pe, transition: trCard, zIndex: 4, display: "flex", flexDirection: "column", background: "#fff", borderRadius: "20px 20px 0 0", boxShadow: "0 -8px 28px rgba(31,27,22,0.12)", overflow: "hidden", paddingBottom: "max(18px, var(--tt-bot))" }}>
        <button type="button" onClick={() => setExpanded((e) => !e)} aria-label="Kéo lên để xem lời thoại" style={{ height: 22, display: "flex", alignItems: "center", justifyContent: "center", flex: "none", width: "100%" }}>
          <span style={{ width: 36, height: 4, borderRadius: 2, background: "#D9D0BF" }} />
        </button>
        <div style={{ flex: 1, minHeight: 0 }}>{sheet.vm && <LiveCallCard c={sheet.vm} hideTranscript={sheet.hideT} radius={0} />}</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: "calc(var(--tt-top) + 7px)", bottom: 0, transform: detShown ? "none" : "translateY(105%)", transition: trCard, zIndex: 6, boxShadow: "0 -8px 28px rgba(31,27,22,0.14)", borderRadius: "18px 18px 0 0", pointerEvents: detShown ? "auto" : "none" }}>
        {detail("18px 18px 0 0")}
      </div>
    </div>
  );
}
