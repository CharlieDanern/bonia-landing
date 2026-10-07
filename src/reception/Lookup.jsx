import { useEffect, useRef, useState } from "react";
import { C, F, eyebrow, h2, accent, appear } from "./tokens.js";
import { usePageWidth, useReducedMotion } from "./hooks.js";
import { HOTEL as d, STEPS, T, sourcesOf } from "./lookup-data.js";
import Orb from "./Orb.jsx";

/* § 02 · Dễ cài, dễ sửa (#cai-dat), handoff v6: the receptionist app's
 * first-run lookup, played as a 19-second demo in a settings window. Four
 * step cards above the window; clicking one jumps the demo to that step, and
 * "↻ Xem lại từ đầu" replays it.
 *
 *   0–4.2 s   01 the offer: name and area type in, "Có, tìm giúp tôi" presses
 *   4.2–9 s   02 the wait: orb, a clock, the sources ticking CHỜ → ĐÃ ĐỌC
 *   9–14 s    03 the fields Bonia filled in, one every 0.45 s, in the app's
 *                FieldRow styles (found: dashed; sources disagree or not
 *                found: red dashed, tiles to pick)
 *   14 s +    04 the rest confirmed, one value edited inline, saved, and what
 *                Bonia will say on the next call
 *
 * The sample is one fictional hotel on every sector: the app's lookup reads
 * places to stay only (lookup-data.js).
 *
 * Visitors can pick a tile and press "Đúng hết". Two additions to the
 * prototype, whose clock runs on regardless: once a visitor has touched a
 * field, the demo stops just before step 04 so they can finish (the bar's
 * "Lưu" then plays it); and when Bonia's line appears below the fields, the
 * window scrolls down to it.
 *
 * It starts once 35% of the section is in view (or, on screens too short for
 * that, once it fills 80% of the screen, as in NoSetup.jsx). Reduced motion,
 * or no IntersectionObserver, shows the end state, and a step card shows
 * that step's finished state. */

const TICK_MS = 100;
const START_SHARE = 0.35;
const FILL_SHARE = 0.8;
const THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);
const ROW_AT = (i) => T.review + 0.3 + i * 0.45; // when field row i shows
const SAVED_AT = T.edit + 1.8; // "✓ Đã lưu"
const SAY_AT = T.edit + 2.2; // Bonia's line for the next call

// Colours from the app's FieldRow.
const GREEN = "#4A6B3A";
const GREEN_BG = "#EEF0E6";
const FOUND = "#C9BCA5";
const EDIT_BG = "#FBF5EC";

const col = (gap, extra) => ({ display: "flex", flexDirection: "column", gap, ...extra });
const caps = (fontSize, letterSpacing, color) => ({ fontFamily: F.mono, fontSize, letterSpacing, color });
const field = { height: 44, borderRadius: 10, padding: "0 12px", fontSize: 14.5, display: "flex", alignItems: "center", color: C.ink, background: C.surface };

// The first `t0 → t1` share of a string, as it types in.
const typed = (str, t, t0, t1) =>
  str.slice(0, Math.max(0, Math.min(str.length, Math.round(((t - t0) / (t1 - t0)) * str.length))));

const clock = (t) => {
  const s = Math.max(0, Math.floor((t - T.search) * 16)); // a 1–2 minute search, sped up
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// Everything the window shows at second t (the prototype's lkVals).
function stage(t, ok, pick) {
  const edit = t >= T.edit;
  const [ei, ev] = d.edit;
  const rows = d.rows.map(([l, v, src, opts, fill], i) => {
    const picked = pick[i] || (edit && opts ? opts[0][0] : undefined);
    const editing = edit && i === ei;
    const choosing = !!opts && !picked;
    const done = !!picked || !!ok[i] || edit;
    return {
      l,
      fill: !!fill && !picked,
      choosing,
      opts: opts || [],
      v: editing ? (t < T.edit + 0.4 ? v : typed(ev, t, T.edit + 0.4, T.edit + 1.6)) : picked || v,
      note: editing
        ? t < SAVED_AT
          ? "✎ Đang sửa…"
          : "✓ Đã lưu"
        : picked
        ? "✓ Bạn đã chọn"
        : choosing
        ? fill
          ? "Bonia không tìm thấy, bạn chọn giúp"
          : "Các nguồn ghi khác nhau, bạn chọn giúp"
        : ok[i]
        ? "✓ Đã xem lại"
        : `Bonia tìm thấy trên ${src}`,
      noteColor: editing ? C.clay : done ? GREEN : choosing ? C.danger : C.muted,
      border: `1px ${done ? "solid" : "dashed"} ${editing ? C.clay : done ? C.line3 : choosing ? C.danger : FOUND}`,
      bg: editing ? EDIT_BG : choosing ? C.warm2 : C.surface,
      shown: t >= ROW_AT(i),
    };
  });
  const allIn = t >= ROW_AT(d.rows.length - 1);
  const pending = edit ? 0 : d.rows.filter((r, i) => !(pick[i] || (!r[3] && ok[i]))).length;
  const green = allIn && !pending && (!edit || t >= SAVED_AT);
  return {
    step: t < T.search ? 0 : t < T.review ? 1 : edit ? 3 : 2,
    rows,
    allIn,
    pending,
    bar: edit
      ? t < SAVED_AT
        ? "Đang lưu thay đổi…"
        : "✓ Đã lưu · Bonia cập nhật ngay lập tức"
      : !allIn
      ? "Bonia đang điền…"
      : pending
      ? `Còn ${pending} mục cần xem lại`
      : "✓ Đã xem lại hết · Bonia sẵn sàng nghe máy",
    barBg: green ? GREEN_BG : EDIT_BG,
    barColor: green ? GREEN : C.clay,
    say: t >= SAY_AT,
  };
}

function StepCards({ step, cols, onGo }) {
  return (
    <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: cols, gap: 8, minWidth: 0 }}>
      {STEPS.map(([n, title, desc, at], i) => {
        const on = i === step;
        return (
          <li key={n} style={{ minWidth: 0, display: "flex" }}>
            <button
              type="button"
              onClick={() => onGo(i, at)}
              aria-current={on ? "step" : undefined}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                alignItems: "flex-start",
                textAlign: "left",
                padding: "14px 16px",
                borderRadius: 14,
                minWidth: 0,
                border: `1px solid ${on ? C.clay : C.line2}`,
                background: on ? C.surface : C.warm,
                cursor: "pointer",
                transition: "background .3s, border-color .3s",
              }}
            >
              <span style={{ fontFamily: F.mono, fontSize: 12, color: C.clay }}>{n}</span>
              <span style={col(3, { minWidth: 0 })}>
                <span style={{ fontSize: 16, fontWeight: on ? 600 : 500, color: C.ink }}>{title}</span>
                <span style={{ fontSize: 13.5, lineHeight: 1.5, color: C.ink3 }}>{desc}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

const caret = (on) => ({ width: 1.5, height: 18, background: C.clay, marginLeft: 1, opacity: on ? 1 : 0 });

// 01: the first-run card, filling itself in.
function Offer({ t }) {
  const nameOn = t < 1.95;
  const areaOn = t >= 1.95 && t < 3.2;
  const pressed = t >= 3.4;
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(18px,3vw,36px)", background: C.ground }}>
      <div style={col(14, { width: "100%", maxWidth: 420, padding: "clamp(18px,2.4vw,28px)", background: C.surface, border: `1px solid ${C.line}`, borderRadius: 20 })}>
        <span style={caps(10.5, "0.18em", C.clay)}>CÀI ĐẶT LẦN ĐẦU</span>
        <span style={{ fontFamily: F.serif, fontSize: "clamp(21px,2.2vw,25px)", lineHeight: 1.2 }}>
          Để Bonia tự tìm thông tin {d.noun} của bạn trên mạng?
        </span>
        <div style={col(6)}>
          <span style={{ fontSize: 13, color: C.ink3 }}>Tên khách sạn</span>
          <span style={{ ...field, border: `1px solid ${nameOn ? C.clay : C.line}` }}>
            {typed(d.name, t, 0.3, 1.8)}
            <span style={caret(t >= 0.2 && nameOn)} />
          </span>
        </div>
        <div style={col(6)}>
          <span style={{ fontSize: 13, color: C.ink3 }}>Khu vực</span>
          <span style={{ ...field, border: `1px solid ${areaOn ? C.clay : C.line}` }}>
            {typed(d.area, t, 2.0, 3.0)}
            <span style={caret(areaOn)} />
          </span>
        </div>
        <span
          style={{
            height: 46,
            borderRadius: 23,
            background: pressed ? C.clayHover : C.clay,
            color: C.onClay,
            fontSize: 14.5,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: pressed && t < 3.7 ? "scale(0.97)" : "none",
            transition: "transform .15s, background .15s",
          }}
        >
          Có, tìm giúp tôi
        </span>
        <span style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>Thường mất 1–2 phút.</span>
      </div>
    </div>
  );
}

// 02: the wait, reading each source in turn.
const SOURCES = sourcesOf(d);

function Wait({ t }) {
  const sources = SOURCES;
  const per = (T.review - T.search - 0.4) / sources.length;
  return (
    <div
      style={col(12, {
        flex: 1,
        minHeight: 0,
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(18px,3vw,36px)",
        background: C.ground,
        textAlign: "center",
      })}
    >
      <Orb size={130} thinking />
      <span style={{ fontFamily: F.serif, fontSize: "clamp(20px,2.2vw,24px)", lineHeight: 1.25, maxWidth: "22em" }}>
        Bonia đang đọc thông tin của {d.name}…
      </span>
      <span style={{ fontFamily: F.mono, fontSize: 20, color: C.clay }}>{clock(t)}</span>
      <div style={col(0, { width: "100%", maxWidth: 380, borderTop: `1px solid ${C.line2}`, marginTop: 4 })}>
        {sources.map((l, i) => {
          const from = T.search + 0.2 + i * per;
          const done = t >= from + per;
          const reading = t >= from && !done;
          return (
            <div
              key={l}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                minHeight: 38,
                borderBottom: `1px solid ${C.line2}`,
                opacity: done || reading ? 1 : 0.45,
                transition: "opacity .3s",
              }}
            >
              <span style={{ fontSize: 14, color: C.ink }}>{l}</span>
              <span style={{ ...caps(10, "0.12em", done ? GREEN : reading ? C.clay : C.muted), whiteSpace: "nowrap" }}>
                {done ? "✓ ĐÃ ĐỌC" : reading ? "ĐANG ĐỌC…" : "CHỜ"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 03–04: the filled-in fields, as the app's FieldRow draws them.
function Fields({ s, rowCols, onPick, onOkAll, onSave, listRef }) {
  return (
    <>
      <div
        style={{
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "10px 18px",
          background: s.barBg,
          borderBottom: `1px solid ${C.line3}`,
          transition: "background .3s",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: s.barColor }}>{s.bar}</span>
        <button
          type="button"
          onClick={s.pending ? onOkAll : onSave}
          disabled={!s.allIn}
          style={{
            height: 36,
            padding: "0 14px",
            border: 0,
            borderRadius: 18,
            background: C.clay,
            color: C.onClay,
            fontSize: 13,
            fontWeight: 500,
            cursor: s.allIn ? "pointer" : "default",
            whiteSpace: "nowrap",
            opacity: s.allIn ? 1 : 0.4,
          }}
        >
          {s.pending ? "Đúng hết" : "Lưu"}
        </button>
      </div>
      <div ref={listRef} style={col(6, { flex: 1, minHeight: 0, overflow: "auto", padding: "14px 16px 18px", background: C.surface })}>
        <span style={{ ...caps(10, "0.18em", C.muted), padding: "0 2px 4px" }}>BONIA ĐÃ ĐIỀN SẴN</span>
        {s.rows.map((r, i) => (
          <div
            key={r.l}
            style={{
              display: "grid",
              gridTemplateColumns: rowCols,
              gap: "6px 12px",
              alignItems: "center",
              padding: "8px 10px",
              borderRadius: 8,
              border: r.border,
              background: r.bg,
              opacity: r.shown ? 1 : 0,
              transform: r.shown ? "none" : "translateY(6px)",
              transition: "opacity .35s ease, transform .35s ease, border-color .25s, background .25s",
            }}
          >
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: C.ink3, lineHeight: 1.4 }}>{r.l}</span>
              {r.fill && (
                <span
                  style={{
                    ...caps(8.5, "0.12em", C.danger),
                    padding: "2px 5px",
                    borderRadius: 4,
                    background: C.dangerBg,
                    whiteSpace: "nowrap",
                  }}
                >
                  CẦN BẠN ĐIỀN
                </span>
              )}
            </div>
            <div style={col(4, { minWidth: 0 })}>
              {r.choosing ? (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {r.opts.map(([v, src]) => (
                    <button
                      key={v}
                      type="button"
                      className="r-tile"
                      onClick={() => onPick(i, v)}
                      disabled={!r.shown}
                      style={{
                        minHeight: 36,
                        padding: "0 12px",
                        border: `1px solid ${C.line}`,
                        borderRadius: 8,
                        background: C.surface,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span style={{ fontSize: 14, color: C.ink }}>{v}</span>
                      {src && <span style={{ fontSize: 11.5, color: C.muted }}>· {src}</span>}
                    </button>
                  ))}
                </div>
              ) : (
                <span
                  style={{
                    minHeight: 36,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 10px",
                    border: `1px solid ${C.line}`,
                    borderRadius: 8,
                    fontSize: 14,
                    color: C.ink,
                    background: C.surface,
                  }}
                >
                  {r.v}
                </span>
              )}
              <span style={{ fontSize: 11.5, color: r.noteColor }}>{r.note}</span>
            </div>
          </div>
        ))}
        {s.say && (
          <div
            style={col(4, {
              marginTop: 6,
              padding: "12px 14px",
              borderRadius: 10,
              background: "#FAF7F1",
              border: `1px solid ${C.line3}`,
              ...appear(450),
            })}
          >
            <span style={caps(9.5, "0.18em", C.muted)}>CUỘC GỌI KẾ TIẾP, BONIA SẼ NÓI</span>
            <span style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 16, lineHeight: 1.45, color: C.ink }}>
              “{s.sayText}”
            </span>
          </div>
        )}
      </div>
    </>
  );
}

export default function Lookup() {
  const w = usePageWidth();
  const reduce = useReducedMotion();
  const noIO = typeof window === "undefined" || typeof window.IntersectionObserver === "undefined";
  const still = reduce || noIO;

  const ref = useRef(null);
  const listRef = useRef(null);
  const timer = useRef(0);
  const held = useRef(false); // a visitor touched a field: stop before step 04
  const [t, setT] = useState(still ? T.end : 0);
  const [ok, setOk] = useState({});
  const [pick, setPick] = useState({});

  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = 0;
  };

  // Play from second `from`; `keep` keeps the visitor's picks (their "Lưu").
  const run = (from, keep) => {
    stop();
    held.current = false;
    if (!keep) {
      setOk({});
      setPick({});
    }
    const t0 = performance.now();
    setT(from);
    timer.current = window.setInterval(() => {
      let n = Math.min(T.end, from + (performance.now() - t0) / 1000);
      if (held.current && n >= T.edit - 0.05) n = T.edit - 0.05;
      setT(n);
      if (n >= T.end || (held.current && n >= T.edit - 0.05)) stop();
    }, TICK_MS);
  };

  // A step card: play from its start; with no motion, show it finished.
  const go = (i, at) => {
    if (!still) return run(at);
    stop();
    setOk({});
    setPick({});
    setT(i < STEPS.length - 1 ? STEPS[i + 1][3] - 0.05 : T.end);
  };

  const touch = () => {
    held.current = true;
  };

  useEffect(() => {
    const el = ref.current;
    if (still || !el) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        if (!e.isIntersecting) return;
        const viewH = e.rootBounds ? e.rootBounds.height : window.innerHeight;
        const need = Math.min(START_SHARE * e.boundingClientRect.height, FILL_SHARE * viewH);
        if (e.intersectionRect.height < need - 1) return;
        io.disconnect();
        run(0);
      },
      { threshold: THRESHOLDS }
    );
    io.observe(el);
    return () => io.disconnect();
    // run/stop only touch refs and setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still]);

  // Reduced motion switched on mid-way: go to the end.
  useEffect(() => {
    if (still) {
      stop();
      setT(T.end);
    }
  }, [still]);

  useEffect(() => stop, []);

  const s = stage(t, ok, pick);
  s.sayText = d.edit[2];

  // Bonia's line is the point of step 04: bring it into the window.
  useEffect(() => {
    const el = listRef.current;
    if (!s.say || !el || el.scrollHeight <= el.clientHeight) return;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [s.say, reduce]);

  const onPick = (i, v) => {
    touch();
    setPick((p) => ({ ...p, [i]: v }));
  };
  const onOkAll = () => {
    if (!s.allIn) return;
    touch();
    const o = {};
    d.rows.forEach((r, i) => {
      if (!r[3]) o[i] = true;
    });
    setOk(o);
  };
  const onSave = () => {
    if (t >= T.edit) return;
    if (still) {
      setT(T.end);
      return;
    }
    run(T.edit, true);
  };

  const wide = w >= 880;
  const stepCols = wide ? "repeat(4,minmax(0,1fr))" : w >= 560 ? "repeat(2,minmax(0,1fr))" : "minmax(0,1fr)";

  return (
    <section
      ref={ref}
      id="cai-dat"
      data-screen-label="03 Dễ cài đặt"
      aria-labelledby="cai-dat-title"
      style={{ padding: "clamp(56px,8vw,104px) clamp(16px,5vw,72px)", scrollMarginTop: "var(--rnav-h, 64px)" }}
    >
      <div style={col("clamp(24px,3.6vw,40px)", { maxWidth: 1160, margin: "0 auto" })}>
        <div style={col(14, { maxWidth: 780 })}>
          <p style={eyebrow()}>§ 02 · Dễ cài, dễ sửa</p>
          <h2 id="cai-dat-title" style={h2()}>
            Không cần phải biết<span style={accent}>{" "}kỹ thuật &amp; lập trình.</span>
          </h2>
          <p style={{ margin: 0, fontSize: "clamp(15.5px,1.4vw,17.5px)", lineHeight: 1.6, color: C.ink2, textWrap: "pretty" }}>
            Bất kỳ ai trong công ty cũng có thể tùy chỉnh một cách dễ dàng
          </p>
        </div>

        <div style={col("clamp(12px,1.8vw,18px)")}>
          <StepCards step={s.step} cols={stepCols} onGo={go} />

          <div
            role="group"
            aria-label={`Minh họa: Bonia tự tìm và điền sẵn thông tin của ${d.name} vào Cài đặt`}
            style={{
              minWidth: 0,
              height: wide ? 560 : 620,
              background: C.surface,
              border: `1px solid ${C.line}`,
              borderRadius: 20,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 24px 48px -32px rgba(123,74,45,0.45)",
            }}
          >
            <div
              style={{
                height: 48,
                flex: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "0 18px",
                borderBottom: `1px solid ${C.line3}`,
                background: C.warm,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                <img src="/bonia-mark.png" alt="" width="18" height="18" style={{ height: 18, width: "auto", flex: "none" }} />
                <span style={{ ...caps(9.5, "0.22em", C.muted), whiteSpace: "nowrap", flex: "none" }}>TIẾP TÂN</span>
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: C.ink,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {t >= T.review ? d.name : "Bắt đầu"}
                </span>
              </div>
              <button
                type="button"
                className="r-tile"
                onClick={() => go(0, 0)}
                style={{
                  height: 32,
                  padding: "0 12px",
                  border: `1px solid ${C.line}`,
                  borderRadius: 999,
                  background: C.surface,
                  fontSize: 12.5,
                  color: C.ink,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                ↻ Xem lại từ đầu
              </button>
            </div>

            {t < T.search ? (
              <Offer t={t} />
            ) : t < T.review ? (
              <Wait t={t} />
            ) : (
              <Fields
                s={s}
                rowCols={w >= 640 ? "150px minmax(0,1fr)" : "minmax(0,1fr)"}
                onPick={onPick}
                onOkAll={onOkAll}
                onSave={onSave}
                listRef={listRef}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
