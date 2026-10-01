import { useEffect, useRef, useState } from "react";

/* The Bonia orb, handoff v4 (bonia-orb.js), variant "signal" only.
 *
 * 120 nodes on a jittered Fibonacci sphere, each wired to its 4 nearest
 * neighbours. Signal waves start at a random node and sweep across the
 * network as a ring; nodes near the ring light up amber with a cream centre,
 * and small pulses run along edges out of the lit nodes. `thinking` raises
 * the energy (brighter, faster, more waves), `running={false}` winds it down.
 *
 * The maths, constants and draw order are the original's, unchanged, so the
 * picture matches the prototype at 220 (call player) and 130 (§01 phone).
 * What differs is plumbing only:
 * - props are read through a ref, so thinking/running changes never restart
 *   the loop; only a new `size` rebuilds the canvas;
 * - the loop stops while the canvas is offscreen (IntersectionObserver);
 * - prefers-reduced-motion draws one still frame (time frozen, energy at its
 *   final value, a settled wave from a fixed seed) and redraws it when the
 *   props change, instead of the original's still-moving waves;
 * - the canvas keeps a square aspect ratio if a parent squeezes it. */

const TAU = Math.PI * 2;
const TILT = -0.3;
const COS_TILT = Math.cos(TILT);
const SIN_TILT = Math.sin(TILT);
const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

// Variant "signal" options from bonia-orb.js.
const LINE_A = 0.4;
const GLOW = 1.1;
const BASE = 0.04;

// Seeded PRNG (mulberry32), same as the original's `rand`.
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

// The network, built once. Same PRNG call order as the original, so the node
// positions and edges are identical. (The original also drew 120 random
// "chords" after this; only other variants used them.)
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
        const k = i < j ? i + "-" + j : j + "-" + i;
        if (!seen.has(k)) {
          seen.add(k);
          edges.push([i, j]);
        }
      });
  });
  return { nodes, edges };
})();

// Spin about Y by `rot`, then tilt about X by -0.3 rad.
const project = (x, y, z, cr, sr) => {
  const X = x * cr + z * sr;
  const Z = -x * sr + z * cr;
  return [X, y * COS_TILT - Z * SIN_TILT, y * SIN_TILT + Z * COS_TILT];
};

const targetEnergy = (p) => (p.thinking ? 1 : p.running !== false ? 0.3 : 0);

const newState = (S) => ({ cx: S / 2, cy: S / 2, R: S * 0.32, t: 0, e: 0, rot: 0.6, dt: 0, nextWave: 0.4, waves: [], pulses: [], F: null });

// Advance waves and edge pulses by s.dt; leaves each node's light level in s.F.
function step(s, rnd) {
  const { e, dt } = s;
  s.nextWave -= dt;
  if (s.nextWave <= 0) {
    s.waves.push({ o: NET.nodes[(rnd() * NET.nodes.length) | 0], r: 0, sp: 0.22 + rnd() * 0.1, amp: 0.7 + rnd() * 0.3 });
    s.nextWave = (2.8 - e * 1.4) * (0.7 + rnd() * 0.6);
  }
  s.waves = s.waves.filter((w) => (w.r += dt * w.sp) < 1.2);
  const F = NET.nodes.map((n) => {
    let v = 0;
    for (const w of s.waves) {
      const dd = Math.hypot(n[0] - w.o[0], n[1] - w.o[1], n[2] - w.o[2]) - w.r;
      const life = Math.sin(Math.min(1, w.r / 1.2) * Math.PI);
      v = Math.max(v, Math.exp(-(dd * dd) / 0.01) * life * w.amp);
    }
    return v;
  });
  s.F = F;

  if (rnd() < (0.8 + e * 3.5) * dt) {
    const lit = NET.edges.filter((ed) => F[ed[0]] > 0.45);
    const src = lit.length ? lit : NET.edges;
    const ed = src[(rnd() * src.length) | 0];
    s.pulses.push({ ed: lit.length || rnd() < 0.5 ? ed : [ed[1], ed[0]], p: 0, sp: 0.28 + rnd() * 0.22 });
  }
  s.pulses = s.pulses.filter((pl) => (pl.p += dt * pl.sp * (1 + e * 0.3)) < 1);
}

// One frame: floor shadow, halo, edges, pulses, then nodes back to front.
function paint(ctx, s) {
  const { cx, R, t, e, rot, F } = s;
  const bob = Math.sin(t * 0.7) * 3;
  const cy = s.cy - R * 0.14 + bob;
  const sy = s.cy + R * 1.2;

  ctx.save();
  ctx.translate(cx, sy);
  ctx.scale(1, 0.16);
  const sg = ctx.createRadialGradient(0, 0, 1, 0, 0, R * 0.95);
  sg.addColorStop(0, "rgba(123,74,45," + (0.3 - bob * 0.012 + e * 0.08) + ")");
  sg.addColorStop(1, "rgba(123,74,45,0)");
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.95, 0, TAU);
  ctx.fill();
  ctx.restore();

  const hg = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.4);
  hg.addColorStop(0, "rgba(230,170,110," + (0.16 + e * 0.24) + ")");
  hg.addColorStop(1, "rgba(245,228,201,0)");
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.4, 0, TAU);
  ctx.fill();

  const cr = Math.cos(rot);
  const sr = Math.sin(rot);
  const P = NET.nodes.map((n) => {
    const w = 1 + e * 0.018 * Math.sin(n[1] * 4 + t * 1.4);
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
    ctx.strokeStyle = "rgba(123,74,45," + Math.min(0.9, LINE_A * (0.12 + d * 0.88) + hot * 0.14) + ")";
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
    gr.addColorStop(0, "rgba(214,140,70," + (0.2 + d * 0.7) * fade + ")");
    gr.addColorStop(1, "rgba(214,140,70,0)");
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(166,94,36," + (0.3 + d * 0.7) * fade + ")";
    ctx.beginPath();
    ctx.arc(x, y, 1.8, 0, TAU);
    ctx.fill();
  }

  const order = P.map((p, i) => i).sort((i, j) => P[i][2] - P[j][2]);
  for (const i of order) {
    const p = P[i];
    const d = (p[2] + 1) / 2;
    const f = F[i];
    const g = GLOW * (BASE + f * (0.4 + e * 0.9));
    const x = X(p);
    const y = Y(p);
    const r = (1.1 + d * 1.6) * (1 + f * 0.35);
    if (g * d > 0.08) {
      const gr = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
      gr.addColorStop(0, "rgba(214,140,70," + Math.min(0.75, g * d) + ")");
      gr.addColorStop(1, "rgba(214,140,70,0)");
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(x, y, r * 5, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle =
      "rgba(" + Math.round(123 + 43 * f) + "," + Math.round(74 + 20 * f) + "," + Math.round(45 - 9 * f) + "," + (0.22 + d * 0.78) + ")";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    if (f > 0.6 && d > 0.5) {
      ctx.fillStyle = "rgba(255,248,238," + Math.min(0.9, (f - 0.6) * 2.2 * d) + ")";
      ctx.beginPath();
      ctx.arc(x, y, r * 0.45, 0, TAU);
      ctx.fill();
    }
  }
}

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(
    () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(REDUCE_QUERY).matches
  );
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(REDUCE_QUERY);
    const sync = () => setReduce(mq.matches);
    sync();
    if (mq.addEventListener) mq.addEventListener("change", sync);
    else mq.addListener(sync);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", sync);
      else mq.removeListener(sync);
    };
  }, []);
  return reduce;
}

// Reduced motion: simulate this long before drawing the one still frame, so
// it shows a wave mid-sweep rather than a dark, empty network.
const STILL_SEED = 20261028;
const STILL_STEPS = 60; // 60 × 50 ms = 3 s
const STILL_DT = 0.05;

export default function Orb({ size = 220, thinking = false, running = true, maxDpr = 2, style }) {
  const canvasRef = useRef(null);
  const live = useRef({ thinking, running });
  live.current = { thinking, running };
  const redraw = useRef(null);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv && cv.getContext("2d");
    if (!ctx) return undefined;
    const S = size;
    const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
    cv.width = Math.round(S * dpr);
    cv.height = Math.round(S * dpr);
    ctx.setTransform(cv.width / S, 0, 0, cv.height / S, 0, 0);
    const st = newState(S);
    const draw = () => {
      ctx.clearRect(0, 0, S, S);
      paint(ctx, st);
    };

    if (reduce) {
      const rnd = mulberry32(STILL_SEED);
      st.e = targetEnergy(live.current);
      st.dt = STILL_DT;
      for (let i = 0; i < STILL_STEPS; i++) step(st, rnd);
      draw();
      redraw.current = () => {
        st.e = targetEnergy(live.current);
        draw();
      };
      return () => {
        redraw.current = null;
      };
    }

    let raf = 0;
    let last = 0;
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      st.dt = dt;
      const p = live.current;
      const isRunning = p.running !== false;
      st.e += (targetEnergy(p) - st.e) * Math.min(1, dt * 1.1);
      st.t += dt * (isRunning ? 1 : 0.15);
      st.rot += dt * ((isRunning ? 0.16 : 0.04) + st.e * 0.3);
      step(st, Math.random);
      draw();
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    let io = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          if (entries[entries.length - 1].isIntersecting) start();
          else stop();
        },
        { rootMargin: "80px" }
      );
      io.observe(cv);
    }
    start();
    return () => {
      stop();
      if (io) io.disconnect();
    };
  }, [size, maxDpr, reduce]);

  // Reduced motion only: repaint the still frame at the new energy.
  useEffect(() => {
    if (redraw.current) redraw.current();
  }, [thinking, running]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ display: "block", width: size, maxWidth: "100%", height: "auto", aspectRatio: "1 / 1", ...style }}
    />
  );
}
