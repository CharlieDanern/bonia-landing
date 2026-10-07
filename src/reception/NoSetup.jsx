import { useEffect, useRef, useState } from "react";
import { C, F, eyebrow, h2, accent, appear } from "./tokens.js";
import { SECTORS, nb } from "./sectors.js";
import { useReducedMotion } from "./hooks.js";
import Orb from "./Orb.jsx";

/* § 01 · Không cần số mới (handoff v5 "02 Không cần lắp đặt").
 *
 * Left card: the usual way (six heavy steps), each struck through in turn.
 * Right card: "Với Bonia", a phone in three steps (keep your number and turn
 * call forwarding on → our team fills in your details → the first call),
 * beside four key points that light up one by one. The phone shows the
 * selected sector's business (sectors.js).
 *
 * One counter `n` drives it all, as in the prototype's s01Vals(): it starts
 * once when 30% of the section is in view, ticks every 230 ms from 0 to 40
 * and then holds. Before that the section shows the prototype's "pre" state
 * (rows unstruck, key points lit, the first call on the phone). Reduced
 * motion, or no IntersectionObserver, shows the end state.
 *
 * One addition to the prototype: on screens too short for 30% of this tall
 * section to fit (phones held sideways), the prototype never starts; here it
 * starts once the section fills 80% of the screen instead. Wherever 30% fits,
 * the start is the prototype's. */

const TICK_MS = 230;
const LAST = 40;
const FINAL = 99;
const START_SHARE = 0.3;
const FILL_SHARE = 0.8;
const THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);
// Counter marks from s01Vals(): the right card lights up at REVEAL, forwarding
// switches on at FORWARD, the phone moves to step 2 at STEP2 and to the first
// call at CALL.
const REVEAL = 13;
const FORWARD = 18;
const STEP2 = 24;
const CALL = 34;

const HEAVY = [
  ["Ký hợp đồng thuê số hotline với nhà mạng", "Hợp đồng"],
  ["Đăng ký brandname SMS, chờ duyệt", "Giấy phép"],
  ["Mua thiết bị, thêm điện thoại, trả phí bảo trì", "Chi phí"],
  ["Mỗi máy chỉ nghe được một cuộc gọi một lúc", "Giới hạn"],
  ["Cài phần mềm tổng đài, đào tạo nhân viên dùng", "Đào tạo"],
  ["Vẫn làm tay, vẫn cần người ngồi trực máy", "Nhân lực"],
];

const KEEPS = [
  ["1 App duy nhất", "Không cần setup cầu kỳ"],
  ["Giữ nguyên số đang dùng", "Không cần đăng ký số mới"],
  ["Nhiều cuộc gọi cùng lúc", "trên cùng một số điện thoại"],
  ["Trả theo tháng", "hủy bất cứ lúc nào"],
];

const SETUP = ["Bảng giá & ưu đãi", "Lịch & chỗ trống", "Câu trả lời mẫu"];

const REVEAL_SHADOW = "0 18px 40px -24px rgba(123,74,45,.45)";
const PHONE_SHADOW = "0 24px 48px -28px rgba(31,27,22,.6)";
const CARD_PAD = "clamp(18px,2.6vw,30px)";

// Everything the markup needs at counter n (port of the prototype's s01Vals).
// `pre` is the state before the sequence starts: n reads as 99, but nothing
// is struck and the left card keeps full opacity.
function stage(n, pre) {
  const right = n >= REVEAL;
  const struck = (i) => !pre && n >= 7 + i;
  return {
    right,
    leftDim: right && !pre,
    phase: n < STEP2 ? 1 : n < CALL ? 2 : 3,
    forward: n >= FORWARD,
    rows: HEAVY.map(([label, tag], i) => ({ label, tag, shown: pre || n >= 1 + i, struck: struck(i) })),
    setup: SETUP.map((label, i) => ({ label, ok: n >= 26 + i * 3 })),
    keeps: KEEPS.map(([lead, text], i) => ({ lead, text, on: pre || n >= 14 + i * 2 })),
  };
}

// Small shared styles.
const mono = (size, extra) => ({ fontFamily: F.mono, fontSize: size, ...extra });
const caps = (size, spacing, color) => mono(size, { letterSpacing: spacing, textTransform: "uppercase", color });
const dot = (on, ms) => ({
  width: 22,
  height: 22,
  flex: "none",
  borderRadius: 11,
  background: on ? C.clay : C.line,
  color: C.onClay,
  fontSize: 11,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: `background ${ms}ms`,
});
const bare = { listStyle: "none", margin: 0, padding: 0 };
const whiteBox = { background: C.surface, borderRadius: 12 };

function CardHead({ label, labelColor, note }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
      <span style={caps(10.5, "0.2em", labelColor)}>{label}</span>
      <span style={{ fontSize: 12.5, color: C.muted }}>{note}</span>
    </div>
  );
}

// Each step mounts fresh, so it enters with bonia-in.
const screen = (padding, extra) => ({
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  padding,
  display: "flex",
  flexDirection: "column",
  gap: 12,
  ...appear(450),
  ...extra,
});

function Phone({ s, biz }) {
  return (
    <div
      role="img"
      aria-label={`Minh họa trên điện thoại của ${biz.biz}: giữ số đang dùng và bật chuyển cuộc gọi tới Bonia Tiếp tân, bên em cài bảng giá, lịch và câu trả lời mẫu, rồi Bonia nghe cuộc gọi đầu tiên.`}
      style={{
        width: 204,
        height: 416,
        flex: "none",
        borderRadius: 36,
        background: C.bezel,
        padding: 8,
        boxShadow: PHONE_SHADOW,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 30,
          background: C.ground,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          color: C.ink,
        }}
      >
        <div
          style={mono(10.5, {
            height: 34,
            flex: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 18px",
          })}
        >
          <span>9:00</span>
          <span style={{ width: 64, height: 18, borderRadius: 9, background: C.bezel }} />
          <span>●●●</span>
        </div>
        <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
          {s.phase === 1 && (
            <div key="p1" style={screen("14px 12px 18px")}>
              <span style={caps(9, "0.16em", C.muted)}>Bước 1 · Giữ số đang dùng</span>
              <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em" }}>Cài đặt cuộc gọi</span>
              <div style={{ ...whiteBox, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 12.5, fontWeight: 500 }}>{biz.biz}</span>
                <span style={mono(12, { color: C.ink3 })}>{nb(biz.bizPhone)}</span>
              </div>
              <div style={{ ...whiteBox, display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 12, lineHeight: 1.35 }}>Chuyển cuộc gọi khi máy bận hoặc không nghe</span>
                  {/* The forwarding switch: grey, then on (clay) at FORWARD. */}
                  <span
                    style={{
                      width: 40,
                      height: 24,
                      flex: "none",
                      borderRadius: 12,
                      background: s.forward ? C.clay : C.clayDisabled2,
                      position: "relative",
                      transition: "background .3s",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 2,
                        left: 2,
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        background: C.surface,
                        transform: s.forward ? "translateX(16px)" : "translateX(0)",
                        transition: "transform .3s",
                        boxShadow: "0 1px 2px rgba(0,0,0,.2)",
                      }}
                    />
                  </span>
                </div>
                {s.forward && (
                  <div
                    style={{
                      padding: "9px 12px",
                      borderTop: `1px solid ${C.line3}`,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      fontSize: 11.5,
                      ...appear(350),
                    }}
                  >
                    <span style={{ color: C.ink3 }}>Chuyển tới</span>
                    <span style={{ fontWeight: 500, color: C.clay }}>Bonia Tiếp tân</span>
                  </div>
                )}
              </div>
              <span style={{ fontSize: 11, lineHeight: 1.4, color: C.muted }}>
                Khách vẫn gọi số quen. Không cài thêm gì cho khách.
              </span>
            </div>
          )}

          {s.phase === 2 && (
            <div key="p2" style={screen("14px 14px 18px")}>
              <span style={caps(9, "0.16em", C.muted)}>Bước 2 · Cài thông tin</span>
              <span style={{ fontFamily: F.serif, fontSize: 21, lineHeight: 1.15 }}>Bên em cài cùng anh/chị</span>
              <div style={{ display: "flex", flexDirection: "column", borderTop: `1px solid ${C.line2}` }}>
                {s.setup.map((r) => (
                  <div
                    key={r.label}
                    style={{
                      minHeight: 46,
                      borderBottom: `1px solid ${C.line2}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{r.label}</span>
                    <span style={dot(r.ok, 300)}>{r.ok ? "✓" : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {s.phase === 3 && (
            <div key="p3" style={screen("20px 14px", { alignItems: "center", gap: 6, textAlign: "center" })}>
              <span style={caps(9.5, "0.18em", C.clay)}>Cuộc gọi đầu tiên</span>
              <span style={mono(16)}>{nb(biz.firstCaller)}</span>
              <Orb size={130} running thinking={false} />
              <span style={{ fontFamily: F.serif, fontSize: 19 }}>Bonia đang nghe máy</span>
              <span style={{ fontSize: 11.5, color: C.ink3 }}>“{biz.greet}”</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NoSetup({ sector }) {
  const biz = SECTORS[sector] || SECTORS["phong-kham"];
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const noIO = typeof window === "undefined" || typeof window.IntersectionObserver === "undefined";
  // null until the sequence starts (the prototype's `pre`), then 0 … LAST.
  const [count, setCount] = useState(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (reduce || noIO || !el || started.current) return undefined;
    let timer = 0;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        if (!e.isIntersecting) return;
        const viewH = e.rootBounds ? e.rootBounds.height : window.innerHeight;
        const need = Math.min(START_SHARE * e.boundingClientRect.height, FILL_SHARE * viewH);
        if (e.intersectionRect.height < need - 1) return;
        io.disconnect();
        started.current = true;
        let k = 0;
        setCount(0);
        timer = window.setInterval(() => {
          k += 1;
          setCount(k);
          if (k >= LAST) {
            window.clearInterval(timer);
            timer = 0;
          }
        }, TICK_MS);
      },
      { threshold: THRESHOLDS }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      // Stopped mid-way (unmount, or reduced motion switched on): go to the end.
      if (timer) {
        window.clearInterval(timer);
        setCount(LAST);
      }
    };
  }, [reduce, noIO]);

  const final = reduce || noIO;
  const pre = !final && count === null;
  const s = stage(final || pre ? FINAL : count, pre);

  return (
    <section
      ref={ref}
      data-screen-label="02 Không cần lắp đặt"
      aria-labelledby="khong-can-so-moi"
      style={{
        background: C.surface,
        borderTop: `1px solid ${C.line}`,
        borderBottom: `1px solid ${C.line}`,
        padding: "clamp(56px,8vw,104px) clamp(16px,5vw,72px)",
      }}
    >
      <div
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(28px,4vw,48px)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 820 }}>
          <p style={eyebrow()}>§ 01 · KHÔNG CẦN SỐ MỚI</p>
          <h2
            id="khong-can-so-moi"
            style={h2({ fontSize: "clamp(30px,4.6vw,56px)", lineHeight: 1.06, letterSpacing: "-0.03em" })}
          >
            Giữ nguyên số Hotline đang dùng,
            <br />
            mà vẫn xử lý{"\u00A0"}<span style={{ ...accent, fontWeight: 400 }}>nhiều cuộc gọi cùng lúc.</span>
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "clamp(15.5px,1.4vw,17.5px)",
              lineHeight: 1.6,
              color: C.ink2,
              maxWidth: "40em",
              textWrap: "pretty",
            }}
          >
            Một số hotline, nhiều cuộc gọi cùng lúc mà không cần đầu tư tổng đài mới
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,500px),1fr))",
            gap: "clamp(16px,2.4vw,28px)",
            alignItems: "stretch",
          }}
        >
          {/* The usual way */}
          <div
            style={{
              minWidth: 0,
              background: C.ground,
              border: `1px dashed ${C.line}`,
              borderRadius: 20,
              padding: CARD_PAD,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              opacity: s.leftDim ? 0.62 : 1,
              transition: "opacity .6s",
            }}
          >
            <CardHead label="Cách thường làm" labelColor={C.muted} note="tổng đài, hotline, phần mềm gọi điện" />
            {/* Every row keeps its place from the start and only fades in
                when its turn comes (founder 2026-09-29). The prototype adds
                rows as they appear, so the card collapsed when the sequence
                began and regrew over ~1.4 s, pushing the page below by up to
                ~410 px on phones while the visitor was reading. The final
                layout is the prototype's. */}
            <ul style={{ ...bare, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              {s.rows.map(
                (r) => (
                  <li
                    key={r.tag}
                    aria-hidden={r.shown ? undefined : true}
                    style={{
                      ...(r.shown ? appear(400) : { visibility: "hidden" }),
                      padding: "12px 0",
                      borderBottom: `1px solid ${C.line2}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        minWidth: 0,
                        fontSize: "clamp(15px,1.5vw,17px)",
                        lineHeight: 1.45,
                        color: r.struck ? C.muted : C.ink,
                        transition: "color .4s",
                      }}
                    >
                      <span
                        style={{
                          display: "inline",
                          backgroundImage: `linear-gradient(${C.clay},${C.clay})`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "0 55%",
                          backgroundSize: `${r.struck ? "100%" : "0%"} 1.5px`,
                          WebkitBoxDecorationBreak: "clone",
                          boxDecorationBreak: "clone",
                          transition: "background-size .45s ease",
                        }}
                      >
                        {r.label}
                      </span>
                    </span>
                    <span
                      style={{
                        ...caps(9.5, "0.14em", C.muted),
                        flex: "none",
                        border: `1px solid ${C.line}`,
                        background: C.surface,
                        padding: "3px 7px",
                        borderRadius: 4,
                      }}
                    >
                      {r.tag}
                    </span>
                  </li>
                )
              )}
            </ul>
            <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 18, color: C.ink3 }}>
              Nhiều bên, nhiều bước, nhiều tuần chờ.
            </div>
          </div>

          {/* With Bonia */}
          <div
            style={{
              minWidth: 0,
              background: C.surface,
              border: `1.5px solid ${s.right ? C.clay : C.line}`,
              borderRadius: 20,
              padding: CARD_PAD,
              display: "flex",
              flexDirection: "column",
              gap: 20,
              boxShadow: s.right ? REVEAL_SHADOW : "none",
              transition: "border-color .6s, box-shadow .6s",
            }}
          >
            <CardHead label="Với Bonia" labelColor={C.clay} note="trên số điện thoại đang dùng" />
            <div
              style={{
                flex: 1,
                display: "flex",
                flexWrap: "wrap",
                gap: "clamp(18px,2.6vw,28px)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Phone s={s} biz={biz} />
              <ul
                style={{
                  ...bare,
                  flex: 1,
                  minWidth: 220,
                  maxWidth: 300,
                  display: "flex",
                  flexDirection: "column",
                  borderTop: `1px solid ${C.line3}`,
                }}
              >
                {s.keeps.map((k) => (
                  <li
                    key={k.lead}
                    style={{
                      padding: "14px 0",
                      borderBottom: `1px solid ${C.line3}`,
                      display: "grid",
                      gridTemplateColumns: "22px minmax(0,1fr)",
                      gap: 12,
                      alignItems: "start",
                    }}
                  >
                    <span aria-hidden="true" style={{ ...dot(k.on, 400), marginTop: 3 }}>
                      ✓
                    </span>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        opacity: k.on ? 1 : 0.35,
                        transition: "opacity .5s",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: F.serif,
                          fontSize: "clamp(15px,4.6vw,19.5px)",
                          lineHeight: 1.25,
                          letterSpacing: "-0.01em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {k.lead}
                      </span>
                      <span style={{ fontSize: 14, lineHeight: 1.45, color: C.ink3 }}>{k.text}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
