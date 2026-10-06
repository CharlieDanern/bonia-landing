// Hôm nay (handoff 14, founder 2026-10-06): one note that changes today for
// Bonia ("tối nay hết phòng"). Bonia reads it back before it is saved; a note
// for today ends at 23:59 in Việt Nam, a kept one stays until deleted. The
// backend applies the same rule (bonia-backend services/reception-web.ts
// liveNote), so a page left open overnight shows the note gone too.

const VN_OFFSET_MS = 7 * 3600_000;
const WEEKDAYS = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

/** Today's date in Việt Nam, YYYY-MM-DD. */
export const vnDate = (now = Date.now()) => new Date(now + VN_OFFSET_MS).toISOString().slice(0, 10);

/** "Thứ Ba 6/10" (on screen; Bonia's prompts spell dates out). */
export function dayLabel(now = Date.now()) {
  const d = new Date(now + VN_OFFSET_MS);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

/** Lịch sử's day headings for a real account: Hôm nay, Hôm qua, then "Thứ Ba 6/10" (n days back). */
export const dayLabels = (n = 8, now = Date.now()) => Array.from({ length: n }, (_, i) => (i === 0 ? "Hôm nay" : i === 1 ? "Hôm qua" : dayLabel(now - i * 86_400_000)));

/** Whole days between a YYYY-MM-DD (Việt Nam) and today. */
export const daysAgo = (date, now = Date.now()) => Math.round((Date.parse(`${vnDate(now)}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000);

/** The note in force now, or null. */
export function liveNote(n, now = Date.now()) {
  if (!n || typeof n.text !== "string" || !n.text.trim()) return null;
  if (n.until !== "keep" && n.date !== vnDate(now)) return null;
  return n;
}

/** The chips (lab-tested before they ship, founder 2026-10-06). */
export const todayChips = (sector) => ["Hôm nay nghỉ", "Đóng cửa sớm lúc …", sector === "other" ? "Hết chỗ tối nay" : "Hết phòng tối nay"];

/** The demo's read-back (no model): a chip left with its "…" is unclear, anything else is said back. */
export function demoReadback(text, until, now = Date.now()) {
  const t = text.trim().replace(/\s+/g, " ");
  if (/…|\.\.\./.test(t)) return { clear: false, instruction: "", unclear: "Ghi chú còn chỗ trống (…). Điền vào cho rõ, ví dụ giờ đóng cửa." };
  if (t.length < 4) return { clear: false, instruction: "", unclear: "Ghi chú ngắn quá, Bonia chưa hiểu cần làm gì." };
  const d = new Date(now + VN_OFFSET_MS);
  const day = `${WEEKDAYS[d.getUTCDay()].replace(/^Thứ/, "thứ")}, ngày ${d.getUTCDate()} tháng ${d.getUTCMonth() + 1}`;
  const lead = until === "keep" ? `Từ ${day}` : `Hôm nay, ${day}`;
  return { clear: true, instruction: `${lead}, Bonia sẽ báo khách: “${t.replace(/[.。]+$/, "")}”; những điều khác vẫn như cũ.`, unclear: "" };
}
