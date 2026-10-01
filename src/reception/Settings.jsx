import { useEffect, useRef, useState } from "react";
import { C, F, eyebrow, h2, accent, appear } from "./tokens.js";
import { SECTORS, nb } from "./sectors.js";
import { usePageWidth, useReducedMotion } from "./hooks.js";
import { STEPS, VOICES, TONES, DAYS, CFG, quote, initial } from "./settings-data.js";

/* § 02 · Dễ cài, dễ sửa (#linh-vuc), handoff v5 "03 Dễ cài đặt": a no-code
 * settings showcase. Left: five steps as tabs. Right: a mock settings window
 * for the page's sector (the business of the call-demo tile or ?nganh=) with
 * the step's settings and, pinned to the bottom, what Bonia would say.
 *
 * From 1000 px page width both columns are exactly 640 px tall (the tabs share
 * the height, the window clips); below that they stack at their own height.
 *
 * The tabs advance every 4.2 s until the visitor clicks a tab, a voice or a
 * tone (or puts keyboard focus on one); then they stop for good. Nothing
 * advances under reduced motion. Unlike the prototype, whose timer runs from
 * page load, the timer only runs while the grid is on screen, so a visitor
 * who scrolls down to it starts at step 1. */

const ADVANCE_MS = 4200;
const FIXED_FROM = 1000; // page width for the fixed-height two columns
const FIXED_H = 640;

// ---- small style helpers -------------------------------------------------

const col = (gap, extra) => ({ display: "flex", flexDirection: "column", gap, ...extra });
const caps = (fontSize, letterSpacing, color) => ({
  fontFamily: F.mono,
  fontSize,
  letterSpacing,
  textTransform: "uppercase",
  color,
});
const label = caps(9.5, "0.16em", C.muted);
const rule = `1px solid ${C.line3}`;
const bareButton = { margin: 0, font: "inherit", color: C.ink, cursor: "pointer" };

// A switch shown on; the page only illustrates the setting.
function Toggle() {
  return (
    <span
      role="img"
      aria-label="Đang bật"
      style={{ width: 40, height: 24, flex: "none", borderRadius: 12, background: C.clay, position: "relative" }}
    >
      <span
        style={{ position: "absolute", top: 2, left: 18, width: 20, height: 20, borderRadius: 10, background: C.surface }}
      />
    </span>
  );
}

function ToggleRow({ text, pad }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, ...pad }}>
      <span style={{ fontSize: 13.5 }}>{text}</span>
      <Toggle />
    </div>
  );
}

// ---- the five tabs --------------------------------------------------------

function VoiceTab({ greet, voice, tone, onVoice, onTone }) {
  return (
    <div style={col(12, appear(400))}>
      <span style={label}>Giọng nói</span>
      <div
        role="group"
        aria-label="Giọng nói"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,150px),1fr))", gap: 6 }}
      >
        {VOICES.map(([name, note], i) => {
          const on = i === voice;
          return (
            <button
              key={name}
              type="button"
              aria-pressed={on}
              onClick={() => onVoice(i)}
              style={{
                ...bareButton,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 12,
                border: `1.5px solid ${on ? C.clay : C.line3}`,
                background: on ? C.warm2 : C.surface,
                textAlign: "left",
                minWidth: 0,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 30,
                  height: 30,
                  flex: "none",
                  borderRadius: 15,
                  background: on ? C.clay : C.ground,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: `9px solid ${on ? C.onClay : C.clay}`,
                    borderTop: "5px solid transparent",
                    borderBottom: "5px solid transparent",
                    marginLeft: 3,
                  }}
                />
              </span>
              <span style={col(1, { minWidth: 0 })}>
                <span style={{ fontSize: 13.5, fontWeight: 500 }}>{name}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{note}</span>
              </span>
            </button>
          );
        })}
      </div>
      <span style={label}>Lời chào khi nghe máy</span>
      <div
        style={{
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          background: C.warm,
          padding: "11px 14px",
          fontSize: 15,
          lineHeight: 1.5,
        }}
      >
        {greet}
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: 1.5,
            height: 17,
            background: C.clay,
            marginLeft: 2,
            verticalAlign: -3,
          }}
        />
      </div>
      <span style={label}>Cách nói chuyện</span>
      <div role="group" aria-label="Cách nói chuyện" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {TONES.map((t, i) => {
          const on = i === tone;
          return (
            <button
              key={t}
              type="button"
              aria-pressed={on}
              onClick={() => onTone(i)}
              style={{
                ...bareButton,
                minHeight: 38,
                padding: "0 14px",
                borderRadius: 999,
                border: `1px solid ${on ? C.clay : C.line}`,
                background: on ? C.clay : C.surface,
                color: on ? C.onClay : C.ink,
                fontSize: 13.5,
              }}
            >
              {t}
            </button>
          );
        })}
        <span
          style={{
            minHeight: 38,
            padding: "0 14px",
            borderRadius: 999,
            border: rule,
            fontSize: 13.5,
            color: C.ink3,
            display: "flex",
            alignItems: "center",
          }}
        >
          Xưng em – anh/chị
        </span>
      </div>
    </div>
  );
}

function KnowledgeTab({ c }) {
  return (
    <div style={col(10, appear(400))}>
      <div
        style={{
          border: `1.5px dashed ${C.clayDisabled2}`,
          borderRadius: 12,
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: C.warm2,
        }}
      >
        <span
          style={{
            width: 38,
            height: 38,
            flex: "none",
            borderRadius: 10,
            background: C.priceBg,
            color: C.clay,
            fontFamily: F.mono,
            fontSize: 10,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {c.ext}
        </span>
        <span style={col(2, { flex: 1, minWidth: 0 })}>
          <span
            style={{ fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {c.file}
          </span>
          <span style={{ fontSize: 12.5, color: C.clay }}>✓ {c.fileNote}</span>
        </span>
      </div>
      <span style={{ fontSize: 12, color: C.muted }}>
        Kéo thả bảng giá, danh sách dịch vụ, sản phẩm: file Excel, PDF hay ảnh chụp đều được.
      </span>
      <div style={col(0, { borderTop: rule })}>
        {c.prices.map(([k, v]) => (
          <div
            key={k}
            style={{
              padding: "9px 0",
              borderBottom: rule,
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              fontSize: 14,
            }}
          >
            <span>{k}</span>
            <span style={{ fontFamily: F.mono, fontSize: 13, textAlign: "right" }}>{v}</span>
          </div>
        ))}
      </div>
      {c.promos.map(([k, v]) => (
        <div
          key={k}
          style={{
            border: `1px solid ${C.priceLine}`,
            background: C.highlight,
            borderRadius: 12,
            padding: "10px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={col(1, { minWidth: 0 })}>
            <span style={caps(9.5, "0.14em", C.clay)}>Ưu đãi</span>
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>{k}</span>
            <span style={{ fontSize: 12.5, color: C.ink3 }}>{v}</span>
          </span>
          <Toggle />
        </div>
      ))}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {c.docs.map(([ext, name]) => (
          <span
            key={name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              border: rule,
              borderRadius: 8,
              fontSize: 12.5,
              minWidth: 0,
            }}
          >
            <span style={{ fontFamily: F.mono, fontSize: 9.5, color: C.clay }}>{ext}</span>
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

function CalendarTab({ c }) {
  return (
    <div style={col(10, appear(400))}>
      <span style={{ fontSize: 13, color: C.ink3 }}>{c.calNote}</span>
      <div style={col(0, { borderTop: rule })}>
        {c.cal.map(([name, days, note]) => (
          <div key={name} style={col(6, { padding: "10px 0", borderBottom: rule })}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
              <span style={{ fontSize: 14.5, fontWeight: 500 }}>{name}</span>
              <span style={{ fontFamily: F.mono, fontSize: 11.5, color: C.ink3, textAlign: "right" }}>{note}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 3 }}>
              {days.map((on, j) => (
                <span
                  key={DAYS[j]}
                  style={{
                    height: 22,
                    borderRadius: 5,
                    background: on ? C.clay : C.ground,
                    color: on ? C.onClay : C.muted,
                    fontSize: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {DAYS[j]}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <ToggleRow text="Bonia chỉ giữ chỗ còn trống, chờ lễ tân xác nhận" pad={{ paddingTop: 4 }} />
    </div>
  );
}

function CustomersTab({ c }) {
  return (
    <div style={col(10, appear(400))}>
      <ToggleRow text="Nhận ra khách quen qua số gọi đến" pad={{ paddingBottom: 4 }} />
      <div style={col(0, { borderTop: rule })}>
        {c.cust.map(([name, phone, note]) => (
          <div
            key={name}
            style={{
              padding: "10px 0",
              borderBottom: rule,
              display: "grid",
              gridTemplateColumns: "36px minmax(0,1fr)",
              gap: 10,
              alignItems: "center",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background: C.priceBg,
                color: C.clay,
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {initial(name)}
            </span>
            <span style={col(1, { minWidth: 0 })}>
              <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{name}</span>
                <span style={{ fontFamily: F.mono, fontSize: 11.5, color: C.muted, whiteSpace: "nowrap" }}>
                  {nb(phone)}
                </span>
              </span>
              <span style={{ fontSize: 12.5, lineHeight: 1.4, color: C.ink3 }}>{note}</span>
            </span>
          </div>
        ))}
      </div>
      <span style={{ fontSize: 12, color: C.muted }}>
        Tải danh sách khách từ file, hoặc để Bonia tự ghi sau mỗi cuộc gọi.
      </span>
    </div>
  );
}

function OtherTab({ c }) {
  return (
    <div style={col(10, appear(400))}>
      <div style={col(0, { borderTop: rule })}>
        {c.extra.map(([k, v]) => (
          <div
            key={k}
            style={{
              padding: "10px 0",
              borderBottom: rule,
              display: "grid",
              gridTemplateColumns: "96px minmax(0,1fr)",
              gap: 12,
              fontSize: 14,
              lineHeight: 1.45,
            }}
          >
            <span style={{ color: C.muted }}>{k}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>
      <div
        style={col(3, {
          border: `1px solid ${C.priceLine}`,
          background: C.highlight,
          borderRadius: 12,
          padding: "10px 14px",
        })}
      >
        <span style={caps(9.5, "0.14em", C.clay)}>Việc cần báo ngay · do anh/chị tự đặt</span>
        <span style={{ fontSize: 14, lineHeight: 1.45 }}>{c.urgent}</span>
      </div>
      <div style={col(3, { borderTop: rule, paddingTop: 10 })}>
        <span style={label}>Câu hỏi thường gặp</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{c.faqQ}</span>
        <span style={{ fontSize: 13.5, lineHeight: 1.45, color: C.ink3 }}>{c.faqA}</span>
      </div>
    </div>
  );
}

// ---- the section ------------------------------------------------------------

const tabId = (i) => `cai-dat-tab-${i + 1}`;

export default function Settings({ sector }) {
  const w = usePageWidth();
  const reduce = useReducedMotion();
  const gridRef = useRef(null);
  const tabRefs = useRef([]);
  const [tab, setTab] = useState(0);
  const [voice, setVoice] = useState(0);
  const [tone, setTone] = useState(0);
  const [user, setUser] = useState(false); // the visitor took over: no more auto-advance
  const [inView, setInView] = useState(false);

  // Is any of the grid on screen? Without IntersectionObserver, assume it is.
  useEffect(() => {
    const el = gridRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver((entries) => setInView(entries[entries.length - 1].isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduce || user || !inView) return undefined;
    const id = window.setInterval(() => setTab((t) => (t + 1) % STEPS.length), ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [reduce, user, inView]);

  const pickTab = (i) => {
    setUser(true);
    setTab(i);
  };

  // Arrow keys / Home / End move between the tabs (ARIA tabs pattern).
  const onTabKey = (e) => {
    const from = tabRefs.current.indexOf(e.target);
    if (from < 0) return;
    const n = STEPS.length;
    const to = {
      ArrowDown: (from + 1) % n,
      ArrowRight: (from + 1) % n,
      ArrowUp: (from + n - 1) % n,
      ArrowLeft: (from + n - 1) % n,
      Home: 0,
      End: n - 1,
    }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    pickTab(to);
    tabRefs.current[to].focus();
  };

  const sec = SECTORS[sector];
  const c = CFG[sector];
  const fixed = w >= FIXED_FROM;
  const height = fixed ? FIXED_H : "auto";
  const say = quote(tab, tone, sec.biz, c);

  return (
    <section
      id="linh-vuc"
      data-screen-label="03 Dễ cài đặt"
      aria-labelledby="linh-vuc-title"
      style={{ padding: "clamp(56px,8vw,104px) clamp(16px,5vw,72px)", scrollMarginTop: 64 }}
    >
      <div style={col("clamp(24px,3.6vw,40px)", { maxWidth: 1160, margin: "0 auto" })}>
        <div style={col(14, { maxWidth: 780 })}>
          <p style={eyebrow()}>§ 02 · Dễ cài, dễ sửa</p>
          <h2 id="linh-vuc-title" style={h2()}>
            Không cần phải biết<span style={accent}>{"\u00A0"}kỹ thuật &amp; lập trình.</span>
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "clamp(15.5px,1.4vw,17.5px)",
              lineHeight: 1.6,
              color: C.ink2,
              textWrap: "pretty",
            }}
          >
            Bất kỳ ai trong công ty cũng có thể tùy chỉnh một cách dễ dàng
          </p>
        </div>

        <div
          ref={gridRef}
          onFocus={() => setUser(true)}
          style={{
            display: "grid",
            gridTemplateColumns: fixed ? "minmax(0,1fr) minmax(0,1fr)" : "minmax(0,1fr)",
            gap: "clamp(16px,2.4vw,28px)",
            alignItems: "stretch",
          }}
        >
          <div
            role="tablist"
            aria-label="Các bước cài đặt"
            aria-orientation="vertical"
            onKeyDown={onTabKey}
            style={col(6, {
              height,
              minWidth: 0,
              background: C.warm,
              border: `1px solid ${C.line}`,
              borderRadius: 20,
              padding: 10,
            })}
          >
            {STEPS.map(([title, desc], i) => {
              const on = i === tab;
              return (
                <button
                  key={title}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  id={tabId(i)}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-controls="cai-dat-panel"
                  tabIndex={on ? 0 : -1}
                  onClick={() => pickTab(i)}
                  style={{
                    ...bareButton,
                    flex: fixed ? 1 : "0 0 auto",
                    minHeight: 0,
                    display: "grid",
                    gridTemplateColumns: "40px minmax(0,1fr)",
                    gap: 12,
                    alignItems: "center",
                    textAlign: "left",
                    padding: "12px 16px",
                    borderRadius: 14,
                    border: `1px solid ${on ? C.line : "transparent"}`,
                    background: on ? C.surface : "transparent",
                    transition: "background .25s, border-color .25s",
                  }}
                >
                  <span style={{ fontFamily: F.mono, fontSize: 12, color: C.clay }}>0{i + 1}</span>
                  <span style={col(2, { minWidth: 0 })}>
                    <span style={{ fontSize: 16, fontWeight: on ? 600 : 500 }}>{title}</span>
                    <span style={{ fontSize: 13.5, lineHeight: 1.45, color: C.ink3 }}>{desc}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div
            style={col(0, {
              height,
              minWidth: 0,
              background: C.surface,
              border: `1px solid ${C.line}`,
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 24px 48px -32px rgba(31,27,22,.35)",
            })}
          >
            <div
              style={{
                height: 42,
                flex: "none",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "0 16px",
                background: C.warm,
                borderBottom: rule,
              }}
            >
              <span aria-hidden="true" style={{ display: "flex", gap: 6 }}>
                {[0, 1, 2].map((k) => (
                  <span key={k} style={{ width: 10, height: 10, borderRadius: 5, background: C.line }} />
                ))}
              </span>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontFamily: F.mono,
                  fontSize: 11,
                  color: C.muted,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                bonia.vn · Cài đặt · {sec.biz}
              </span>
            </div>

            <div
              id="cai-dat-panel"
              role="tabpanel"
              aria-labelledby={tabId(tab)}
              style={col(14, {
                flex: 1,
                minHeight: 0,
                overflow: fixed ? "hidden" : "visible",
                padding: "clamp(16px,2.4vw,26px)",
              })}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontFamily: F.serif,
                    fontWeight: 400,
                    fontSize: "clamp(22px,2.4vw,27px)",
                    lineHeight: 1.15,
                  }}
                >
                  {STEPS[tab][0]}
                </h3>
                <span style={{ fontSize: 12, color: C.muted }}>tự lưu</span>
              </div>

              {/* keyed by tab: each step's settings mount fresh and enter with bonia-in */}
              {tab === 0 && (
                <VoiceTab
                  key="t0"
                  greet={sec.greet}
                  voice={voice}
                  tone={tone}
                  onVoice={(i) => {
                    setUser(true);
                    setVoice(i);
                  }}
                  onTone={(i) => {
                    setUser(true);
                    setTone(i);
                  }}
                />
              )}
              {tab === 1 && <KnowledgeTab key="t1" c={c} />}
              {tab === 2 && <CalendarTab key="t2" c={c} />}
              {tab === 3 && <CustomersTab key="t3" c={c} />}
              {tab === 4 && <OtherTab key="t4" c={c} />}

              <div style={col(4, { marginTop: "auto", background: C.warm, borderRadius: 12, padding: "12px 14px" })}>
                <span style={caps(9.5, "0.18em", C.clay)}>Bonia sẽ nói…</span>
                <span
                  style={{
                    fontFamily: F.serif,
                    fontStyle: "italic",
                    fontSize: 17,
                    lineHeight: 1.45,
                    textWrap: "pretty",
                  }}
                >
                  “{say}”
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={col(6)}>
          <div style={{ fontSize: 15, lineHeight: 1.55, color: C.ink2, textWrap: "pretty" }}>
            <span style={{ fontWeight: 600 }}>{sec.closeB}</span> {sec.close}
          </div>
          <span style={{ fontSize: 12.5, color: C.muted, fontStyle: "italic" }}>
            Tên cơ sở, giá và ưu đãi trong ví dụ là dữ liệu mẫu.
          </span>
        </div>
      </div>
    </section>
  );
}
