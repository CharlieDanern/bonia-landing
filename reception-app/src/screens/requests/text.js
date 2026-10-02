// Words the Yêu cầu screens build from sample data: conflict lines, the
// "hỏi lại một lần" dialog, message-sheet labels and the SMS text itself.
// Everything is derived, so confirming one request updates the others.

import { ROOM_TYPE_BY_ID } from "../../data/calendar.js";
import { HOTEL } from "../../data/hotel.js";
import { addDays, dayMonth, weekdayShort } from "../../lib/clock.js";
import { vnd } from "../../lib/format.js";
import { stripAccents } from "../../lib/sms.js";
import { select } from "../../store/index.jsx";

export const typeName = (id) => ROOM_TYPE_BY_ID[id]?.name || id;
const day = (iso) => `${weekdayShort(iso)} ${dayMonth(iso)}`;
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** "Anh Kevin (14:02) và chị Ngân (13:47)" */
function joinGuests(list) {
  const names = list.map((r, i) => `${i === 0 ? cap(r.guestShort) : r.guestShort} (${r.recordedAt})`);
  if (names.length < 2) return names.join("");
  return `${names.slice(0, -1).join(", ")} và ${names[names.length - 1]}`;
}

/** ⚠ box on a contested booking (3.3 A). null when there is no conflict. */
export function conflictText(state, r) {
  const nights = select.conflictNights(state, r);
  if (!nights.length) return null;
  const first = nights[0];
  const v = select.cellView(state, first, r.roomType);
  const name = typeName(r.roomType);
  const rooms = v.remaining > 0 ? `cho ${v.remaining} phòng ${name} còn lại` : `nhưng ${name} đã hết`;
  const all = [r, ...select.conflictPeers(state, r)];
  const same = all.every((x) => x.nights.join() === r.nights.join());
  const span = same && r.nights.length > 1 ? `cùng ${r.nights.length} đêm từ ${weekdayShort(r.nights[0])}` : `cùng đêm ${weekdayShort(first)}`;
  return {
    title: `⚠ ${v.pending} yêu cầu đang chờ ${rooms} (${day(first)})`,
    body: `${joinGuests(all)}, ${span}. Bonia không chọn thay khách sạn.`,
  };
}

/** The night that ran out, and who took the last room (3.3 E dialog). */
export function fullNight(state, r) {
  const date = (r.nights || []).find((d) => select.remaining(state, d, r.roomType) <= 0);
  if (!date) return null;
  const left = select.remaining(state, date, r.roomType);
  const holder = state.requests.find(
    (x) =>
      x.id !== r.id &&
      x.confirmedAt &&
      x.roomType === r.roomType &&
      (x.status === "cho-coc" || x.status === "da-xac-nhan") &&
      (x.nights || []).includes(date)
  );
  const name = typeName(r.roomType);
  const after = left - 1;
  const minus = after < 0 ? `âm ${-after}` : `còn ${after}`;
  const status = holder?.status === "cho-coc" ? "Chờ cọc" : "Đã xác nhận";
  return {
    date,
    title: `${name} ${day(date)} có thể đã hết.`,
    body: holder
      ? `Phòng ${name} cuối cùng đêm ${weekdayShort(date)} vừa được giữ cho ${holder.guestShort} (${status}, ${holder.confirmedAt} · ${holder.confirmedBy}). Nếu vẫn xác nhận, Lịch phòng sẽ ${minus}.`
      : `Lịch phòng ${name} đêm ${day(date)} đang là ${left}. Nếu vẫn xác nhận, Lịch phòng sẽ ${minus}.`,
  };
}

/** "T6 9/10 → CN 11/10" from the booked nights (check-out = last night + 1). */
export function stayRange(r) {
  if (!r.nights?.length) return r.hoursLabel || "";
  return `${day(r.nights[0])} → ${day(addDays(r.nights[r.nights.length - 1], 1))}`;
}

/** "CN 11/10" or "T6 9/10, T7 10/10" */
export const stayNights = (r) => (r.nights || []).map(day).join(", ");

/** "T6, T7" */
export const nightDays = (r) => (r.nights || []).map(weekdayShort).join(", ");

/** Calendar row once the hotel confirmed in this app: "Deluxe T6, T7: đã trừ 1 phòng". */
export function calendarNote(r) {
  if (!r.nights?.length) return `Hiện là ${r.hourly?.from}–${r.hourly?.to} · ${typeName(r.roomType)} · không trừ phòng đêm nay`;
  return `${typeName(r.roomType)} ${nightDays(r)}: đã trừ 1 phòng`;
}

/** Step 1 of the message sheet: what was written ("Chờ cọc 1 đêm · Lịch phòng Deluxe T6, T7 trừ 1"). */
export function decisionLine(r) {
  const head = r.status === "cho-coc" ? `Chờ cọc ${r.deposit?.nights || 1} đêm` : "Đã xác nhận";
  if (!r.nights?.length) return `${head} · không trừ phòng đêm nay`;
  return `${head} · Lịch phòng ${typeName(r.roomType)} ${nightDays(r)} trừ 1`;
}

/** Sheet eyebrow: "ANH KEVIN · DELUXE · T6 9/10 → CN 11/10" */
export function sheetEyebrow(r) {
  return [r.guest, r.roomType && typeName(r.roomType), stayRange(r)].filter(Boolean).join(" · ").toUpperCase();
}

// ── SMS text ────────────────────────────────────────────────────────────

function fill(tpl, values) {
  return tpl.replace(/\[([^\]]+)\]/g, (m, k) => values[k] ?? m);
}

/** Message sent from the counter phone, always không dấu (GSM, 160 chars). */
export function smsText(state, r) {
  if (r.sms?.text) return toGsm(r.sms.text);
  const tpl = state.settings["09"]?.templates?.find((t) => t.id === "xac-nhan");
  const en = r.lang === "en";
  const guestName = (r.guestShort || "").replace(/^(anh|chị|chi|cô|chú)\s+/i, "");
  if (r.hourly) {
    // Hourly stays: neutral wording, never "theo giờ".
    return toGsm(
      `${HOTEL.smsNameVi}: Chào ${r.guestShort}, khách sạn xác nhận phòng ${typeName(r.roomType)} hôm nay ${r.hourly.from}-${r.hourly.to}, tổng ${vnd(r.total)}.`
    );
  }
  if (r.nights?.length && tpl) {
    const values = en
      ? {
          "Hotel short name": HOTEL.smsName,
          "Guest name": guestName,
          "Room type": typeName(r.roomType),
          "Check-in": dayMonth(r.nights[0]),
          Nights: String(r.nights.length),
          Total: `${vnd(r.total).replace(/\./g, ",").replace("đ", "")} VND`,
        }
      : {
          "Tên ngắn khách sạn": HOTEL.smsNameVi,
          "Tên khách": r.guestShort,
          "Loại phòng": typeName(r.roomType),
          "Ngày nhận": dayMonth(r.nights[0]),
          "Số đêm": String(r.nights.length),
          "Tổng tiền": vnd(r.total),
        };
    return toGsm(fill(en ? tpl.en : tpl.vi, values));
  }
  if (r.service) {
    return toGsm(
      en
        ? `${HOTEL.smsName}: Dear ${guestName}, we confirm your request: ${stripAccents(r.service)}, total ${vnd(r.total)}.`
        : `${HOTEL.smsNameVi}: Chào ${r.guestShort}, khách sạn xác nhận ${r.service}, tổng ${vnd(r.total)}.`
    );
  }
  return toGsm(`${HOTEL.smsNameVi}: Chào ${r.guestShort || "anh/chị"}, khách sạn đã nhận yêu cầu của mình.`);
}

/** Strip accents and the few non-GSM characters our sentences use. */
export function toGsm(s) {
  return stripAccents(s).replace(/[–—]/g, "-").replace(/→/g, "-").replace(/[“”]/g, '"');
}

export const smsLangLabel = (r) => `Tin nhắn · ${r.lang === "en" ? "Tiếng Anh" : "Tiếng Việt"} · không dấu`;
