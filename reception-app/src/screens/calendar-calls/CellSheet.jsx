import React from "react";
import { Link } from "wouter";
import { useActions, useStore, select } from "../../store/index.jsx";
import { SideSheet, SourceChip, StatusPill, Toggle } from "../../components/ui/index.js";
import { ROOM_TYPE_BY_ID, SHEET_NAMES, CLOSE_REASONS } from "../../data/calendar.js";
import { DEMO_DATE, addDays, dayMonth, isWeekendNight, weekdayLong } from "../../lib/clock.js";
import { useIsMobile } from "../../lib/hooks.js";
import { SheetClose } from "./parts.jsx";

// 3.4 B: one cell (room type × night). Lists the pending requests that
// compete for it, the confirmed bookings Bonia knows about, hourly guests,
// and lets the owner set "Còn … phòng" or close the type for that night.
// Changes apply at once (the reducer logs them and tags the cell ĐÃ CHỈNH TAY).
const mono = { fontFamily: "var(--bn-mono)" };
const label = { ...mono, fontSize: 10, letterSpacing: "0.2em", color: "var(--bn-muted)" };

/** Nights a stored booking covers (seed bookings carry from/to, new ones nights[]). */
function bookingNights(b) {
  if (b.nights?.length) return b.nights;
  const out = [];
  for (let d = b.from; d < b.to; d = addDays(d, 1)) out.push(d);
  return out;
}

const stay = (nights) => `${dayMonth(nights[0])} → ${dayMonth(addDays(nights[nights.length - 1], 1))}`;

export function CellSheet({ open, roomType, date, onClose, onAdd }) {
  const state = useStore();
  const actions = useActions();
  const mobile = useIsMobile();
  if (!open || !roomType || !date) return null;

  const type = ROOM_TYPE_BY_ID[roomType];
  const v = select.cellView(state, date, roomType);
  const cell = state.calendar[date]?.[roomType] || { total: 0, booked: 0 };
  const stored = cell.total - cell.booked; // what the stepper edits (ignores "Hết phòng tối nay")
  const pending = state.requests
    .filter((r) => v.pendingIds.includes(r.id))
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));

  const confirmed = [
    ...state.bookings
      .filter((b) => b.roomType === roomType && bookingNights(b).includes(date))
      .map((b) => ({ id: b.id, text: `${b.name || "Khách"} · ${stay(bookingNights(b))}`, source: b.source })),
    ...state.requests
      .filter((r) => r.roomType === roomType && (r.nights || []).includes(date) && ["cho-coc", "da-xac-nhan"].includes(r.status))
      .map((r) => ({ id: r.id, text: `${r.guest} · ${stay(r.nights)}`, source: "GỌI ĐIỆN", status: r.status, link: `/yeu-cau/${r.id}` })),
  ];
  const unnamed = Math.max(0, cell.booked - confirmed.length);

  const hourlyAllowed = !!state.settings["02"]?.rooms?.find((r) => r.id === roomType)?.hourly;
  const hourly = state.requests.filter(
    (r) => r.hourly?.date === date && r.roomType === roomType && !["da-tu-choi"].includes(r.status)
  );

  const eyebrow = [
    `${weekdayLong(date).toUpperCase()} ${dayMonth(date)}`,
    date === DEMO_DATE ? "HÔM NAY" : null,
    isWeekendNight(date) ? "CUỐI TUẦN" : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const name = SHEET_NAMES[roomType] || type.name;

  const header = (
    <div style={{ padding: "26px 28px 16px", display: "flex", flexDirection: "column", gap: 6, borderBottom: "1px solid var(--bn-hairline-2)" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ ...mono, fontSize: 11, letterSpacing: "0.2em", color: "var(--bn-muted)" }}>{eyebrow}</span>
        <SheetClose onClick={onClose} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontFamily: "var(--bn-serif)", fontSize: 28 }}>{name}</span>
        <span style={{ ...mono, fontSize: 22, whiteSpace: "nowrap", color: v.remaining < 0 && !v.closed ? "var(--bn-urgent)" : undefined }}>
          {v.closed ? "đóng" : v.remaining > 0 ? `còn ${v.remaining} ` : v.remaining < 0 ? `quá ${-v.remaining} ` : "hết "}
          {!v.closed && <span style={{ fontSize: 14, color: "var(--bn-muted)" }}>/ {v.total}</span>}
        </span>
      </div>
    </div>
  );

  const setRemaining = (n) => actions.setRemaining(date, roomType, Math.max(0, Math.min(cell.total, n)));

  return (
    <SideSheet
      open
      onClose={onClose}
      width={480}
      header={header}
      label={`${name} ${dayMonth(date)}`}
      bodyStyle={{ padding: "18px 28px", display: "flex", flexDirection: "column", gap: 18 }}
      footer={
        <button
          type="button"
          onClick={() => onAdd(roomType, date)}
          style={{
            height: 48,
            borderRadius: 24,
            border: "1px solid var(--bn-hairline)",
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            whiteSpace: "nowrap",
            background: "#fff",
          }}
        >
          Thêm đặt phòng cho ngày này
        </button>
      }
    >
      {pending.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "14px 16px",
            border: `1px dashed ${v.conflict ? "var(--bn-urgent)" : "var(--bn-clay)"}`,
            borderRadius: 12,
            background: "var(--bn-urgent-wash)",
            flex: "none",
          }}
        >
          <div style={{ fontSize: 14.5, fontWeight: 600, color: v.conflict ? "var(--bn-urgent)" : "var(--bn-clay)" }}>
            {v.conflict
              ? `⚠ ${pending.length} yêu cầu đang chờ cho ${v.closed ? "loại phòng đã đóng hôm đó" : v.remaining > 0 ? `${v.remaining} phòng còn lại` : "loại phòng đã hết"}`
              : `${pending.length} yêu cầu đang chờ khách sạn xác nhận`}
          </div>
          {pending.map((r) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                fontSize: 14,
                padding: "8px 0",
                borderTop: "1px solid var(--bn-guest-bubble)",
              }}
            >
              <span>
                {r.guest} · {r.nights?.length ? stay(r.nights) : dayMonth(date)} · <span style={{ color: "var(--bn-muted)" }}>gọi {r.recordedAt}</span>
              </span>
              <Link href={`/yeu-cau/${r.id}`} className="cc-link" style={{ padding: 10, margin: -10 }}>
                Mở
              </Link>
            </div>
          ))}
          <div style={{ fontSize: 12.5, color: "var(--bn-ink-2)" }}>Khách sạn quyết. Bonia không chọn thay.</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "none" }}>
        <div style={label}>ĐÃ XÁC NHẬN · {confirmed.length + unnamed}</div>
        {confirmed.map((b) => (
          <div
            key={b.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              border: "1px solid var(--bn-hairline)",
              borderRadius: 10,
              fontSize: 14,
            }}
          >
            <span style={{ minWidth: 0 }}>
              {b.link ? (
                <Link href={b.link} style={{ color: "inherit" }}>
                  {b.text}
                </Link>
              ) : (
                b.text
              )}
            </span>
            <span style={{ display: "flex", gap: 6, alignItems: "center", flex: "none" }}>
              {b.status === "cho-coc" && <StatusPill kind="processing" size="sm">CHỜ CỌC</StatusPill>}
              {b.source && <SourceChip>{b.source}</SourceChip>}
            </span>
          </div>
        ))}
        {unnamed > 0 && (
          <div style={{ fontSize: 13.5, color: "var(--bn-muted)" }}>
            {confirmed.length ? `Thêm ${unnamed} phòng` : `${unnamed} phòng`} đã trừ trên lịch, không có tên khách.
          </div>
        )}
        {!confirmed.length && !unnamed && <div style={{ fontSize: 13.5, color: "var(--bn-muted)" }}>Chưa có đặt phòng nào đêm này.</div>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "none" }}>
        <div style={label}>THEO GIỜ · {hourly.length}</div>
        {!hourlyAllowed && !hourly.length && (
          <div style={{ fontSize: 13.5, color: "var(--bn-muted)" }}>{type.name} không nhận khách theo giờ.</div>
        )}
        {hourlyAllowed && !hourly.length && <div style={{ fontSize: 13.5, color: "var(--bn-muted)" }}>Chưa có khách theo giờ.</div>}
        {hourly.map((r) => {
          const p = select.statusPill(r.status);
          return (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, fontSize: 14 }}>
              <span>
                <span style={mono}>
                  {r.hourly.from}–{r.hourly.to}
                </span>{" "}
                · {r.guest} <span style={{ color: "var(--bn-muted)" }}>· không trừ phòng đêm</span>
              </span>
              <StatusPill kind={p.kind} size="sm">
                {p.text}
              </StatusPill>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--bn-hairline-2)", paddingTop: 16, flex: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 15, color: v.closed ? "var(--bn-muted)" : undefined }}>Còn … phòng</span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid var(--bn-hairline)",
              borderRadius: 22,
              height: 44,
              whiteSpace: "nowrap",
              flex: "none",
              opacity: v.closed ? 0.5 : 1,
            }}
          >
            <StepBtn label="Bớt một phòng" disabled={v.closed || stored <= 0} onClick={() => setRemaining(stored - 1)}>
              −
            </StepBtn>
            <span aria-live="polite" style={{ ...mono, fontSize: 17, width: 28, textAlign: "center" }}>
              {stored}
            </span>
            <StepBtn label="Thêm một phòng" disabled={v.closed || stored >= cell.total} onClick={() => setRemaining(stored + 1)}>
              +
            </StepBtn>
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: mobile ? 44 : undefined }}>
          <span style={{ fontSize: 15 }}>Đóng loại phòng này hôm đó</span>
          <Toggle
            size="lg"
            on={v.closed}
            label="Đóng loại phòng này hôm đó"
            onChange={(on) => actions.setClosed(date, roomType, on, on ? CLOSE_REASONS[0].toUpperCase() : "")}
          />
        </div>
        {v.closed && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 13.5, color: "var(--bn-ink-2)", marginRight: 4 }}>Lý do</span>
            {CLOSE_REASONS.map((r) => {
              const tag = r === "Khác" ? "" : r.toUpperCase();
              return (
                <button
                  key={r}
                  type="button"
                  className="cc-chip"
                  aria-pressed={v.closedReason === tag}
                  onClick={() => actions.setClosed(date, roomType, true, tag)}
                >
                  {r}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </SideSheet>
  );
}

function StepBtn({ children, onClick, disabled, label: aria }) {
  return (
    <button
      type="button"
      aria-label={aria}
      disabled={disabled}
      onClick={onClick}
      style={{ width: 44, height: 44, textAlign: "center", fontSize: 18, opacity: disabled ? 0.4 : 1, cursor: disabled ? "default" : "pointer" }}
    >
      {children}
    </button>
  );
}
