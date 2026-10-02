import React from "react";
import { useStore, select } from "../../store/index.jsx";
import { CalendarCell, CalendarDayHeader } from "../../components/ui/index.js";
import { DAYS, ROOM_TYPES } from "../../data/calendar.js";

// 14-day × 5-type grid (3.4 A). Cells come straight from select.cellView,
// so confirming a request or adding a booking redraws them.
//
// plain: the reduced grid the handoff draws under the sheets and in the
// stale frame (numbers only, no "/4", no tags, no "4 PHÒNG").
const mono = { fontFamily: "var(--bn-mono)" };
const COLS = "176px repeat(14,minmax(0,1fr))";

export function CalendarGrid({ onCell, plain = false, dimmed = false, style }) {
  const state = useStore();
  return (
    <div
      role="grid"
      aria-label="Lịch phòng 14 ngày"
      className="cc-grid"
      style={{
        display: "grid",
        gridTemplateColumns: COLS,
        borderTop: "1px solid var(--bn-hairline)",
        borderLeft: "1px solid var(--bn-hairline)",
        background: "#fff",
        flex: "none",
        ...style,
      }}
    >
      <div style={{ height: 52, borderRight: "1px solid var(--bn-hairline)", borderBottom: "1px solid var(--bn-hairline)" }} />
      {DAYS.map((d) =>
        plain ? <PlainDayHeader key={d.date} {...d} /> : <CalendarDayHeader key={d.date} w={d.w} d={d.d} today={d.today} weekend={d.weekend} />
      )}
      {ROOM_TYPES.map((t) => (
        <div key={t.id} role="row" style={{ display: "contents" }}>
          <div
            style={{
              height: 84,
              borderRight: "1px solid var(--bn-hairline)",
              borderBottom: "1px solid var(--bn-hairline-2)",
              padding: "0 14px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 3,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</span>
            {!plain && <span style={{ ...mono, fontSize: 10.5, color: "var(--bn-muted)" }}>{t.total} PHÒNG</span>}
          </div>
          {DAYS.map((d) => {
            const v = select.cellView(state, d.date, t.id);
            const left = v.closed ? "đóng" : v.remaining > 0 ? `còn ${v.remaining} / ${v.total}` : v.remaining < 0 ? `quá ${-v.remaining} phòng` : "hết";
            const label = `${t.name} ${d.w} ${d.d}: ${left}${
              v.pending ? `, ${v.pending} yêu cầu chờ` : ""
            }`;
            const open = onCell ? () => onCell(t.id, d.date) : undefined;
            return plain ? (
              <PlainCell key={d.date} v={v} dimmed={dimmed} onClick={open} label={label} />
            ) : (
              <CalendarCell
                key={d.date}
                {...v}
                dimmed={dimmed}
                onClick={open}
                label={label}
                style={{ opacity: dimmed ? 0.62 : 1 }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function PlainDayHeader({ w, d, today, weekend }) {
  const c = today ? "var(--bn-cream-2)" : "var(--bn-ink)";
  return (
    <div
      style={{
        height: 52,
        borderRight: "1px solid var(--bn-hairline-2)",
        borderBottom: "1px solid var(--bn-hairline)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        background: today ? "var(--bn-ink)" : weekend ? "var(--bn-cream-2)" : "#fff",
      }}
    >
      <span style={{ ...mono, fontSize: 10, color: c }}>{w}</span>
      <span style={{ ...mono, fontSize: 13, color: c }}>{d}</span>
    </div>
  );
}

/** Number-only cell: same fills and conflict ring as CalendarCell, no tags. */
function PlainCell({ v, dimmed, onClick, label }) {
  const full = !v.closed && v.remaining <= 0;
  const bg = v.closed
    ? "repeating-linear-gradient(135deg,#EFE9DD 0 6px,#FFFFFF 6px 12px)"
    : v.conflict
      ? "var(--bn-urgent-wash)"
      : full
        ? "var(--bn-processing-bg)"
        : "#fff";
  const n = v.closed ? "Đóng" : full ? "hết" : String(v.remaining);
  const color = v.closed ? "var(--bn-ink-2)" : full ? "var(--bn-muted)" : "var(--bn-ink)";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        height: 84,
        borderRight: "1px solid var(--bn-hairline-2)",
        borderBottom: "1px solid var(--bn-hairline-2)",
        padding: 7,
        // flex-start: a <button> centres block content vertically otherwise.
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        width: "100%",
        textAlign: "left",
        background: bg,
        boxShadow: v.conflict ? "inset 0 0 0 2px var(--bn-urgent)" : "none",
        opacity: dimmed ? 0.62 : 1,
      }}
    >
      <span style={{ ...mono, fontSize: 20, color, display: "block", lineHeight: "normal" }}>{n}</span>
    </button>
  );
}
