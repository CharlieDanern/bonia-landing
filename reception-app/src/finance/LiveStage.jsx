import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Orb } from "../components/Orb.jsx";
import { MONO } from "../ui.js";
import { BOXES, FLASH, NO_ANSWER, colOf, fmt, masked, mmss, needs, pct, spaced } from "./outbound-common.jsx";

// Gọi ra · Trực tiếp's field (handoff 16 "Goi Ra Live v4", update 17 "Sóng"): only conversations get a marker. A call
// the customer picks up comes out of the sphere into a fixed spot (a blue-noise point set inside an elliptical ring,
// so the first spots are spread out), drifts in place, and darkens with the call's length. When it ends, it waits
// for its result (the after-call label, a few seconds later), then flies into its box: the follow-up results in their
// colour, the rest as a small grey dot. The box's count goes up when it lands; until then the backend's count minus
// the flights still in the air, so the counts are always exact. Dialling and ringing calls are only counted.
// The data is real: the engine's calls in progress and the campaign's rows, polled by the page.

const PTS = (() => {
  // the prototype's point set (best-candidate sampling, seed 11) in its own 1072 × 570 field, then made relative to
  // the ellipse so it fits any size: x = CX + nx·RX, y = CY + ny·RY
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const CX = 536, CY = 285, RX = 480, RY = 285, T0 = 0.36;
  const out = [];
  for (let n = 0; n < 520; n++) {
    let best = null, bd = -1;
    for (let k = 0; k < 12; k++) {
      const a = rnd() * Math.PI * 2, t = Math.sqrt(T0 * T0 + rnd() * (1 - T0 * T0)), x = CX + Math.cos(a) * t * RX, y = CY + Math.sin(a) * t * RY;
      if (Math.abs(x - CX) < 140 && y > 330 && y < 380) continue; // the count under the sphere stays clear
      let md = 1e9;
      for (const p of out) { const d = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (d < md) md = d; }
      if (md > bd) { bd = md; best = [x, y, rnd() * 6.28]; }
    }
    out.push(best);
  }
  return out.map(([x, y, ph]) => [(x - CX) / RX, (y - CY) / RY, ph]);
})();

const ease = (p) => 1 - Math.pow(1 - p, 3);
const easeIO = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
/** Strokes darken with the call's length: rgb(150,104,70) at 0:00 → rgb(62,36,18) at 3:00+ (update 17). */
function durCol(sec) {
  const f = Math.pow(Math.min(1, Math.max(0, sec) / 180), 0.8), A = [150, 104, 70], B = [62, 36, 18];
  return `rgb(${A.map((a, i) => Math.round(a + (B[i] - a) * f)).join(",")})`;
}

/** The Sóng marker (update 17): bare round-capped strokes, a thin ring; the selected call gets an ink ring. */
function wave(g, x, y, k, wk, sel, now, col) {
  const n = k > 0.85 ? 5 : 3, gap = 3 * k, bw = Math.max(1.4, 1.7 * k), base = 5.2 * k, w2 = Math.max(wk, 0.35), ph = x * 0.031 + y * 0.017;
  g.strokeStyle = col; g.lineCap = "round"; g.lineWidth = bw;
  for (let i = 0; i < n; i++) {
    const mid = (n - 1) / 2, env = 1 - (Math.abs(i - mid) / (mid + 1)) * 0.6, wv = Math.abs(Math.sin(now / (sel ? 170 : 260) - i * 0.8 + ph));
    const a = Math.max(bw * 0.6, base * env * ((1 - w2) * 0.55 + w2 * (0.25 + 0.95 * wv))), bx = x + (i - mid) * gap;
    g.beginPath(); g.moveTo(bx, y - a); g.lineTo(bx, y + a); g.stroke();
  }
  g.lineCap = "butt";
  const r0 = Math.max(9, (n * gap) / 2 + 5.5 * Math.max(0.8, k)), ga = g.globalAlpha;
  g.globalAlpha = ga * 0.35; g.strokeStyle = col; g.lineWidth = 1; g.beginPath(); g.arc(x, y, r0, 0, 7); g.stroke(); g.globalAlpha = ga;
  if (sel) { g.strokeStyle = "#1F1B16"; g.lineWidth = 1; g.beginPath(); g.arc(x, y, r0 + 5, 0, 7); g.stroke(); }
}

const LABEL_WAIT_MS = 45_000; // a finished call whose result never comes fades out

/** The boxes in order: follow-up results (wide), then the rest and Không nghe máy (narrow); unknown results get a box. */
function boxesOf(direction, outcomes) {
  const known = BOXES[direction] || BOXES.outbound;
  const extra = Object.keys(outcomes || {}).filter((o) => !known.includes(o));
  const all = [...known, ...extra];
  return { need: all.filter(needs), quiet: [...all.filter((o) => !needs(o)), NO_ANSWER] };
}

export function LiveStage({ direction = "outbound", calls, feed, counts, skew = 0, pinnedId, onPin, binF, onBin, mask, reduce }) {
  const stageRef = useRef(null);
  const cvRef = useRef(null);
  const boxRefs = useRef({});
  const [size, setSize] = useState({ w: 1072, h: 736 });
  const [snap, setSnap] = useState({ talk: 0, hover: null, flash: {}, near: {}, inflight: {}, t: 0 });
  const S = useRef({ markers: new Map(), used: new Set(), rings: [], flash: {}, hover: null, lastFly: 0 }).current;
  const live = useRef({});
  live.current = { pinnedId, reduce, size, onPin };
  const skewRef = useRef(skew);
  skewRef.current = skew;

  // geometry (the prototype's 1072 × 736 stage: field 570 high, box header at 626, boxes 652–736)
  const geo = useMemo(() => {
    const W = size.w, H = size.h, fieldH = Math.max(260, H - 166);
    return { W, H, fieldH, CX: W / 2, CY: fieldH / 2, RX: Math.max(200, W / 2 - 56), RY: fieldH / 2 };
  }, [size]);
  const G = useRef(geo);
  G.current = geo;

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const on = () => { const r = el.getBoundingClientRect(); if (r.width && r.height) setSize((s) => (Math.abs(s.w - r.width) > 1 || Math.abs(s.h - r.height) > 1 ? { w: r.width, h: r.height } : s)); };
    on();
    const ro = new ResizeObserver(on);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const feedById = useMemo(() => new Map((feed || []).map((f) => [f.id, f])), [feed]);
  const feedRef = useRef(feedById);
  feedRef.current = feedById;

  const freeSlot = () => { let i = 0; while (S.used.has(i)) i++; S.used.add(i); return i; };
  /** Where a result lands: the top of its box, in stage coordinates. */
  const targetOf = (out) => {
    const el = boxRefs.current[out], st = stageRef.current;
    if (!el || !st) return { x: G.current.CX, y: G.current.H - 76 };
    const a = el.getBoundingClientRect(), b = st.getBoundingClientRect();
    return { x: a.left - b.left + a.width / 2, y: a.top - b.top + 8 };
  };

  // the engine's calls → markers: a new conversation comes out of the sphere; one that ended waits for its result
  useEffect(() => {
    const now = performance.now(), wall = Date.now() + skew;
    const talking = new Map((calls || []).filter((c) => c.state === "talking" && c.row_id).map((c) => [c.row_id, c]));
    for (const [id, c] of talking) {
      const ts = Date.parse(c.talking_since || c.since) || wall;
      const m = S.markers.get(id);
      if (!m) {
        const slot = freeSlot();
        S.markers.set(id, { id, slot, born: now, phase: "talk", talkAt: ts, name: c.name, phone: c.phone, prevCall: feedRef.current.get(id)?.call_id || null, x: G.current.CX, y: G.current.CY });
      } else if (m.phase === "talk") Object.assign(m, { name: c.name, phone: c.phone, talkAt: ts });
    }
    for (const m of S.markers.values()) if (m.phase === "talk" && !talking.has(m.id)) { m.phase = "wait"; m.endedAt = now; }
  }, [calls, skew]); // eslint-disable-line react-hooks/exhaustive-deps

  // the campaign's rows → a waiting marker's result: it flies to its box
  useEffect(() => {
    const now = performance.now();
    for (const m of S.markers.values()) {
      if (m.phase !== "wait") continue;
      const f = feedById.get(m.id);
      if (f && f.outcome && f.call_id && f.call_id !== m.prevCall) {
        S.used.delete(m.slot);
        m.out = f.outcome;
        const dense = S.markers.size > 200;
        if (live.current.reduce || (dense && now - S.lastFly < 110)) { land(m, now); continue; }
        S.lastFly = now;
        const t = targetOf(m.out);
        Object.assign(m, { phase: "fly", fs: now, fx: m.x, fy: m.y, tx: t.x, ty: t.y, cx: (m.x + t.x) / 2, cy: Math.min(m.y, t.y) + (t.y - m.y) * 0.15, dur: needs(m.out) ? 1100 : 700, p: 0 });
      }
    }
  }, [feedById]); // eslint-disable-line react-hooks/exhaustive-deps

  const land = (m, now) => {
    m.phase = "gone";
    S.flash[m.out] = now;
    if (needs(m.out) && !live.current.reduce) { const t = targetOf(m.out); S.rings.push({ x: t.x, y: t.y, t0: now, col: colOf(m.out) }); }
  };

  // Không nghe máy has no flight: its box lights up when the count goes up
  const lastNoAns = useRef(null);
  useEffect(() => {
    const n = counts?.no_answer ?? 0;
    if (lastNoAns.current != null && n > lastNoAns.current) S.flash[NO_ANSWER] = performance.now();
    lastNoAns.current = n;
  }, [counts?.no_answer]); // eslint-disable-line react-hooks/exhaustive-deps

  // the frame loop: move, draw, and a few times a second tell React what changed (counts in the air, the hover card)
  useEffect(() => {
    let raf = 0, lastSnap = 0;
    const loop = (now) => {
      const { W, H, CX, CY, RX, RY } = G.current;
      const red = live.current.reduce;
      for (const m of S.markers.values()) {
        if (m.phase === "talk" || m.phase === "wait") {
          const P = PTS[m.slot % PTS.length], k = red ? 1 : ease(Math.min(1, (now - m.born) / 450));
          const dx = red ? 0 : Math.sin(now / 2600 + P[2]) * 3, dy = red ? 0 : Math.cos(now / 3100 + P[2]) * 3.5;
          const px = CX + P[0] * RX, py = CY + P[1] * RY;
          m.x = CX + (px + dx - CX) * k; m.y = CY + (py + dy - CY) * k;
          if (m.phase === "wait" && now - m.endedAt > LABEL_WAIT_MS) { m.phase = "gone"; S.used.delete(m.slot); }
        } else if (m.phase === "fly") {
          const p = Math.min(1, (now - m.fs) / m.dur), e = easeIO(p), u = 1 - e;
          m.x = u * u * m.fx + 2 * u * e * m.cx + e * e * m.tx; m.y = u * u * m.fy + 2 * u * e * m.cy + e * e * m.ty; m.p = p;
          if (p >= 1) land(m, now);
        }
      }
      for (const [id, m] of S.markers) if (m.phase === "gone") S.markers.delete(id);
      S.rings = S.rings.filter((r) => now - r.t0 < 800);
      draw(now, W, H, CX, CY, RX, RY);
      if (now - lastSnap > 160) { lastSnap = now; snapshot(now); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function draw(now, W, H, CX, CY, RX, RY) {
    const cv = cvRef.current;
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const g = cv.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const red = live.current.reduce, pin = live.current.pinnedId, wall = Date.now() + skewRef.current;
    const talking = [...S.markers.values()].filter((m) => m.phase === "talk" || m.phase === "wait");
    const n = talking.length, sc = Math.max(0.42, Math.min(1.5, 1.5 * Math.sqrt(12 / Math.max(n, 12))));
    const wk = red ? 0 : Math.max(0, Math.min(1, (sc - 0.62) / 0.75));
    const pm = talking.find((m) => m.id === pin);
    g.setLineDash([1, 8]); g.strokeStyle = "#E6DED0"; g.lineWidth = 1;
    g.beginPath(); g.ellipse(CX, CY, RX * 0.68, RY * 0.68, 0, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    if (pm) { g.strokeStyle = "#B8AB94"; g.lineWidth = 1; g.beginPath(); g.moveTo(pm.x, pm.y); g.bezierCurveTo(pm.x + (W - pm.x) * 0.5, pm.y, W - 60, 46, W, 46); g.stroke(); }
    for (const m of S.markers.values()) {
      if (m.phase === "fly") {
        const fade = m.p < 0.8 ? 1 : 1 - (m.p - 0.8) / 0.2;
        if (needs(m.out)) { g.globalAlpha = 0.95 * fade; wave(g, m.x, m.y, sc * (1 - 0.35 * m.p), 0, false, now, colOf(m.out)); }
        else { g.globalAlpha = 0.35 * fade; g.fillStyle = "#B8AB94"; g.beginPath(); g.arc(m.x, m.y, 3.5, 0, 7); g.fill(); }
        g.globalAlpha = 1;
        continue;
      }
      if (m.phase !== "talk" && m.phase !== "wait") continue;
      const q = Math.min(1, (now - m.born) / 520);
      const em = red ? 1 : q >= 1 ? 1 : 1 + 2.2 * Math.pow(q - 1, 3) + 1.2 * Math.pow(q - 1, 2);
      const breathe = red ? 1 : 0.93 + 0.07 * Math.sin(now / 1800 + m.slot);
      const sel = m.id === pin || m.id === S.hover, dim = pm && m.id !== pin ? 0.4 : 1;
      // a call that ended and waits for its result: still, half faded
      const waiting = m.phase === "wait";
      g.globalAlpha = em * breathe * dim * (waiting ? 0.55 : 1);
      const k = sc * (sel ? 1.25 : 1) * (0.5 + 0.5 * em) * (red ? 1 : 1 + 0.05 * Math.sin(now / 1100 + m.slot * 1.7));
      wave(g, m.x, m.y, k, waiting ? 0 : wk, m.id === pin && !red && !waiting, waiting ? 0 : now, durCol((wall - m.talkAt) / 1000));
      g.globalAlpha = 1;
    }
    for (const r of S.rings) { const p = (now - r.t0) / 800; g.globalAlpha = (1 - p) * 0.5; g.strokeStyle = r.col; g.lineWidth = 1.2; g.beginPath(); g.arc(r.x, r.y, 4 + p * 22, 0, 7); g.stroke(); }
    g.globalAlpha = 1;
  }
  function snapshot(now) {
    const inflight = {}, near = {};
    let talk = 0;
    for (const m of S.markers.values()) {
      if (m.phase === "talk") talk++;
      if (m.phase === "fly") { inflight[m.out] = (inflight[m.out] || 0) + 1; if (m.p > 0.55 && needs(m.out)) near[m.out] = 1; }
    }
    const h = S.hover && S.markers.get(S.hover);
    const hover = h && (h.phase === "talk" || h.phase === "wait") ? { name: h.name, phone: h.phone, x: h.x, y: h.y, el: (Date.now() + skewRef.current - h.talkAt) / 1000, ended: h.phase === "wait" } : null;
    setSnap({ talk, hover, flash: { ...S.flash }, near, inflight, t: now });
  }

  const hit = (e) => {
    const el = stageRef.current;
    if (!el) return null;
    const rc = el.getBoundingClientRect(), x = e.clientX - rc.left, y = e.clientY - rc.top;
    let best = null, bd = (S.markers.size > 200 ? 10 : 20) ** 2;
    for (const m of S.markers.values()) {
      if (m.phase !== "talk" && m.phase !== "wait") continue;
      const d = (m.x - x) ** 2 + (m.y - y) ** 2;
      if (d < bd) { bd = d; best = m.id; }
    }
    return best;
  };

  const { W, H, fieldH, CX, CY } = geo;
  const ringN = (calls || []).filter((c) => c.state !== "talking").length;
  const liveN = (calls || []).length;
  const o = counts?.outcomes || {};
  const shown = (k) => Math.max(0, (k === NO_ANSWER ? counts?.no_answer || 0 : o[k] || 0) - (snap.inflight[k] || 0));
  const opened = useRef(null);
  if (!opened.current && counts) opened.current = { ...o, [NO_ANSWER]: counts.no_answer || 0 };
  const called = counts?.called || 0;
  const { need, quiet } = boxesOf(direction, o);
  const needN = need.reduce((a, k) => a + shown(k), 0);
  const quietN = quiet.reduce((a, k) => a + shown(k), 0);
  const cols = `${need.map(() => "1.25fr").join(" ")} 12px ${quiet.map(() => "0.8fr").join(" ")}`;
  const box = (k, wide) => {
    const n = shown(k), d = n - (opened.current?.[k] || 0), fl = snap.flash[k] && snap.t - snap.flash[k] < 700, sel = binF === k;
    const bg = fl ? FLASH[k] || "#F7F3EC" : sel ? "#FBF5EC" : "#FFFFFF";
    const bd = sel ? "#7B4A2D" : wide && snap.near[k] ? colOf(k) : wide ? "#D9D0BF" : "#E9E2D5";
    const sub = [pct(n, called), d > 0 ? `+${fmt(d)}` : ""].filter(Boolean).join(" · ");
    return (
      <button key={k} ref={(el) => { boxRefs.current[k] = el; }} type="button" onClick={() => onBin(sel ? null : k)} style={{ minWidth: 0, border: `1px solid ${bd}`, borderRadius: 12, background: bg, padding: wide ? "8px 12px" : "8px 10px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3, cursor: "pointer", textAlign: "left", transition: "background-color 900ms ease, border-color 300ms ease" }}>
        {wide ? (
          <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "#1F1B16" }}><span style={{ width: 7, height: 7, borderRadius: 4, background: colOf(k), flex: "none" }} />{k}</span>
        ) : (
          <span style={{ fontSize: 12, color: "#4A4239", lineHeight: 1.25 }}>{k}</span>
        )}
        <span style={{ fontFamily: MONO, fontSize: wide ? 24 : 15, lineHeight: 1, color: wide ? "#1F1B16" : "#6E6255" }}>{fmt(n)}</span>
        <span style={{ marginTop: "auto", fontFamily: MONO, fontSize: wide ? 11 : 10.5, color: "#6E6255" }}>{sub}</span>
      </button>
    );
  };
  const hv = snap.hover;

  return (
    <div ref={stageRef} onMouseMove={(e) => { const id = hit(e); if (id !== S.hover) { S.hover = id; snapshot(performance.now()); } }} onMouseLeave={() => { S.hover = null; snapshot(performance.now()); }} onClick={(e) => { const id = hit(e); if (id) onPin(id); }} style={{ position: "absolute", inset: 0, cursor: hv ? "pointer" : "default" }}>
      <div style={{ position: "absolute", left: 0, top: 0, display: "flex", gap: 8, alignItems: "center", fontSize: 11.5, color: "#6E6255", pointerEvents: "none" }}>
        <span style={{ width: 16, height: 16, borderRadius: 8, border: "1px solid rgba(122,75,42,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5 }}>
          {[4, 8, 4].map((h, i) => <span key={i} style={{ width: 1.6, height: h, borderRadius: 1, background: "#7A4B2A" }} />)}
        </span>
        <span>Mỗi biểu tượng là một cuộc đang trò chuyện · màu đậm dần theo thời lượng</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 8 }}>
          <span style={{ fontFamily: MONO, fontSize: 10.5 }}>0:00</span>
          <span style={{ width: 70, height: 6, borderRadius: 3, background: "linear-gradient(90deg,#96684A,#3E2412)" }} />
          <span style={{ fontFamily: MONO, fontSize: 10.5 }}>3:00+</span>
        </span>
      </div>
      <div style={{ position: "absolute", left: CX - 55, top: CY - 55, width: 110, height: 110, pointerEvents: "none" }}>
        <Orb size={110} mood={liveN ? "bonia" : "idle"} tone={liveN ? "green" : "warm"} lively={liveN > 0} reduce={reduce} />
      </div>
      <canvas ref={cvRef} style={{ position: "absolute", left: 0, top: 0, width: W, height: H, pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: CX - 60, top: CY - 35, width: 120, height: 70, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, pointerEvents: "none", background: "radial-gradient(closest-side,rgba(242,238,230,0.92),rgba(242,238,230,0))" }}>
        <span style={{ fontFamily: MONO, fontSize: 24, lineHeight: 1, color: "#1F1B16" }}>{fmt(liveN)}</span>
        <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.18em", color: "#4A6B3A" }}>ĐANG GỌI</span>
      </div>
      <div style={{ position: "absolute", left: CX - 200, top: CY + 65, width: 400, display: "flex", justifyContent: "center", gap: 18, fontSize: 12, color: "#4A4239", pointerEvents: "none" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#7A4B2A" }}><span style={{ fontFamily: MONO, fontWeight: 500 }}>{fmt(snap.talk)}</span> trò chuyện</span>
        <span style={{ color: "#B8AB94" }}>·</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#6E6255" }}><span style={{ fontFamily: MONO }}>{fmt(ringN)}</span> đổ chuông</span>
      </div>
      {pinnedId && [...S.markers.values()].some((m) => m.id === pinnedId && (m.phase === "talk" || m.phase === "wait")) && (
        <div style={{ position: "absolute", left: W, top: 46, width: 24, height: 1, background: "#B8AB94", pointerEvents: "none" }} />
      )}
      <div style={{ position: "absolute", left: 0, right: 0, top: H - 110, height: 22, display: "grid", gridTemplateColumns: cols, columnGap: 10, pointerEvents: "none" }}>
        <div style={{ gridColumn: `1 / span ${need.length}`, display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid #B8AB94", paddingTop: 5, gap: 8, minWidth: 0 }}>
          <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.18em", color: "#4A4239", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>CẦN TƯ VẤN VIÊN GỌI LẠI</span>
          <span style={{ fontSize: 12.5, color: "#1F1B16", whiteSpace: "nowrap" }}><span style={{ fontFamily: MONO, fontWeight: 500 }}>{fmt(needN)}</span> khách cần xử lý</span>
        </div>
        <div style={{ gridColumn: `${need.length + 2} / span ${quiet.length}`, display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid #E4DCCB", paddingTop: 5 }}>
          <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.18em", color: "#6E6255" }}>KHÔNG CẦN XỬ LÝ</span>
          <span style={{ fontFamily: MONO, fontSize: 11.5, color: "#6E6255" }}>{fmt(quietN)}</span>
        </div>
      </div>
      <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", left: 0, right: 0, top: H - 84, height: 84, display: "grid", gridTemplateColumns: cols, columnGap: 10 }}>
        {need.map((k) => box(k, true))}
        <span />
        {quiet.map((k) => box(k, false))}
      </div>
      {hv && (
        <div style={{ position: "absolute", left: Math.min(W - 210, hv.x + 18), top: Math.max(24, Math.min(fieldH, hv.y - 34)), width: 200, padding: "9px 11px", borderRadius: 10, background: "#fff", border: "1px solid #D9D0BF", boxShadow: "0 8px 22px rgba(31,27,22,0.10)", display: "flex", flexDirection: "column", gap: 3, pointerEvents: "none", fontSize: 12.5 }}>
          <span style={{ fontWeight: 600 }}>{hv.name || "Khách"}</span>
          <span style={{ fontFamily: MONO, fontSize: 11.5, color: "#4A4239" }}>{mask ? masked(hv.phone) : spaced(hv.phone)}</span>
          <span style={{ color: hv.ended ? "#6E6255" : "#4A6B3A" }}>{hv.ended ? "Vừa xong · đang ghi kết quả" : `Đang trò chuyện · ${mmss(hv.el)}`}</span>
        </div>
      )}
    </div>
  );
}
