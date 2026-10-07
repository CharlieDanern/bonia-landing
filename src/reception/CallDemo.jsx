import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CallPlayer, { PlayGlyph, TOOL_DUR, fmt } from "./CallPlayer.jsx";
import { CALLS } from "./calls.js";
import { C, F, gradText, inkGrad, clayGrad } from "./tokens.js";
import { SECTORS } from "./sectors.js";
import { usePageWidth, useReducedMotion } from "./hooks.js";

/* § 00 · Nghe thử (#nghe), the section right under the hero (handoff v5
 * update, 2026-09-30): one tile per sector (three since 2026-10-01); clicking one selects
 * its sector, opens the player (CallPlayer.jsx) and plays that call from 0 s.
 *
 * Tiles are styled after the bonia.vn/business credit cards: a warm metal
 * surface that darkens left to right BY POSITION (so the row stays in order
 * when ?nganh= moves a sector first), a fine brushed texture, a slow sheen,
 * and a waveform that fills with clay as the call plays. The load-time
 * sector's call comes first, then the rest in CALLS order, fixed for the
 * visit; the current sector's tile (and the playing one) has a clay ring.
 * Layout follows the page width: all tiles across from 760 px (three calls since
 * 2026-10-01, about the 4-across tile width), below that one row that scrolls sideways with snap. The
 * player takes the picked tile's lighter tone; two columns from 880 px.
 *
 * Timeline: while a call runs, a 100 ms tick moves `t` from the recording's
 * currentTime, or from a wall clock when the recording is missing or blocked
 * (the player then says "Chưa có ghi âm · đang mô phỏng"). The tick exists
 * only while a call is running. Everything on screen is derived from `t`. */

const FRESH = 3; // s the result card stays highlighted as "Vừa gửi"
const TICK_MS = 100;
const WAIT_MS = 3000; // how long to wait for a recording to start before simulating
const INIT = { active: -1, t: 0, running: false, err: {}, settled: false };

// Tile surfaces by position, light to dark; `soft`/`edge` tint the player.
const SHADES = [
  { surf: "linear-gradient(138deg,#FEFDFA 0%,#EFEBE3 48%,#FAF8F3 76%,#E6E1D7 100%)", soft: "#FCFBF8", edge: "#E8E2D6" },
  { surf: "linear-gradient(138deg,#F8F5EF 0%,#E4DFD5 48%,#F2EEE7 76%,#D9D3C8 100%)", soft: "#FAF8F4", edge: "#E2DCD1" },
  { surf: "linear-gradient(138deg,#F1EEE8 0%,#D9D4CB 48%,#EAE6DF 76%,#CBC5BA 100%)", soft: "#F7F5F1", edge: "#DCD7CE" },
  { surf: "linear-gradient(138deg,#E9E5DE 0%,#CDC6BA 48%,#E0DAD0 76%,#BDB5A8 100%)", soft: "#F4F2EE", edge: "#D6D0C5" },
];

// Each call's 36-bar waveform: the prototype's seeded bars (Park–Miller),
// taller in the middle; decorative, the same on every visit.
const WAVES = [0, 1, 2, 3].map((k) => {
  let a = 9301 + k * 49297;
  return Array.from({ length: 36 }, (_, j) => {
    a = (a * 16807) % 2147483647;
    const env = 0.45 + 0.55 * Math.sin((Math.PI * (j + 0.5)) / 36);
    return Math.round(4 + (a / 2147483647) * 16 * env);
  });
});

const TILE_SHADOW = "0 24px 42px -26px rgba(52,38,20,0.42),inset 0 0 0 0.5px rgba(255,255,255,0.4)";
const TILE_RING = "0 0 0 1.5px #7B4A2D,0 24px 42px -24px rgba(52,38,20,0.5)";

// Hover lifts a tile (inline styles can't do :hover); a ringed tile keeps its
// ring while hovered.
const CSS = `
.rcd-tile:hover{transform:translateY(-3px)!important}
.rcd-tile:not([data-ring]):hover{box-shadow:0 28px 44px -24px rgba(52,38,20,0.55),inset 0 0 0 0.5px rgba(255,255,255,0.4)!important}
`;

const eyebrow00 = {
  fontFamily: F.mono,
  fontSize: 11,
  letterSpacing: "0.26em",
  textTransform: "uppercase",
  color: C.dashed,
};

function Tile({ call, index, shade, active, selected, playing, done, scrollRow, onClick, buttonRef }) {
  const ring = selected || active;
  return (
    <button
      type="button"
      ref={buttonRef}
      className="rcd-tile"
      data-ring={ring || undefined}
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${playing ? "Tạm dừng" : "Nghe"}: ${call.title}`}
      style={{
        flex: scrollRow ? "0 0 82%" : "1 1 auto",
        scrollSnapAlign: "start",
        minWidth: 0,
        minHeight: 172,
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        margin: 0,
        background: shade.surf,
        border: "none",
        borderRadius: 18,
        padding: "16px 18px 14px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 14,
        textAlign: "left",
        color: "#231F1A",
        boxShadow: ring ? TILE_RING : TILE_SHADOW,
        transform: active ? "translateY(-3px)" : "none",
        transition: "box-shadow .35s ease, transform .35s ease",
      }}
    >
      {/* brushed texture + slow sheen */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "repeating-linear-gradient(114deg,rgba(35,31,26,0.035) 0 1px,transparent 1px 5px)",
          pointerEvents: "none",
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "-60%",
          background: "linear-gradient(105deg,transparent 42%,rgba(255,255,255,0.55) 50%,transparent 58%)",
          animation: "bnSheen 8s ease-in-out infinite",
          animationDelay: `${-index * 2.1}s`,
          pointerEvents: "none",
        }}
      />
      <span
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <span style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
          <span
            style={{
              fontFamily: F.serif,
              fontWeight: 400,
              fontSize: 27,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              textWrap: "balance",
            }}
          >
            {SECTORS[call.sector].label}
          </span>
          <span style={{ fontSize: 14, lineHeight: 1.4, color: C.ink3, textWrap: "pretty" }}>{call.title}</span>
        </span>
        <span
          style={{
            width: 44,
            height: 44,
            flex: "none",
            borderRadius: 22,
            background: active ? C.clay : "rgba(255,255,255,0.78)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.18),inset 0 0 0 0.5px rgba(255,255,255,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background .25s",
          }}
        >
          <PlayGlyph playing={playing} color={active ? C.onClay : C.clay} />
        </span>
      </span>
      <span style={{ position: "relative", display: "flex", flexDirection: "column", gap: 10 }}>
        <span aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: 2, height: 22 }}>
          {WAVES[index].map((h, j) => (
            <span
              key={j}
              style={{
                flex: 1,
                height: h,
                borderRadius: 1,
                background: active && j / WAVES[index].length <= done ? C.clay : "rgba(35,31,26,0.28)",
              }}
            />
          ))}
        </span>
        <span
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            fontFamily: F.mono,
            fontSize: 11,
            letterSpacing: "0.06em",
            color: "#5E5448",
          }}
        >
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {call.biz}
          </span>
          <span>{fmt(call.end)}</span>
        </span>
      </span>
    </button>
  );
}

export default function CallDemo({ sector, initSector, onSector }) {
  const reduce = useReducedMotion();
  const w = usePageWidth();
  const [s, setS] = useState(INIT);
  // Latest state, readable synchronously from the tick and audio callbacks.
  const sRef = useRef(INIT);
  const update = useCallback((patch) => {
    sRef.current = { ...sRef.current, ...patch };
    setS(sRef.current);
  }, []);

  // Playback engine. mode: "wait" (recording loading, clock held at 0),
  // "audio" (t follows audio.currentTime) or "sim" (t follows the wall clock).
  // `token` changes on every start/close, so late audio callbacks from an
  // earlier call are ignored. `missing` holds calls whose file failed to load,
  // so replaying them goes straight to the simulation. `iv` is the tick.
  const eng = useRef({
    token: 0,
    mode: "sim",
    t0: 0,
    waitSince: 0,
    audio: null,
    audioFor: -1,
    settle: 0,
    missing: {},
    iv: 0,
  }).current;
  const demoRef = useRef(null);
  const tileRefs = useRef([]);
  const tileRefSetters = useRef(CALLS.map((_, i) => (el) => (tileRefs.current[i] = el))).current;

  // The load-time sector's call first, the others in CALLS order.
  const order = useMemo(() => {
    const first = CALLS.findIndex((c) => c.sector === initSector);
    const all = CALLS.map((_, i) => i);
    return first < 0 ? all : [first, ...all.filter((i) => i !== first)];
  }, [initSector]);

  // One interval per running call: started on play/resume, cleared on pause,
  // end, close and unmount. It calls the latest `tick` through a ref.
  const tickRef = useRef(null);
  const stopTimer = () => {
    clearInterval(eng.iv);
    eng.iv = 0;
  };
  const startTimer = () => {
    stopTimer();
    eng.iv = setInterval(() => tickRef.current(), TICK_MS);
  };

  // Recording missing, blocked or broken: simulate from the current second.
  // A file that failed to load is not tried again; a blocked play() or a slow
  // start (`persist` false) is retried on the next click.
  const fail = (i, persist = true) => {
    if (persist) eng.missing[i] = true;
    if (eng.mode === "sim") return;
    const st = sRef.current;
    eng.mode = "sim";
    eng.t0 = performance.now() - st.t * 1000;
    if (eng.audio) eng.audio.pause();
    update({ err: { ...st.err, [i]: true } });
  };

  const ensureAudio = () => {
    if (eng.audio) return eng.audio;
    if (typeof Audio === "undefined") return null;
    const a = new Audio();
    a.preload = "auto";
    a.addEventListener("error", () => {
      const st = sRef.current;
      if (st.active >= 0 && st.active === eng.audioFor) fail(st.active);
    });
    eng.audio = a;
    return a;
  };

  const startAudio = (i) => {
    const a = ensureAudio();
    if (!a) {
      fail(i);
      return;
    }
    const tok = eng.token;
    eng.mode = "wait";
    eng.waitSince = performance.now();
    eng.audioFor = i;
    a.src = CALLS[i].src;
    let p;
    try {
      p = a.play();
    } catch (e) {
      fail(i);
      return;
    }
    if (!p || !p.then) {
      eng.mode = "audio";
      return;
    }
    p.then(
      () => {
        if (tok !== eng.token) return;
        if (eng.mode !== "wait") {
          a.pause(); // gave up waiting and went to simulation meanwhile
          return;
        }
        eng.mode = "audio";
        if (!sRef.current.running) a.pause(); // paused while it was loading
      },
      (e) => {
        if (tok !== eng.token) return;
        if (e && e.name === "AbortError") return; // our own pause() or a new load
        fail(i, !(e && e.name === "NotAllowedError"));
      },
    );
  };

  const finish = () => {
    const st = sRef.current;
    const c = CALLS[st.active];
    const tok = eng.token;
    stopTimer();
    update({ t: c.end, running: false });
    // The timeline stops at `end`; keep the "Vừa gửi" highlight to 3 s anyway.
    const left = c.result.at + FRESH - c.end;
    clearTimeout(eng.settle);
    if (left > 0) {
      eng.settle = setTimeout(() => {
        if (tok === eng.token) update({ settled: true });
      }, left * 1000);
    }
  };

  const tick = () => {
    const st = sRef.current;
    if (!st.running || st.active < 0) {
      stopTimer();
      return;
    }
    const c = CALLS[st.active];
    const now = performance.now();
    if (eng.mode === "wait") {
      if (now - eng.waitSince > WAIT_MS) fail(st.active, false);
      return;
    }
    let t;
    let fin;
    if (eng.mode === "audio" && eng.audio) {
      t = Math.min(eng.audio.currentTime, c.end);
      fin = eng.audio.ended;
      eng.t0 = now - t * 1000;
    } else {
      t = (now - eng.t0) / 1000;
      fin = t >= c.end;
    }
    if (fin) finish();
    else update({ t });
  };
  tickRef.current = tick;

  const run = (i) => {
    eng.token += 1;
    clearTimeout(eng.settle);
    if (eng.audio) eng.audio.pause();
    eng.mode = "sim";
    eng.t0 = performance.now();
    const missing = !!eng.missing[i];
    update({ active: i, t: 0, running: true, settled: false, err: { ...sRef.current.err, [i]: missing } });
    startTimer();
    if (!missing) startAudio(i);
  };

  // Bring tiles + player under the sticky nav; if they don't fit, align the
  // tiles under the nav (the prototype's snapToDemo).
  const snapToDemo = () => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const el = demoRef.current;
        if (!el) return;
        const nav = document.querySelector("nav");
        const navH = nav ? nav.getBoundingClientRect().height : 0;
        const r = el.getBoundingClientRect();
        const y0 = window.scrollY;
        const top = y0 + r.top - navH - 12;
        const fits = r.height <= window.innerHeight - navH - 24;
        const y = fits ? Math.min(top, Math.max(y0, y0 + r.bottom - window.innerHeight + 12)) : top;
        if (Math.abs(y - y0) > 4) window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
      }),
    );
  };

  const pause = () => {
    stopTimer();
    if (eng.audio) eng.audio.pause();
    update({ running: false });
  };

  const resume = (i) => {
    eng.t0 = performance.now() - sRef.current.t * 1000;
    update({ running: true });
    startTimer();
    if (eng.mode === "audio" && eng.audio) {
      const tok = eng.token;
      const p = eng.audio.play();
      if (p && p.catch) {
        p.catch((e) => {
          if (tok === eng.token && !(e && e.name === "AbortError")) fail(i, !(e && e.name === "NotAllowedError"));
        });
      }
    } else if (eng.mode === "wait") {
      startAudio(i);
    }
  };

  // A tile or the player's button: pause the running call, resume a paused
  // one, otherwise select the call's sector and start it from 0 s.
  const toggle = (i) => {
    const st = sRef.current;
    const c = CALLS[i];
    if (st.active === i && st.running) return pause();
    if (st.active === i && st.t < c.end) return resume(i);
    if (c.sector !== sector) onSector(c.sector);
    run(i);
    snapToDemo();
  };

  // `refocus`: keyboard users land back on the tile the player belonged to.
  const close = (refocus = true) => {
    const was = sRef.current.active;
    eng.token += 1;
    stopTimer();
    clearTimeout(eng.settle);
    if (eng.audio) eng.audio.pause();
    eng.mode = "sim";
    update({ active: -1, running: false, t: 0 });
    const tile = tileRefs.current[was];
    if (refocus && tile) tile.focus({ preventScroll: true });
  };

  // The sector changed elsewhere (not by this call's tile): close the player.
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const st = sRef.current;
    if (st.active >= 0 && CALLS[st.active].sector !== sector) closeRef.current(false);
  }, [sector]);

  useEffect(
    () => () => {
      clearInterval(eng.iv);
      clearTimeout(eng.settle);
      eng.token += 1;
      if (eng.audio) eng.audio.pause();
    },
    [eng],
  );

  // ---- derived from `t` ----
  const { active, t, running, err, settled } = s;
  const call = active >= 0 ? CALLS[active] : null;
  let status = "";
  let thinking = false;
  let fresh = false;
  if (call) {
    const reached = t >= call.result.at;
    fresh = reached && t - call.result.at < FRESH && !settled;
    const busy = call.events.find((e) => e.tool && t >= e.at && t < e.at + (e.dur ?? TOOL_DUR));
    const lastS = call.events.filter((e) => e.s && e.at <= t).pop();
    if (reached) status = "Đã gửi cho lễ tân";
    else if (busy) {
      status = "Đang " + busy.tool.charAt(0).toLowerCase() + busy.tool.slice(1) + "…";
      thinking = true;
    } else if (lastS && lastS.s === "Khách") status = "Đang nghe…";
    else status = "Đang trả lời…";
    if (!running && t > 0 && t < call.end) status = "Tạm dừng";
  }

  const tiles = w >= 760 ? CALLS.length : 0; // 0: one sideways row
  const done = call ? Math.min(1, t / call.end) : 0;
  const shade = SHADES[Math.max(0, order.indexOf(active))];

  return (
    <section
      id="nghe"
      data-screen-label="01b Nghe thử"
      style={{
        // continues the hero's warm glow
        background: "linear-gradient(180deg,#F6EBDA 0%,#F2EEE6 360px)",
        padding: "clamp(48px,7vw,96px) clamp(16px,4vw,56px) clamp(48px,7vw,96px)",
        scrollMarginTop: "var(--rnav-h, 64px)",
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(28px,4.4vw,56px)",
        }}
      >
        <div
          ref={demoRef}
          style={{ width: "100%", minWidth: 0, display: "flex", flexDirection: "column", gap: 14, scrollMarginTop: 80 }}
        >
          <style>{CSS}</style>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              textAlign: "center",
              marginBottom: "clamp(14px,2.4vw,28px)",
            }}
          >
            <div style={eyebrow00}>§ 00 · Nghe thử</div>
            <h2
              style={{
                margin: 0,
                fontFamily: F.serif,
                fontWeight: 300,
                fontSize: "clamp(28px,4vw,52px)",
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
                textWrap: "balance",
              }}
            >
              <span style={gradText(inkGrad)}>Một lễ tân phục vụ{"\u00a0"}</span>
              <span style={gradText(clayGrad, true)}>đa dạng ngành nghề</span>
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "clamp(15px,1.4vw,17px)",
                lineHeight: 1.55,
                color: C.ink3,
                maxWidth: "34em",
              }}
            >
              Chọn một cuộc gọi để nghe thử cách Bonia trả lời
            </p>
          </div>

          <div
            style={{
              display: tiles ? "grid" : "flex",
              gridTemplateColumns: `repeat(${tiles || 1},minmax(0,1fr))`,
              gap: 12,
              overflowX: tiles ? "visible" : "auto",
              scrollSnapType: "x mandatory",
              paddingBottom: tiles ? 0 : 6,
              minWidth: 0,
            }}
          >
            {order.map((i, p) => (
              <Tile
                key={CALLS[i].sector}
                call={CALLS[i]}
                index={i}
                shade={SHADES[p]}
                active={active === i}
                selected={CALLS[i].sector === sector}
                playing={active === i && running}
                done={active === i ? done : 0}
                scrollRow={!tiles}
                onClick={() => toggle(i)}
                buttonRef={tileRefSetters[i]}
              />
            ))}
          </div>

          <div style={{ fontSize: 12.5, color: C.muted, textAlign: "center", fontStyle: "italic" }}>
            Cuộc gọi thử với Bonia thật, tên cơ sở là hư cấu.
          </div>

          {call && (
            <CallPlayer
              call={call}
              index={active}
              t={t}
              running={running}
              wide={w >= 880}
              status={status}
              thinking={thinking}
              fresh={fresh}
              simulating={!!err[active]}
              reduce={reduce}
              soft={shade.soft}
              edge={shade.edge}
              onToggle={() => toggle(active)}
              onClose={() => close()}
            />
          )}
        </div>
      </div>
    </section>
  );
}
