import React from "react";
import { useStore, select } from "../../store/index.jsx";
import { StatusPill } from "../../components/ui/index.js";
import { ROOM_TYPE_BY_ID } from "../../data/calendar.js";
import { DEMO_DATE } from "../../lib/clock.js";

// Lịch phòng pieces used by both the desktop page and the phone list.
const mono = { fontFamily: "var(--bn-mono)" };

/** Always-on limit: Bonia only knows bookings that are in Bonia. */
export function LimitNote({ onAdd, style }) {
  return (
    <div
      style={{
        padding: "11px 16px",
        border: "1px solid var(--bn-hairline)",
        borderRadius: 10,
        background: "var(--bn-cream-3)",
        fontSize: 13.5,
        // 1.5 = 20.25px; the frame's box snaps to 64px, so whole pixels here.
        lineHeight: "20px",
        color: "var(--bn-ink-2)",
        flex: "none",
        ...style,
      }}
    >
      Bonia chỉ biết những đặt phòng có trong Bonia. Khách đặt qua Booking.com, Agoda hay khách vãng lai: thêm vào đây (
      {/* An inline <a>, not a button: an inline-block would grow the line box by 1px. */}
      <a
        href="#them-dat-phong"
        role="button"
        className="cc-link"
        onClick={(e) => {
          e.preventDefault();
          onAdd();
        }}
      >
        Thêm đặt phòng
      </a>
      ) để Bonia không báo nhầm còn phòng.
    </div>
  );
}

/** Today's hourly guests: never subtract tonight's rooms. */
export function HourlyRow({ mobile = false }) {
  const state = useStore();
  const rows = state.requests.filter((r) => r.hourly?.date === DEMO_DATE && !["da-tu-choi"].includes(r.status));
  const head = <span style={{ ...mono, fontSize: 10, letterSpacing: "0.18em", color: "var(--bn-muted)" }}>THEO GIỜ HÔM NAY</span>;
  if (!rows.length) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13.5, flexWrap: "wrap" }}>
        {head}
        <span style={{ color: "var(--bn-muted)" }}>Chưa có khách theo giờ.</span>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((r, i) => (
        <div key={r.id} style={{ display: "flex", alignItems: "center", gap: mobile ? 8 : 12, fontSize: 13.5, flexWrap: "wrap" }}>
          {i === 0 ? head : <span style={{ width: 0 }} />}
          <span style={mono}>
            {r.hourly.from}–{r.hourly.to}
          </span>
          <span>
            {ROOM_TYPE_BY_ID[r.roomType]?.name} · {r.guestShort}
          </span>
          {r.status === "moi" ? (
            <span
              style={{
                ...mono,
                fontSize: 9.5,
                letterSpacing: "0.08em",
                padding: "3px 7px",
                borderRadius: 4,
                border: "1px dashed var(--bn-clay)",
                color: "var(--bn-clay)",
                whiteSpace: "nowrap",
              }}
            >
              CHỜ KHÁCH SẠN XÁC NHẬN
            </span>
          ) : (
            <StatusPill kind={select.statusPill(r.status).kind} size="sm">
              {select.statusPill(r.status).text}
            </StatusPill>
          )}
          <span style={{ color: "var(--bn-muted)" }}>· không trừ phòng đêm nay</span>
        </div>
      ))}
    </div>
  );
}

export function Legend({ style }) {
  const box = (bg, border) => <span style={{ width: 18, height: 14, background: bg, border, flex: "none" }} />;
  const tag = (text, border, color) => (
    <span style={{ ...mono, fontSize: 9, border, color, borderRadius: 4, padding: "1px 4px", whiteSpace: "nowrap" }}>{text}</span>
  );
  const item = { display: "flex", alignItems: "center", gap: 6 };
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 18,
        rowGap: 10,
        fontSize: 12.5,
        color: "var(--bn-ink-2)",
        borderTop: "1px solid var(--bn-hairline)",
        paddingTop: 14,
        ...style,
      }}
    >
      <span style={item}>
        {box("#fff", "1px solid var(--bn-hairline)")}Còn trống
      </span>
      <span style={item}>
        {box("var(--bn-processing-bg)")}Hết
      </span>
      <span style={item}>
        {tag("+1 CHỜ", "1px dashed var(--bn-clay)", "var(--bn-clay)")}Chờ khách sạn xác nhận
      </span>
      <span style={item}>
        {tag("⚠ +2 CHỜ", "1px solid var(--bn-urgent)", "var(--bn-urgent)")}Nhiều yêu cầu chờ hơn số phòng còn
      </span>
      <span style={item}>
        {box("repeating-linear-gradient(135deg,#EFE9DD 0 4px,#fff 4px 8px)", "1px solid var(--bn-hairline)")}Đóng
      </span>
      <span style={item}>
        {tag("ĐÃ CHỈNH TAY", "1px solid var(--bn-hairline)", "var(--bn-ink-2)")}Chủ sửa số
      </span>
    </div>
  );
}
