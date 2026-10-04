import React, { useEffect, useRef } from "react";

// The Bonia live orb (handoff 13, bonia-orb-live.js): the landing's "signal"
// sphere (src/reception/Orb.jsx: 120 nodes, 4 nearest neighbours, amber waves)
// with call states.
//   size     px
//   mood     idle | bonia | guest | writing | handed | off
//   tone     warm | green | urgent | muted
//   pickup   a counter; changing it fires the pick-up burst
//   lively   during a call: more energy, denser and faster waves
//   reduce   still frame per state (also follows prefers-reduced-motion)

const TAU = Math.PI * 2;
const TILT = -0.3;
const CT = Math.cos(TILT);
const ST = Math.sin(TILT);

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NET = (() => {
  const rand = mulberry32(20261028);
  const N = 120;
  const nodes = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - ((i + 0.5) / N) * 2 + (rand() - 0.5) * 0.05;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = i * 2.399963 + (rand() - 0.5) * 0.6;
    const x = Math.cos(th) * r;
    const z = Math.sin(th) * r;
    const m = Math.hypot(x, y, z) || 1;
    nodes.push([x / m, y / m, z / m, rand() * TAU, 0.6 + rand() * 0.9]);
  }
  const edges = [];
  const seen = new Set();
  nodes.forEach((a, i) => {
    nodes
      .map((b, j) => [j, (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2])
      .filter((d) => d[0] !== i)
      .sort((p, q) => p[1] - q[1])
      .slice(0, 4)
      .forEach(([j]) => {
        const k = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!seen.has(k)) {
          seen.add(k);
          edges.push([i, j]);
        }
      });
  });
  return { nodes, edges };
})();

const project = (x, y, z, cr, sr) => {
  const X = x * cr + z * sr;
  const Z = -x * sr + z * cr;
  return [X, y * CT - Z * ST, y * ST + Z * CT];
};
const unproject = (X, Y1, Z1, cr, sr) => {
  const y = Y1 * CT + Z1 * ST;
  const Z = -Y1 * ST + Z1 * CT;
  const x = X * cr - Z * sr;
  const z = X * sr + Z * cr;
  const m = Math.hypot(x, y, z) || 1;
  return [x / m, y / m, z / m];
};

const MOODS = {
  idle: { e: 0.22, every: 3.2, from: "any", speed: 1, spin: 0.14 },
  bonia: { e: 0.85, every: 0.85, from: "front", speed: 1.15, spin: 0.2 },
  guest: { e: 0.55, every: 1.15, from: "side", speed: 1, spin: 0.17 },
  writing: { e: 1.0, every: 0.45, from: "any", speed: 1.3, spin: 0.3 },
  handed: { e: 0.1, every: 4.5, from: "any", speed: 0.5, spin: 0.06 },
  off: { e: 0, every: 99, from: "any", speed: 0.06, spin: 0.01 },
};
const TONES = {
  warm: { base: [123, 74, 45], lit: [43, 20, -9], glow: "214,140,70", pulse: "166,94,36", halo: "230,170,110", shadow: "123,74,45" },
  urgent: { base: [128, 66, 48], lit: [44, -2, 6], glow: "206,112,88", pulse: "160,65,45", halo: "232,160,140", shadow: "160,65,45" },
  green: { base: [86, 128, 92], lit: [62, 74, 26], glow: "150,205,135", pulse: "74,128,84", halo: "196,232,184", shadow: "74,107,58" },
  muted: { base: [128, 118, 106], lit: [10, 8, 4], glow: "170,160,150", pulse: "128,118,106", halo: "210,204,196", shadow: "110,98,85" },
};

function newState(S) {
  return { cx: S / 2, cy: S / 2, R: S * 0.32, t: 0, e: 0.2, burst: 0, rot: 0.6, dt: 0, nextWave: 0.4, waves: [], pulses: [], F: null };
}

function spawn(s, from, rnd, amp) {
  const cr = Math.cos(s.rot);
  const sr = Math.sin(s.rot);
  let o;
  if (from === "front") o = unproject((rnd() - 0.5) * 0.25, (rnd() - 0.5) * 0.25, 1, cr, sr);
  else if (from === "side") o = unproject(0.92, (rnd() - 0.5) * 0.5, 0.35, cr, sr);
  else {
    const n = NET.nodes[(rnd() * NET.nodes.length) | 0];
    o = [n[0], n[1], n[2]];
  }
  s.waves.push({ o, r: 0, sp: 0.24 + rnd() * 0.1, amp: amp || 0.7 + rnd() * 0.3 });
}

function step(s, rnd, m) {
  const e = Math.min(1.4, s.e + s.burst);
  const dt = s.dt;
  s.nextWave -= dt;
  if (s.nextWave <= 0) {
    spawn(s, m.from, rnd);
    s.nextWave = m.every * (0.75 + rnd() * 0.5);
  }
  s.waves = s.waves.filter((w) => (w.r += dt * w.sp * (m.from === "front" ? 1.25 : 1)) < 1.2);
  s.F = NET.nodes.map((n) => {
    let v = 0;
    for (const w of s.waves) {
      const dd = Math.hypot(n[0] - w.o[0], n[1] - w.o[1], n[2] - w.o[2]) - w.r;
      const life = Math.sin(Math.min(1, w.r / 1.2) * Math.PI);
      v = Math.max(v, Math.exp(-(dd * dd) / 0.01) * life * w.amp);
    }
    return v;
  });
  if (rnd() < (0.8 + e * 3.5) * dt) {
    const lit = NET.edges.filter((ed) => s.F[ed[0]] > 0.45);
    const src = lit.length ? lit : NET.edges;
    const ed = src[(rnd() * src.length) | 0];
    s.pulses.push({ ed: lit.length || rnd() < 0.5 ? ed : [ed[1], ed[0]], p: 0, sp: 0.28 + rnd() * 0.22 });
  }
  s.pulses = s.pulses.filter((pl) => (pl.p += dt * pl.sp * (1 + e * 0.3)) < 1);
}

function paint(ctx, s, T) {
  const { cx, R, t, rot, F } = s;
  const e = Math.min(1.4, s.e + s.burst);
  const bob = Math.sin(t * 0.7) * 3;
  const cy = s.cy - R * 0.14 + bob;
  const sy = s.cy + R * 1.2;
  ctx.save();
  ctx.translate(cx, sy);
  ctx.scale(1, 0.16);
  const sg = ctx.createRadialGradient(0, 0, 1, 0, 0, R * 0.95);
  sg.addColorStop(0, `rgba(${T.shadow},${0.3 - bob * 0.012 + e * 0.08})`);
  sg.addColorStop(1, `rgba(${T.shadow},0)`);
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.95, 0, TAU);
  ctx.fill();
  ctx.restore();
  const hg = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * (1.4 + s.burst * 0.5));
  hg.addColorStop(0, `rgba(${T.halo},${0.16 + e * 0.24})`);
  hg.addColorStop(1, "rgba(245,228,201,0)");
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(cx, cy, R * (1.4 + s.burst * 0.5), 0, TAU);
  ctx.fill();
  const cr = Math.cos(rot);
  const sr = Math.sin(rot);
  const P = NET.nodes.map((n) => {
    const w = 1 + e * 0.018 * Math.sin(n[1] * 4 + t * 1.4) + s.burst * 0.05;
    return project(n[0] * w, n[1] * w, n[2] * w, cr, sr);
  });
  const X = (p) => cx + p[0] * R * (1 + p[2] * 0.12);
  const Y = (p) => cy + p[1] * R * (1 + p[2] * 0.12);
  ctx.lineCap = "round";
  for (const [i, j] of NET.edges) {
    const a = P[i];
    const b = P[j];
    const d = ((a[2] + b[2]) / 2 + 1) / 2;
    const hot = (F[i] + F[j]) * 0.5 * e;
    ctx.strokeStyle = `rgba(${T.base.join(",")},${Math.min(0.9, 0.4 * (0.12 + d * 0.88) + hot * 0.14)})`;
    ctx.lineWidth = 0.55 + d * 0.65;
    ctx.beginPath();
    ctx.moveTo(X(a), Y(a));
    ctx.lineTo(X(b), Y(b));
    ctx.stroke();
  }
  for (const pl of s.pulses) {
    const a = P[pl.ed[0]];
    const b = P[pl.ed[1]];
    const d = ((a[2] + b[2]) / 2 + 1) / 2;
    const x = X(a) + (X(b) - X(a)) * pl.p;
    const y = Y(a) + (Y(b) - Y(a)) * pl.p;
    const fade = Math.sin(pl.p * Math.PI);
    const gr = ctx.createRadialGradient(x, y, 0, x, y, 7);
    gr.addColorStop(0, `rgba(${T.glow},${(0.2 + d * 0.7) * fade})`);
    gr.addColorStop(1, `rgba(${T.glow},0)`);
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, TAU);
    ctx.fill();
    ctx.fillStyle = `rgba(${T.pulse},${(0.3 + d * 0.7) * fade})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.8, 0, TAU);
    ctx.fill();
  }
  const order = P.map((p, i) => i).sort((i, j) => P[i][2] - P[j][2]);
  for (const i of order) {
    const p = P[i];
    const d = (p[2] + 1) / 2;
    const f = F[i];
    const g = 1.1 * (0.04 + f * (0.4 + e * 0.9));
    const x = X(p);
    const y = Y(p);
    const r = (1.1 + d * 1.6) * (1 + f * 0.35);
    if (g * d > 0.08) {
      const gr = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
      gr.addColorStop(0, `rgba(${T.glow},${Math.min(0.75, g * d)})`);
      gr.addColorStop(1, `rgba(${T.glow},0)`);
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(x, y, r * 5, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = `rgba(${Math.round(T.base[0] + T.lit[0] * f)},${Math.round(T.base[1] + T.lit[1] * f)},${Math.round(T.base[2] + T.lit[2] * f)},${0.22 + d * 0.78})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    if (f > 0.6 && d > 0.5) {
      ctx.fillStyle = `rgba(255,248,238,${Math.min(0.9, (f - 0.6) * 2.2 * d)})`;
      ctx.beginPath();
      ctx.arc(x, y, r * 0.45, 0, TAU);
      ctx.fill();
    }
  }
}

function systemReduce() {
  return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Orb({ size = 340, mood = "idle", tone = "warm", pickup = 0, lively = false, reduce: reduceProp = false, still = false }) {
  const ref = useRef(null);
  const live = useRef({ mood, tone, pickup, lively, still });
  const redraw = useRef(null);
  live.current = { mood, tone, pickup, lively, still };
  const reduce = !!reduceProp || systemReduce();

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv && cv.getContext("2d");
    if (!ctx) return undefined;
    const S = size;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(S * dpr);
    cv.height = Math.round(S * dpr);
    ctx.setTransform(cv.width / S, 0, 0, cv.height / S, 0, 0);
    const st = newState(S);
    let lastPickup = live.current.pickup;
    const tonePal = () => TONES[live.current.mood === "off" ? "muted" : live.current.tone || "warm"] || TONES.warm;
    const moodOf = () => MOODS[live.current.mood] || MOODS.idle;
    if (reduce) {
      redraw.current = () => {
        const m = moodOf();
        const rnd = mulberry32(7);
        const s2 = newState(S);
        s2.e = m.e;
        s2.dt = 0.05;
        for (let i = 0; i < 50; i++) step(s2, rnd, { ...m, every: 0.9 });
        if (m.e === 0) s2.F = s2.F.map(() => 0);
        ctx.clearRect(0, 0, S, S);
        paint(ctx, s2, tonePal());
      };
      redraw.current();
      return () => {
        redraw.current = null;
      };
    }
    let raf = 0;
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      st.dt = dt;
      const p = live.current;
      const m0 = moodOf();
      const m = p.lively && m0.e > 0.15 ? { ...m0, e: Math.min(1.25, m0.e * 1.3), every: m0.every * 0.55, speed: m0.speed * 1.35, spin: m0.spin * 1.6 } : m0;
      if (p.pickup !== lastPickup) {
        lastPickup = p.pickup;
        st.burst = 0.9;
        for (let k = 0; k < 3; k++) spawn(st, "front", Math.random, 1);
        st.nextWave = 0.35;
      }
      st.burst = Math.max(0, st.burst - dt * 1.1);
      st.e += (m.e - st.e) * Math.min(1, dt * 1.6);
      if (!p.still) {
        st.t += dt * m.speed;
        st.rot += dt * (m.spin + st.e * 0.12);
      }
      step(st, Math.random, m);
      ctx.clearRect(0, 0, S, S);
      paint(ctx, st, tonePal());
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [size, reduce]);

  useEffect(() => {
    if (redraw.current) redraw.current();
  }, [mood, tone]);

  return <canvas ref={ref} aria-hidden="true" style={{ display: "block", width: size, height: size }} />;
}
