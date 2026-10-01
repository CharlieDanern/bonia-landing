import { useEffect, useRef } from "react";
import Orb from "./Orb.jsx";
import { C, F, appear } from "./tokens.js";

/* The call player under the demo tiles (handoff v5, "Call demo"). Purely
 * presentational: CallDemo owns the timeline and passes the current second.
 *
 * Wide (page >= 880 px): v4's two 600 px columns, the conversation plus the
 * card sent to the desk on the left, what Bonia is doing (orb 200, status,
 * the checks it runs) on the right.
 * Narrow (< 880 px): one column. A compact bar (orb 52, status, clock) stays
 * put above a 460 px feed that interleaves bubbles and check cards in time
 * order and ends with the card sent to the desk. The narrow cards use the
 * prototype's slightly smaller type, listed per size in `SIZES`. */

export const TOOL_DUR = 1.6; // s a check shows "đang tra" before its results appear, unless the event has its own `dur`

export const fmt = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");

// ---- small style helpers -------------------------------------------------

const caps = (fontSize, letterSpacing, color, extra) => ({
  fontFamily: F.mono,
  fontSize,
  letterSpacing,
  textTransform: "uppercase",
  color,
  ...extra,
});
const circle = (d, extra) => ({
  width: d,
  height: d,
  flex: "none",
  borderRadius: d / 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  ...extra,
});
const flexCol = (gap, extra) => ({ display: "flex", flexDirection: "column", gap, ...extra });
const rowBetween = { display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" };
const colPad = "clamp(16px,2.4vw,26px)";

const SLOT_TAKEN = { background: C.tinted, color: C.muted, border: `1px solid ${C.tinted}`, textDecoration: "line-through" };
const SLOT_FREE = { background: C.surface, color: C.clay, border: `1px solid ${C.clay}`, textDecoration: "none" };
const SLOT_PICK = { background: C.clay, color: C.onClay, border: `1px solid ${C.clay}`, textDecoration: "none" };

const BUBBLE = {
  Bonia: { align: "flex-end", who: C.clay, radius: "16px 4px 16px 16px", bg: C.priceBg, border: C.priceLine },
  Khách: { align: "flex-start", who: C.ink3, radius: "4px 16px 16px 16px", bg: C.ground, border: C.line2 },
};

// Type and spacing that differ between the wide columns and the narrow feed.
const SIZES = {
  wide: {
    bubbleMax: "84%",
    who: 11.5,
    bubblePad: "10px 14px",
    toolBg: C.surface,
    toolPad: "10px 12px",
    toolLabel: 10,
    toolStatus: 11,
    toolDetail: 13.5,
    slot: 12,
    slotPad: "4px 9px",
    rowCols: "minmax(72px,auto) minmax(0,1fr)",
    rowGap: 10,
    row: 13,
    resPad: "14px 16px",
    resGap: 7,
    resLabel: 10,
    resNote: 11.5,
    resMain: 16,
    resSub: 13.5,
    badge: 11.5,
    badgePad: "2px 10px",
    action: 38,
    actionPad: "0 16px",
    actionFont: 13.5,
  },
  narrow: {
    bubbleMax: "88%",
    who: 11,
    bubblePad: "9px 13px",
    toolBg: C.warm,
    toolPad: "9px 11px",
    toolLabel: 9.5,
    toolStatus: 10.5,
    toolDetail: 13,
    slot: 11.5,
    slotPad: "4px 8px",
    rowCols: "minmax(64px,auto) minmax(0,1fr)",
    rowGap: 8,
    row: 12.5,
    resPad: "12px 14px",
    resGap: 6,
    resLabel: 9.5,
    resNote: 11,
    resMain: 15,
    resSub: 13,
    badge: 11,
    badgePad: "2px 9px",
    action: 36,
    actionPad: "0 14px",
    actionFont: 13,
  },
};

// ▶ / ❚❚ glyph; `big` is the player header's 52 px button, else a tile's 44 px one.
export function PlayGlyph({ playing, big, color }) {
  const barW = big ? 5 : 4;
  const barH = big ? 17 : 14;
  if (playing) {
    return (
      <span aria-hidden="true" style={{ display: "flex", gap: barW }}>
        <span style={{ width: barW, height: barH, background: C.onClay, borderRadius: 1 }} />
        <span style={{ width: barW, height: barH, background: C.onClay, borderRadius: 1 }} />
      </span>
    );
  }
  const w = big ? 15 : 12;
  const h = big ? 9 : 7;
  return (
    <span
      aria-hidden="true"
      style={{
        width: 0,
        height: 0,
        borderLeft: `${w}px solid ${color}`,
        borderTop: `${h}px solid transparent`,
        borderBottom: `${h}px solid transparent`,
        marginLeft: big ? 5 : 4,
      }}
    />
  );
}

function Bubble({ event, ring, z }) {
  const b = BUBBLE[event.s] || BUBBLE["Khách"];
  return (
    <div
      style={{
        alignSelf: b.align,
        maxWidth: z.bubbleMax,
        display: "flex",
        flexDirection: "column",
        alignItems: b.align,
        gap: 3,
        ...appear(450),
      }}
    >
      <span style={{ fontSize: z.who, fontWeight: 600, color: b.who, padding: "0 6px" }}>{event.s}</span>
      <span
        style={{
          fontSize: 15,
          lineHeight: 1.5,
          padding: z.bubblePad,
          borderRadius: b.radius,
          background: b.bg,
          border: `1px solid ${b.border}`,
          boxShadow: ring ? `0 0 0 2px ${C.clay}` : "none",
          transition: "box-shadow .3s",
        }}
      >
        {event.text}
      </span>
    </div>
  );
}

function ToolCard({ event, t, z }) {
  const done = t >= event.at + (event.dur ?? TOOL_DUR);
  const busy = !done;
  const status = busy ? "đang tra" + ".".repeat(1 + (Math.floor(t * 4) % 3)) : "✓ xong";
  return (
    <div
      style={{
        ...appear(450),
        border: `1px solid ${busy ? C.clay : C.line2}`,
        background: z.toolBg,
        borderRadius: 12,
        padding: z.toolPad,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        transition: "border-color .3s",
      }}
    >
      <div style={rowBetween}>
        <span style={caps(z.toolLabel, "0.16em", C.clay)}>{event.tool}</span>
        <span style={{ fontFamily: F.mono, fontSize: z.toolStatus, color: busy ? C.clay : C.muted, whiteSpace: "nowrap" }}>
          {status}
        </span>
      </div>
      <span style={{ fontSize: z.toolDetail, lineHeight: 1.4 }}>{event.detail}</span>
      {done && event.slots && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, ...appear(400) }}>
          {event.slots.map((sl) => (
            <span
              key={sl.t}
              style={{
                fontFamily: F.mono,
                fontSize: z.slot,
                padding: z.slotPad,
                borderRadius: 6,
                transition: "background .3s, color .3s",
                ...(sl.pick != null && t >= sl.pick ? SLOT_PICK : sl.free ? SLOT_FREE : SLOT_TAKEN),
              }}
            >
              {sl.t}
            </span>
          ))}
        </div>
      )}
      {done && event.rows && (
        <div style={flexCol(3, appear(400))}>
          {event.rows.map(([k, v]) => (
            <div
              key={k}
              style={{ display: "grid", gridTemplateColumns: z.rowCols, gap: z.rowGap, fontSize: z.row, lineHeight: 1.45 }}
            >
              <span style={{ color: C.muted }}>{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultCard({ result, fresh, z, narrow }) {
  return (
    <div
      style={{
        flex: "none",
        ...appear(500),
        border: `1.5px solid ${C.clay}`,
        background: fresh ? C.highlight : C.surface,
        borderRadius: 14,
        padding: z.resPad,
        display: "flex",
        flexDirection: "column",
        gap: z.resGap,
        marginTop: narrow ? 4 : 0,
        transition: "background .6s",
      }}
    >
      <div style={rowBetween}>
        <span style={caps(z.resLabel, "0.16em", C.clay)}>Gửi tới máy lễ tân</span>
        <span style={{ fontSize: z.resNote, fontWeight: 600, color: C.clay }}>{fresh ? "Vừa gửi" : ""}</span>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span
          style={caps(z.resLabel, "0.14em", C.ink3, {
            border: `1px solid ${C.line}`,
            padding: "2px 7px",
            borderRadius: 4,
          })}
        >
          {result.tag}
        </span>
        <span style={{ fontSize: z.resMain, fontWeight: 600 }}>{result.main}</span>
      </div>
      <span style={{ fontSize: z.resSub, lineHeight: 1.45, color: C.ink3 }}>{result.sub}</span>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          // The wide card keeps badge and button on one row; the narrow one may wrap.
          ...(narrow ? { flexWrap: "wrap" } : { paddingTop: 2 }),
        }}
      >
        <span
          style={{
            fontSize: z.badge,
            fontWeight: 500,
            color: C.ink3,
            border: `1px dashed ${C.dashed}`,
            padding: z.badgePad,
            borderRadius: 999,
          }}
        >
          {result.badge}
        </span>
        <span
          style={{
            height: z.action,
            padding: z.actionPad,
            borderRadius: 999,
            background: C.clay,
            color: C.onClay,
            fontSize: z.actionFont,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
          }}
        >
          {result.action}
        </span>
      </div>
    </div>
  );
}

// Scroll a pane to its newest item (only called when a new item appeared).
function scrollToEnd(el, reduce) {
  if (!el) return;
  requestAnimationFrame(() => {
    if (el.scrollHeight > el.clientHeight) {
      el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
    }
  });
}

// Auto-scroll `ref`'s pane whenever `key` changes (a new item, or a check's
// results appearing), and when the pane itself is (re)mounted.
function useScrollToEnd(key, reduce) {
  const ref = useRef(null);
  const reduceRef = useRef(reduce);
  reduceRef.current = reduce;
  useEffect(() => {
    scrollToEnd(ref.current, reduceRef.current);
  }, [key]);
  return ref;
}

const pane = { flex: 1, minHeight: 0, overflowY: "auto", scrollbarWidth: "thin" };

/* props: call, index (its CALLS index, for keys), t, running, wide,
 * status, thinking, fresh, simulating, reduce, onToggle, onClose. */
const PLAYER_CSS = `
.rcp-title{min-width:170px}
@media (max-width:359px){.rcp-title{min-width:0}.rcp-head{flex-wrap:nowrap !important}}
`;

export default function CallPlayer({
  call,
  index,
  t,
  running,
  wide,
  status,
  thinking,
  fresh,
  simulating,
  reduce,
  soft = C.surface, // the picked tile's lighter tone (handoff v5 update)
  edge = C.line,
  onToggle,
  onClose,
}) {
  const z = wide ? SIZES.wide : SIZES.narrow;
  const items = [];
  let latest = -1;
  let speechN = 0;
  let toolN = 0;
  let doneTools = 0;
  call.events.forEach((e, k) => {
    if (e.at > t) return;
    items.push(k);
    if (e.s) {
      latest = k;
      speechN += 1;
    } else {
      toolN += 1;
      if (t >= e.at + (e.dur ?? TOOL_DUR)) doneTools += 1;
    }
  });
  const reached = t >= call.result.at;
  const progress = Math.min(100, (t / call.end) * 100);
  const clock = `${fmt(t)} / ${fmt(call.end)}`;
  const mode = simulating ? "Chưa có ghi âm · đang mô phỏng" : "";

  const chatRef = useScrollToEnd(`${index}:${wide}:${speechN}:${reached}`, reduce);
  const toolRef = useScrollToEnd(`${index}:${wide}:${toolN}:${doneTools}`, reduce);
  const feedRef = useScrollToEnd(`${index}:${wide}:${items.length}:${doneTools}:${reached}`, reduce);

  const bubble = (k) => (
    <Bubble key={`${index}-${k}`} event={call.events[k]} ring={k === latest && t < call.end} z={z} />
  );
  const tool = (k) => <ToolCard key={`${index}-${k}`} event={call.events[k]} t={t} z={z} />;

  return (
    <div
      role="region"
      aria-label={`Cuộc gọi mẫu: ${call.title}`}
      style={{
        width: "100%",
        minWidth: 0,
        background: soft,
        border: "none",
        borderRadius: 22,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        color: C.ink,
        boxShadow: `0 30px 60px -36px rgba(52,38,20,0.45),inset 0 0 0 1px ${edge}`,
        ...appear(450),
      }}
    >
      {/* Header. The title block's 170 px floor wraps the × onto its own row
          below 360 px, so under that width it may shrink instead. */}
      <style>{PLAYER_CSS}</style>
      <div
        className="rcp-head"
        style={{
          padding: "16px clamp(14px,2.4vw,26px)",
          display: "flex",
          gap: 14,
          alignItems: "center",
          flexWrap: "wrap",
          borderBottom: `1px solid ${C.line3}`,
        }}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-label={`${running ? "Tạm dừng" : "Nghe"}: ${call.title}`}
          style={circle(52, {
            margin: 0,
            padding: 0,
            border: "none",
            cursor: "pointer",
            background: C.clay,
            boxShadow: `0 0 0 5px ${C.ground}`,
          })}
        >
          <PlayGlyph playing={running} big color={C.onClay} />
        </button>
        <div className="rcp-title" style={flexCol(3, { flex: 1 })}>
          <span style={caps(10, "0.16em", C.clay)}>{call.tag}</span>
          <span style={{ fontFamily: F.serif, fontSize: "clamp(20px,2.2vw,26px)", lineHeight: 1.2, letterSpacing: "-0.015em" }}>
            {call.title}
          </span>
          <span style={{ fontSize: 13, color: C.ink3 }}>{call.caller}</span>
        </div>
        {wide && (
          <div style={flexCol(3, { alignItems: "flex-end" })}>
            <span style={{ fontFamily: F.mono, fontSize: 12.5 }}>{clock}</span>
            <span style={{ fontSize: 11.5, color: C.muted }}>{mode}</span>
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          style={circle(40, {
            margin: 0,
            padding: 0,
            cursor: "pointer",
            background: C.surface,
            border: `1px solid ${C.line}`,
            fontSize: 17,
            color: C.ink3,
          })}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      {/* Progress */}
      <div aria-hidden="true" style={{ height: 3, background: C.line3 }}>
        <div style={{ height: 3, width: progress + "%", background: C.clay, transition: "width .1s linear" }} />
      </div>

      {wide ? (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
          {/* Left: the conversation + the card sent to the desk */}
          <div style={flexCol(12, { height: 600, padding: colPad, minWidth: 0 })}>
            <span style={caps(10, "0.2em", C.muted, { flex: "none", padding: "0 10px" })}>Cuộc gọi</span>
            <div
              ref={chatRef}
              tabIndex={0}
              role="log"
              aria-label="Lời thoại cuộc gọi"
              aria-live={simulating ? "polite" : "off"}
              style={pane}
            >
              <div style={flexCol(6, { padding: "2px 4px" })}>{items.filter((k) => call.events[k].s).map(bubble)}</div>
            </div>
            {reached && <ResultCard key={index} result={call.result} fresh={fresh} z={z} />}
          </div>

          {/* Right: what Bonia is doing */}
          <div
            style={flexCol(10, {
              height: 600,
              padding: colPad,
              background: C.warm,
              borderLeft: `1px solid ${C.line3}`,
              minWidth: 0,
            })}
          >
            <div
              style={flexCol(12, {
                alignItems: "center",
                padding: "4px 0 16px",
                marginBottom: 4,
                borderBottom: `1px dashed ${C.line2}`,
                textAlign: "center",
              })}
            >
              <Orb size={200} thinking={thinking} running={running} />
              <div style={flexCol(4, { alignItems: "center" })}>
                <span style={caps(10, "0.2em", C.muted)}>Bonia đang làm</span>
                <span style={{ fontFamily: F.serif, fontSize: 21, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                  {status}
                </span>
              </div>
            </div>
            <div ref={toolRef} tabIndex={0} role="region" aria-label="Bonia đang làm" style={pane}>
              <div style={flexCol(10)}>{items.filter((k) => !call.events[k].s).map(tool)}</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={flexCol(0)}>
          {/* Compact bar: orb, status, clock */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              background: C.warm,
              borderBottom: `1px solid ${C.line3}`,
            }}
          >
            <Orb size={52} thinking={thinking} running={running} />
            <div style={flexCol(2, { flex: 1, minWidth: 0 })}>
              <span style={caps(9.5, "0.18em", C.muted)}>Bonia đang làm</span>
              <span style={{ fontSize: 14.5, fontWeight: 500 }}>{status}</span>
            </div>
            {/* Capped so "Chưa có ghi âm · đang mô phỏng" wraps onto two lines
                instead of squeezing the status to a word per line on phones. */}
            <div style={flexCol(2, { alignItems: "flex-end", maxWidth: 104, flex: "none" })}>
              <span style={{ fontFamily: F.mono, fontSize: 12, whiteSpace: "nowrap" }}>{clock}</span>
              <span style={{ fontSize: 10.5, color: C.muted, textAlign: "right" }}>{mode}</span>
            </div>
          </div>
          {/* One feed: bubbles and checks in time order, then the desk card */}
          <div
            ref={feedRef}
            tabIndex={0}
            role="log"
            aria-label="Lời thoại cuộc gọi"
            aria-live={simulating ? "polite" : "off"}
            style={flexCol(8, { height: 460, overflowY: "auto", padding: "14px 12px" })}
          >
            {items.map((k) => (call.events[k].s ? bubble(k) : tool(k)))}
            {reached && <ResultCard key={index} result={call.result} fresh={fresh} z={z} narrow />}
          </div>
        </div>
      )}
    </div>
  );
}
