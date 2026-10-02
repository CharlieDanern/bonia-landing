import React, { useEffect, useRef, useState } from "react";
import { useActions, useStore, select } from "../../store/index.jsx";
import { Button, SideSheet } from "../../components/ui/index.js";
import { BOOKING_SOURCES, DAYS, ROOM_TYPES, ROOM_TYPE_BY_ID, SELL_MODES } from "../../data/calendar.js";
import { addDays, dayMonth, isoToDate, weekdayShort } from "../../lib/clock.js";
import { useIsMobile } from "../../lib/hooks.js";
import { SheetClose } from "./parts.jsx";

// 3.4 C "Thêm đặt phòng": bookings Bonia can't see (Booking.com, Agoda,
// walk-ins). Only room type + date are required. Saving subtracts the
// nights from Lịch phòng (store addBooking); a full night goes to −1 and
// Bonia then says it is full. Theo giờ never subtracts nights.
const fieldLabel = { fontSize: 13.5, fontWeight: 500 };
const Req = () => <span style={{ color: "var(--bn-urgent)" }}>*</span>;

/** "2026-10-10" → "T7 10/10/2026" */
const longDate = (iso) => `${weekdayShort(iso)} ${dayMonth(iso)}/${isoToDate(iso).getFullYear()}`;

export function AddBookingSheet({ open, initial, focusDate = false, onClose, onSaved }) {
  const state = useStore();
  const actions = useActions();
  const mobile = useIsMobile();
  const [f, setF] = useState(() => blank(initial));
  const [dateFocus, setDateFocus] = useState(focusDate);
  const dateRef = useRef(null);

  useEffect(() => {
    if (open) {
      setF(blank(initial));
      setDateFocus(focusDate);
    }
  }, [open, initial, focusDate]);
  useEffect(() => {
    if (open && focusDate) dateRef.current?.focus({ preventScroll: true });
  }, [open, focusDate]);

  if (!open) return null;
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const hourly = f.mode === "theo-gio";
  const nights = f.roomType && f.date && !hourly ? Array.from({ length: f.nights }, (_, i) => addDays(f.date, i)) : [];
  const fullNights = nights.filter((d) => state.calendar[d] && select.remaining(state, d, f.roomType) <= 0);
  const ready = !!(f.roomType && f.date);
  const typeName = ROOM_TYPE_BY_ID[f.roomType]?.name;

  let hint = "Chỉ loại phòng và ngày là bắt buộc.";
  if (hourly) hint += " Khách theo giờ không trừ phòng đêm.";
  else if (fullNights.length)
    hint += ` ${typeName} ${fullNights.map((d) => `${weekdayShort(d)} ${dayMonth(d)}`).join(", ")} đang hết: lưu sẽ thành −1, Bonia sẽ báo hết phòng.`;

  const save = () => {
    if (!ready) return;
    actions.addBooking({ roomType: f.roomType, nights, name: f.name.trim(), phone: f.phone.trim(), source: f.source, sellMode: f.mode });
    onSaved?.({ roomType: f.roomType, date: f.date, name: f.name.trim(), hourly });
  };

  const header = (
    <div style={{ padding: "26px 28px 14px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span style={{ fontFamily: "var(--bn-serif)", fontSize: 28 }}>Thêm đặt phòng</span>
      <SheetClose onClick={onClose} />
    </div>
  );

  return (
    <SideSheet
      open
      onClose={onClose}
      width={520}
      header={header}
      label="Thêm đặt phòng"
      bodyStyle={{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}
    >
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "4px 28px 18px", display: "flex", flexDirection: "column", gap: 18 }}>
        <Field label={<>Loại phòng <Req /></>}>
          <div role="group" aria-label="Loại phòng" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ROOM_TYPES.map((t) => (
              <button key={t.id} type="button" className="cc-chip" aria-pressed={f.roomType === t.id} onClick={() => set("roomType", t.id)}>
                {t.name}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Cách bán">
          <div
            role="radiogroup"
            aria-label="Cách bán"
            style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", border: "1px solid var(--bn-hairline)", borderRadius: 10, overflow: "hidden" }}
          >
            {SELL_MODES.map((m, i) => {
              const on = f.mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => set("mode", m.id)}
                  style={{
                    height: mobile ? 44 : 42,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    background: on ? "var(--bn-clay)" : "#fff",
                    color: on ? "#fff" : "var(--bn-ink)",
                    fontWeight: on ? 500 : 400,
                    borderLeft: i ? "1px solid var(--bn-hairline)" : 0,
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 140px", gap: 10 }}>
          <Field label={<>{hourly ? "Ngày" : "Ngày nhận"} <Req /></>}>
            <div
              className={`cc-input${dateFocus ? " cc-input--focus" : ""}`}
              style={{ position: "relative", display: "flex", alignItems: "center", fontFamily: "var(--bn-mono)", whiteSpace: "nowrap" }}
            >
              <span style={{ color: f.date ? "var(--bn-ink)" : "var(--bn-muted)", fontFamily: f.date ? "var(--bn-mono)" : "var(--bn-sans)" }}>
                {f.date ? longDate(f.date) : "Chọn ngày"}
              </span>
              <input
                ref={dateRef}
                type="date"
                className="cc-date-native"
                aria-label={hourly ? "Ngày" : "Ngày nhận"}
                min={DAYS[0].date}
                value={f.date}
                onFocus={() => setDateFocus(true)}
                onBlur={() => setDateFocus(false)}
                onClick={(e) => e.currentTarget.showPicker?.()}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>
          </Field>
          <Field label={hourly ? "Số giờ" : "Số đêm"}>
            <div
              style={{
                height: 48,
                border: "1px solid var(--bn-hairline)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontFamily: "var(--bn-mono)",
                fontSize: 15,
                whiteSpace: "nowrap",
              }}
            >
              <Step label={hourly ? "Bớt một giờ" : "Bớt một đêm"} onClick={() => set(hourly ? "hours" : "nights", Math.max(hourly ? 2 : 1, (hourly ? f.hours : f.nights) - 1))}>
                −
              </Step>
              <span aria-live="polite">{hourly ? f.hours : f.nights}</span>
              <Step label={hourly ? "Thêm một giờ" : "Thêm một đêm"} onClick={() => set(hourly ? "hours" : "nights", Math.min(hourly ? 12 : 14, (hourly ? f.hours : f.nights) + 1))}>
                +
              </Step>
            </div>
          </Field>
        </div>

        {/* Phone gets the wider column so its long placeholder fits (as drawn: 192 / 260). */}
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(0,192fr) minmax(0,260fr)", gap: 10 }}>
          <Field label="Tên">
            <input className="cc-input" value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Số điện thoại">
            <input
              className="cc-input"
              type="tel"
              inputMode="tel"
              value={f.phone}
              placeholder="Để Bonia xác minh khi khách gọi"
              onChange={(e) => set("phone", e.target.value)}
              style={{ fontFamily: f.phone ? "var(--bn-mono)" : "var(--bn-sans)" }}
            />
          </Field>
        </div>

        <Field label="Nguồn">
          <div role="group" aria-label="Nguồn" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {BOOKING_SOURCES.map((s) => (
              <button key={s} type="button" className="cc-chip" aria-pressed={f.source === s} onClick={() => set("source", f.source === s ? "" : s)}>
                {s}
              </button>
            ))}
          </div>
        </Field>

        <div style={{ fontSize: 13, color: "var(--bn-muted)" }}>{hint}</div>
      </div>

      <div
        style={{
          padding: "14px 28px",
          borderTop: "1px solid var(--bn-hairline)",
          background: "var(--bn-cream-3)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flex: "none",
        }}
      >
        <span style={{ fontSize: 13.5, color: "var(--bn-ink-2)" }}>{ready ? "Chưa lưu" : "Chọn loại phòng và ngày"}</span>
        <Button size="md" disabled={!ready} onClick={save} style={{ padding: "0 28px", flex: "none" }}>
          Lưu
        </Button>
      </div>
    </SideSheet>
  );
}

function blank(init) {
  const initial = init || {};
  return {
    roomType: initial.roomType || "",
    mode: initial.mode || "theo-ngay",
    date: initial.date || "",
    nights: initial.nights || 1,
    hours: 2,
    name: initial.name || "",
    phone: initial.phone || "",
    source: initial.source || "",
  };
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
      <label style={fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

function Step({ children, onClick, label }) {
  return (
    // Glyphs sit 12px in from the edges as drawn; the padding is the hit area.
    <button type="button" aria-label={label} onClick={onClick} style={{ padding: "0 12px", minWidth: 33, height: 46 }}>
      {children}
    </button>
  );
}
