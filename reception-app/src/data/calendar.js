// Lịch phòng: 14 days × 5 room types, as in frame 3.4 A.
// Owner: calendar-calls.
//
// Remaining = total − confirmed bookings − closed. Pending requests never
// subtract; they only flag ⚠ when pending > remaining (computed in the
// store from requests[].nights, not stored here).

import { DEMO_DATE, addDays, dayMonth, isWeekendNight, weekdayShort } from "../lib/clock.js";

export const ROOM_TYPES = [
  { id: "tieu-chuan", name: "Tiêu chuẩn", fullName: "Tiêu chuẩn (không cửa sổ)", total: 4 },
  { id: "superior", name: "Superior", fullName: "Superior (cửa sổ)", total: 4 },
  { id: "superior-2", name: "Superior 2 giường", fullName: "Superior 2 giường (cửa sổ)", total: 2 },
  { id: "deluxe", name: "Deluxe", fullName: "Deluxe ban công hướng phố", total: 2 },
  { id: "gia-dinh", name: "Gia đình", fullName: "Gia đình", total: 2 },
];

export const ROOM_TYPE_BY_ID = Object.fromEntries(ROOM_TYPES.map((t) => [t.id, t]));
export const TOTAL_ROOMS = ROOM_TYPES.reduce((n, t) => n + t.total, 0); // 14

// 8/10 → 21/10. Today header is inverted; T6/T7 headers are cream (weekend nights).
export const DAYS = Array.from({ length: 14 }, (_, i) => {
  const date = addDays(DEMO_DATE, i);
  return { date, w: weekdayShort(date), d: dayMonth(date), today: i === 0, weekend: isWeekendNight(date) };
});

// Remaining rooms per day, straight from the frame. "x" = closed that day.
const REMAINING = {
  "tieu-chuan": [1, 2, 1, 2, 3, 3, 4, 3, 2, 1, 2, 3, 4, 4],
  superior: [2, 1, 0, 3, 4, 3, 3, 2, 1, 0, 2, 3, 4, 3],
  "superior-2": [0, 1, 0, 2, 2, 2, 1, 1, 0, 0, 1, 2, 2, 2],
  deluxe: [0, 1, 1, 2, 2, 1, 2, 1, 0, 0, 1, 2, 2, 2],
  "gia-dinh": [0, 0, 1, 2, 2, 2, "x", 2, 1, 0, 1, 2, 2, 2],
};

const CLOSED_REASON = { "gia-dinh": "SỬA PHÒNG" };
// Cells the owner edited by hand (tag ĐÃ CHỈNH TAY).
const MANUAL = [{ roomType: "superior", date: addDays(DEMO_DATE, 4) }];

/** calendar[date][roomType] = { total, booked, closed, closedReason, manual } */
export function buildCalendar() {
  const cal = {};
  for (const day of DAYS) cal[day.date] = {};
  ROOM_TYPES.forEach((t) => {
    REMAINING[t.id].forEach((v, i) => {
      const date = DAYS[i].date;
      const closed = v === "x";
      cal[date][t.id] = {
        total: t.total,
        booked: closed ? 0 : t.total - v,
        closed,
        closedReason: closed ? CLOSED_REASON[t.id] || "" : "",
        manual: MANUAL.some((m) => m.roomType === t.id && m.date === date),
      };
    });
  });
  return cal;
}

// Confirmed bookings Bonia knows about (cell sheet 3.4 B lists them).
export const BOOKINGS = [
  {
    id: "tanaka",
    name: "Mr. Tanaka",
    roomType: "deluxe",
    from: "2026-10-08",
    to: "2026-10-10",
    source: "AGODA",
    sellMode: "theo-ngay",
  },
];

// "Lịch phòng cập nhật lúc 14:05"
export const CALENDAR_META = {
  updatedAt: "14:05",
  staleSince: "hôm qua 08:10",
  staleAfterHours: 24,
};

// Thêm đặt phòng sheet (3.4 C).
export const BOOKING_SOURCES = ["Vãng lai", "Booking.com", "Agoda", "Gọi điện", "Khác"];
export const SELL_MODES = [
  { id: "theo-ngay", label: "Theo ngày" },
  { id: "qua-dem", label: "Qua đêm" },
  { id: "theo-gio", label: "Theo giờ" },
];

// Cell sheet title (3.4 B: "Deluxe ban công"); others use the short name.
export const SHEET_NAMES = { deluxe: "Deluxe ban công" };

// "Đóng loại phòng này hôm đó": reason shown as the cell tag ("SỬA PHÒNG").
export const CLOSE_REASONS = ["Sửa phòng", "Giữ cho đoàn", "Khác"];
