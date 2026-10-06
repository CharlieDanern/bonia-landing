// The confirmation SMS (founder 2026-10-06): after a booking, change or cancellation the app writes it from the
// owner's choices (Cài đặt → Tin nhắn xác nhận); the owner sends it from their own phone, never Bonia. The backend
// builds the real one (bonia-backend services/reception-web.ts composeSms, same rules and test texts); this copy
// draws the preview in Cài đặt.

export const SMS_PARTS = [["guest", "Tên khách"], ["room", "Loại phòng"], ["date", "Ngày nhận phòng"], ["nights", "Số đêm"], ["people", "Số người"], ["price", "Giá mỗi đêm"], ["total", "Tổng tiền"]];
export const SMS_DEFAULT = { opening: "", parts: ["guest", "room", "date", "nights", "people", "price"], extra: "", thanks: true };

const HONORIFICS = ["anh", "chị", "em", "cô", "chú", "bác", "ông", "bà"];
const DOW_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const ROOM_WORD = /^(phòng|bungalow|villa|căn|suite|studio|dorm|giường|nhà)/i;
const groupVnd = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}đ`;
/** "T6 9/10" */
export const smsDay = (iso) => { const d = new Date(`${iso}T12:00:00Z`); return `${DOW_SHORT[d.getUTCDay()]} ${d.getUTCDate()}/${d.getUTCMonth() + 1}`; };

/** The SMS for a booking ({ action, room, checkin, nights, adults, children, price_per_night, total }). */
export function composeSms(cfg, b, { hotel, customerName }) {
  if (!b) return null;
  const c = { ...SMS_DEFAULT, ...(cfg || {}) };
  const on = new Set(Array.isArray(c.parts) ? c.parts : SMS_DEFAULT.parts);
  const opening = (c.opening || "").trim() || `${hotel || "Bên em"} xác nhận:`;
  const items = [];
  const name = (customerName || "").trim();
  if (on.has("guest") && name && !HONORIFICS.includes(name.toLowerCase())) items.push(name);
  const room = b.room ? (ROOM_WORD.test(b.room) ? b.room : `phòng ${b.room}`) : null;
  if (b.action === "cancel") {
    items.push(`đã hủy đặt phòng${on.has("room") && room ? ` ${room.replace(/^phòng\s+/i, "")}` : ""}${on.has("date") && b.checkin ? ` ngày ${smsDay(b.checkin)}` : ""}`);
  } else {
    if (on.has("room") && room) items.push(b.action === "change" ? `đổi sang ${room}` : room);
    if (on.has("date") && b.checkin) items.push(`nhận phòng ${smsDay(b.checkin)}`);
    if (on.has("nights") && b.nights) items.push(`${b.nights} đêm`);
    if (on.has("people") && b.adults) items.push(`${b.adults} người lớn${b.children ? ` + ${b.children}` : ""}`);
  }
  const sentences = [`${`${opening} ${items.join(", ")}`.trim().replace(/[,:]$/, "")}.`];
  if (b.action !== "cancel" && on.has("price") && b.price_per_night) sentences.push(`Giá ${groupVnd(b.price_per_night)}/đêm.`);
  if (b.action !== "cancel" && on.has("total") && b.total) sentences.push(`Tổng ${groupVnd(b.total)}.`);
  if (c.extra && c.extra.trim()) sentences.push(c.extra.trim().replace(/([^.!?…])$/, "$1."));
  if (c.thanks !== false) {
    const first = name.split(/\s+/)[0]?.toLowerCase();
    sentences.push(`Cảm ơn ${HONORIFICS.includes(first) ? first : "quý khách"}!`);
  }
  return sentences.join(" ");
}

/** The preview's booking: the hotel's first room and its price, next Friday, 2 nights, 2 adults and a child. */
export function sampleBooking(rooms, now = Date.now()) {
  const r = (rooms || []).find((x) => x?.name) || null;
  const d = new Date(now + 7 * 3600e3);
  const ahead = ((5 - d.getUTCDay() + 7) % 7) || 7;
  const fri = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + ahead));
  const price = Number(String(r?.daily?.wd ?? "").replace(/\D/g, "")) || null;
  return { action: "book", room: r?.name || "Deluxe ban công", checkin: fri.toISOString().slice(0, 10), nights: 2, adults: 2, children: "1 bé 5 tuổi", price_per_night: price || 850000, total: (price || 850000) * 2 };
}
