// Demo clock. Every screen lives on Thứ Năm 8/10/2026, 14:20 (ICT).
// nowHHMM() advances from 14:20 with real time since page load, so actions
// taken in a demo get believable timestamps ("14:24") without a backend.

export const DEMO_DATE = "2026-10-08"; // today, ISO
export const DEMO_TIME = "14:20";
export const DEMO_LABEL = "Thứ Năm 8/10 · 14:20";
export const DEMO_LABEL_SHORT = "THỨ NĂM 8/10"; // Trực tiếp header: demo date, real clock

const START_MIN = 14 * 60 + 20;
const loadedAt = Date.now();

export function nowMinutes() {
  return START_MIN + Math.floor((Date.now() - loadedAt) / 60000);
}

export function nowHHMM() {
  const m = nowMinutes() % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const WEEKDAY_LONG = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

/** "2026-10-09" → Date at local noon (avoids TZ edge flips). */
export function isoToDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(iso, n) {
  const d = isoToDate(iso);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "2026-10-09" → "T6" */
export function weekdayShort(iso) {
  return WEEKDAY_SHORT[isoToDate(iso).getDay()];
}

/** "2026-10-09" → "Thứ Sáu" */
export function weekdayLong(iso) {
  return WEEKDAY_LONG[isoToDate(iso).getDay()];
}

/** "2026-10-09" → "9/10" */
export function dayMonth(iso) {
  const d = isoToDate(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

/** Hotel weekend = nights of T6 and T7. */
export function isWeekendNight(iso) {
  const wd = isoToDate(iso).getDay();
  return wd === 5 || wd === 6;
}
