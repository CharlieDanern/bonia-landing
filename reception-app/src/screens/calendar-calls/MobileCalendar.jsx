import React from "react";
import { useStore, select } from "../../store/index.jsx";
import { Button } from "../../components/ui/index.js";
import { DAYS, ROOM_TYPES } from "../../data/calendar.js";
import { weekdayLong } from "../../lib/clock.js";
import { DarkNote } from "./parts.jsx";
import { HourlyRow, LimitNote } from "./CalendarBits.jsx";

// Below 768px the 14 × 5 grid becomes one card per day with a row per room
// type ("còn 2 / 4"), so nothing scrolls sideways. Rows open the same cell
// sheet (from the bottom on phones).
const mono = { fontFamily: "var(--bn-mono)" };

export function MobileCalendar({ onCell, onAdd, note, onHideNote, stale }) {
  const state = useStore();
  return (
    <div style={{ padding: "20px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div className="tt-eyebrow" style={{ letterSpacing: "0.18em", color: stale ? "var(--bn-urgent)" : undefined }}>
          Lịch phòng cập nhật lúc {stale ? state.calendarMeta.staleSince : state.calendarMeta.updatedAt}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h2 className="tt-page-title" style={{ fontSize: 32 }}>
            Lịch phòng
          </h2>
          {!stale && (
            <Button size="sm" onClick={onAdd} style={{ padding: "0 18px" }}>
              Thêm đặt phòng
            </Button>
          )}
        </div>
      </div>
      {note && (
        <DarkNote onHide={onHideNote} timeout={6000}>
          {note}
        </DarkNote>
      )}
      <LimitNote onAdd={onAdd} />
      <HourlyRow mobile />

      {DAYS.map((d) => (
        <section
          key={d.date}
          aria-label={`${weekdayLong(d.date)} ${d.d}`}
          style={{ background: "#fff", border: "1px solid var(--bn-hairline)", borderRadius: 12, overflow: "hidden", opacity: stale ? 0.62 : 1 }}
        >
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 14px",
              background: d.today ? "var(--bn-ink)" : d.weekend ? "var(--bn-cream-2)" : "#fff",
              color: d.today ? "var(--bn-cream-2)" : "var(--bn-ink)",
              borderBottom: "1px solid var(--bn-hairline)",
            }}
          >
            <span style={{ ...mono, fontSize: 13 }}>
              {d.w} {d.d}
            </span>
            <span style={{ ...mono, fontSize: 10, letterSpacing: "0.16em" }}>{d.today ? "HÔM NAY" : d.weekend ? "CUỐI TUẦN" : ""}</span>
          </header>
          {ROOM_TYPES.map((t, i) => {
            const v = select.cellView(state, d.date, t.id);
            const full = !v.closed && v.remaining <= 0;
            const tag = v.closed
              ? v.closedReason
              : v.pending
                ? `${v.conflict ? "⚠ " : ""}+${v.pending} CHỜ`
                : v.manual
                  ? "ĐÃ CHỈNH TAY"
                  : "";
            return (
              <button
                key={t.id}
                type="button"
                className="cc-cell"
                onClick={() => onCell(t.id, d.date)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  minHeight: 48,
                  padding: "8px 14px",
                  borderTop: i ? "1px solid var(--bn-hairline-2)" : 0,
                  background: v.conflict ? "var(--bn-urgent-wash)" : full ? "var(--bn-processing-bg)" : "#fff",
                  boxShadow: v.conflict ? "inset 3px 0 0 var(--bn-urgent)" : "none",
                  textAlign: "left",
                }}
              >
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500 }}>{t.name}</span>
                {tag && (
                  <span
                    style={{
                      ...mono,
                      fontSize: 9,
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap",
                      borderRadius: 4,
                      padding: "2px 4px",
                      color: v.conflict ? "var(--bn-urgent)" : v.pending ? "var(--bn-clay)" : "var(--bn-ink-2)",
                      border: v.conflict
                        ? "1px solid var(--bn-urgent)"
                        : v.pending && !v.closed
                          ? "1px dashed var(--bn-clay)"
                          : "1px solid var(--bn-hairline)",
                    }}
                  >
                    {tag}
                  </span>
                )}
                <span style={{ ...mono, fontSize: 15, color: full || v.closed ? "var(--bn-muted)" : "var(--bn-ink)", whiteSpace: "nowrap", minWidth: 72, textAlign: "right" }}>
                  {v.closed ? "đóng" : v.remaining < 0 ? `−${-v.remaining}` : full ? "hết" : `còn ${v.remaining} / ${v.total}`}
                </span>
              </button>
            );
          })}
        </section>
      ))}
    </div>
  );
}
