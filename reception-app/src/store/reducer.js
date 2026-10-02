// One reducer for the whole demo. No backend: every action edits sample
// data in memory, and a reload starts from the frames' state again.
//
// Rules the reducer enforces (README "Interactions"):
// - Confirming writes the hotel's decision: Chờ cọc if the hotel takes
//   deposits, else Đã xác nhận; booked nights are subtracted from the
//   calendar. Bonia never changes Chờ cọc → Đã xác nhận on its own.
// - Opening the SMS app is not "sent": only markMessaged sets the flag.
// - Conflicts are never auto-resolved (see selectors).

import { HOTEL, LINE, MINUTES, TODAY_STATS, ARRIVALS, DEVICES, KNOWLEDGE } from "../data/hotel.js";
import { REQUESTS } from "../data/requests.js";
import { ROOM_TYPE_BY_ID, BOOKINGS, CALENDAR_META, buildCalendar } from "../data/calendar.js";
import { CALLS, REPORTS } from "../data/calls.js";
import { STAFF, STAFF_BY_ID } from "../data/staff.js";
import {
  SECTIONS,
  S01,
  S02,
  S03,
  S04_TASKS,
  S05,
  S06,
  S07,
  SWITCHES,
  TEMP_NOTICE,
  S09,
  S10,
  S11,
  ACTIVITY,
} from "../data/settings.js";
import { PLAN, INVOICE, PAYMENT_HISTORY, BILLING_INFO, BANK, TRIAL } from "../data/billing.js";
import { nowHHMM, weekdayShort } from "../lib/clock.js";

const clone = (v) => JSON.parse(JSON.stringify(v));

export function initialState() {
  return {
    hotel: clone(HOTEL),
    line: clone(LINE),
    minutes: clone(MINUTES),
    todayStats: clone(TODAY_STATS),
    arrivals: clone(ARRIVALS),
    knowledge: clone(KNOWLEDGE),
    device: DEVICES.find((d) => d.current)?.name || "Máy tính quầy",
    devices: clone(DEVICES),
    requests: clone(REQUESTS),
    // Which request the "Bạn đã gửi tin cho khách chưa?" bar is asking about.
    askSentFor: null,
    calendar: buildCalendar(),
    calendarMeta: clone(CALENDAR_META),
    bookings: clone(BOOKINGS),
    calls: clone(CALLS),
    reports: clone(REPORTS),
    staff: clone(STAFF),
    switches: Object.fromEntries(SWITCHES.map((s) => [s.id, s.on])),
    tempNotice: clone(TEMP_NOTICE),
    sections: clone(SECTIONS),
    settings: {
      "01": clone(S01),
      "02": clone(S02),
      "03": clone(S03),
      "04": { tasks: clone(S04_TASKS) },
      "05": clone(S05),
      "06": clone(S06),
      "07": clone(S07),
      "08": { switches: clone(SWITCHES), tempNotice: clone(TEMP_NOTICE) },
      "09": clone(S09),
      "10": clone(S10),
      "11": clone(S11),
    },
    activity: ACTIVITY.filter((a) => !a.later).map(({ later, ...a }) => a),
    billing: {
      plan: clone(PLAN),
      invoice: clone(INVOICE),
      history: clone(PAYMENT_HISTORY),
      info: clone(BILLING_INFO),
      bank: clone(BANK),
      trial: clone(TRIAL),
    },
  };
}

// ── helpers ───────────────────────────────────────────────────────────

function updateRequest(state, id, fn) {
  return { ...state, requests: state.requests.map((r) => (r.id === id ? fn(r) : r)) };
}

function log(state, action) {
  return { ...state, activity: [{ t: nowHHMM(), d: state.device, a: action }, ...state.activity] };
}

function pushHistory(r, device, a) {
  return { ...r, history: [...(r.history || []), { t: nowHHMM(), d: device, a }] };
}

/** Add `delta` booked rooms for each night; returns [calendar, "Deluxe T6, T7: 1 → 0"]. */
function bookNights(calendar, roomType, nights, delta) {
  const cal = { ...calendar };
  const before = [];
  const after = [];
  for (const date of nights) {
    const cell = cal[date]?.[roomType];
    if (!cell) continue;
    const b = cell.total - cell.booked;
    const next = { ...cell, booked: cell.booked + delta };
    cal[date] = { ...cal[date], [roomType]: next };
    before.push(b);
    after.push(next.total - next.booked);
  }
  const name = ROOM_TYPE_BY_ID[roomType]?.name || roomType;
  const days = nights.filter((d) => cal[d]).map(weekdayShort).join(", ");
  const same = before.every((v) => v === before[0]) && after.every((v) => v === after[0]);
  const change = same ? `${before[0]} → ${after[0]}` : before.map((b, i) => `${b} → ${after[i]}`).join(", ");
  return [cal, nights.length ? `Lịch phòng ${name} ${days}: ${change}` : ""];
}

const STAFF_SHORT = (id) => STAFF_BY_ID[id]?.short || id;

// ── reducer ───────────────────────────────────────────────────────────

export function reducer(state, action) {
  const dev = state.device;
  switch (action.type) {
    // Request decisions ------------------------------------------------
    case "CONFIRM_REQUEST": {
      const r = state.requests.find((x) => x.id === action.id);
      if (!r || r.status !== "moi") return state;
      const isStay = r.type === "dat-phong" && r.sellMode !== "theo-gio";
      const deposit = isStay && state.hotel.takesDeposit;
      const status = deposit ? "cho-coc" : "da-xac-nhan";
      let calendar = state.calendar;
      let calNote = "";
      if ((r.type === "dat-phong" || r.type === "doi-huy") && r.nights?.length) {
        [calendar, calNote] = bookNights(calendar, r.roomType, r.nights, 1);
      }
      const decision = deposit
        ? `Xác nhận · chờ cọc ${r.deposit?.nights || 1} đêm`
        : "Xác nhận";
      let next = updateRequest({ ...state, calendar }, r.id, (x) =>
        pushHistory({ ...x, status, confirmedAt: nowHHMM(), confirmedBy: dev }, dev, [decision, calNote].filter(Boolean).join(" · "))
      );
      next = log(next, `${decision.split(" · ")[0]}${deposit ? " · chờ cọc" : ""} · ${r.guestShort || `phòng ${r.room}`}`);
      return next;
    }
    case "REJECT_REQUEST": {
      const r = state.requests.find((x) => x.id === action.id);
      if (!r) return state;
      const why = action.reason ? ` · ${action.reason}` : "";
      return log(
        updateRequest(state, r.id, (x) => pushHistory({ ...x, status: "da-tu-choi" }, dev, `Từ chối${why}`)),
        `Từ chối · ${r.guestShort || `phòng ${r.room}`}`
      );
    }
    case "DEPOSIT_RECEIVED": {
      // Owner only, never Bonia.
      const r = state.requests.find((x) => x.id === action.id);
      if (!r || r.status !== "cho-coc") return state;
      return log(
        updateRequest(state, r.id, (x) =>
          pushHistory({ ...x, status: "da-xac-nhan", deposit: { ...x.deposit, received: true } }, dev, "Đã nhận cọc")
        ),
        `Đánh dấu đã nhận cọc · ${r.guestShort}`
      );
    }

    // Messages (SMS from the hotel's phone) -----------------------------
    case "MESSAGE_OPENED": {
      const via = action.via === "qr" ? "Mở tin nhắn (mã QR)" : "Mở tin nhắn";
      return { ...updateRequest(state, action.id, (x) => pushHistory(x, dev, via)), askSentFor: action.id };
    }
    case "MARK_MESSAGED": {
      const r = state.requests.find((x) => x.id === action.id);
      if (!r) return state;
      const at = action.at || nowHHMM();
      return log(
        {
          ...updateRequest(state, r.id, (x) => pushHistory({ ...x, messagedAt: at }, dev, "Đã nhắn khách")),
          askSentFor: null,
        },
        `Đã nhắn khách · ${r.guestShort}`
      );
    }
    case "MARK_NOT_MESSAGED":
      // "Chưa": keep Chưa nhắn khách, stop asking.
      return { ...state, askSentFor: null };

    // Staff tasks ------------------------------------------------------
    case "ASSIGN_STAFF": {
      const r = state.requests.find((x) => x.id === action.id);
      if (!r) return state;
      const status = r.type === "quen-do" ? "dang-tim" : "da-giao";
      const who = STAFF_SHORT(action.staffId);
      return log(
        updateRequest(state, r.id, (x) =>
          pushHistory({ ...x, status, assignee: action.staffId, seenAt: null }, dev, `Giao cho ${who}`)
        ),
        `Giao cho ${who} · ${r.type === "quen-do" ? `quên đồ phòng ${r.room}` : `phòng ${r.room}`}`
      );
    }
    case "TASK_SEEN":
      return updateRequest(state, action.id, (x) =>
        pushHistory({ ...x, seenAt: action.at || nowHHMM() }, STAFF_BY_ID[x.assignee]?.name || "Người nhận", "Đã xem việc")
      );
    case "TASK_DONE": {
      const r = state.requests.find((x) => x.id === action.id);
      if (!r) return state;
      const by = action.by || dev;
      return log(
        updateRequest(state, r.id, (x) => pushHistory({ ...x, status: "xong", overdue: false, doneAt: nowHHMM() }, by, "Xong")),
        `Xong · phòng ${r.room} · ${String(r.task || "").toLowerCase()}`
      );
    }
    case "LOST_ITEM_STEP": {
      // moi → dang-tim → tim-thay | khong-thay → da-tra-khach
      const labels = {
        "dang-tim": "Đang tìm",
        "tim-thay": "Tìm thấy",
        "khong-thay": "Không thấy",
        "da-tra-khach": "Đã trả khách",
      };
      if (!labels[action.step]) return state;
      return updateRequest(state, action.id, (x) => pushHistory({ ...x, status: action.step }, dev, labels[action.step]));
    }

    // Hôm nay switches -------------------------------------------------
    case "SET_SWITCH": {
      const on = action.on ?? !state.switches[action.id];
      const sw = state.settings["08"].switches.find((s) => s.id === action.id);
      const next = { ...state, switches: { ...state.switches, [action.id]: on } };
      return sw ? log(next, `${on ? "Bật" : "Tắt"} “${sw.label}”`) : next;
    }
    case "SET_LISTENING": {
      const on = action.on ?? !state.line.listening;
      return log(
        { ...state, line: { ...state.line, listening: on, status: on ? "ok" : "off" } },
        on ? "Bật Bonia nghe máy" : "Tắt Bonia nghe máy"
      );
    }
    case "SET_TEMP_NOTICE":
      return log({ ...state, tempNotice: { ...state.tempNotice, ...action.notice } }, "Sửa dòng thông báo tạm");
    case "SET_LINE_STATUS":
      return { ...state, line: { ...state.line, status: action.status } };

    // Calendar --------------------------------------------------------
    case "ADD_BOOKING": {
      const { roomType, nights = [], name = "", phone = "", source = "", sellMode = "theo-ngay" } = action.booking;
      const [calendar] = bookNights(state.calendar, roomType, nights, 1);
      const id = `b-${Date.now()}`;
      const booking = { id, name, phone, roomType, nights, from: nights[0], source, sellMode };
      const label = ["Thêm đặt phòng", name || ROOM_TYPE_BY_ID[roomType]?.name, source].filter(Boolean).join(" · ");
      return log(
        { ...state, calendar, bookings: [...state.bookings, booking], calendarMeta: { ...state.calendarMeta, updatedAt: nowHHMM() } },
        label
      );
    }
    case "SET_REMAINING": {
      const { date, roomType, remaining } = action;
      const cell = state.calendar[date]?.[roomType];
      if (!cell) return state;
      const before = cell.total - cell.booked;
      const next = { ...cell, booked: cell.total - remaining, manual: true };
      const calendar = { ...state.calendar, [date]: { ...state.calendar[date], [roomType]: next } };
      return log(
        { ...state, calendar, calendarMeta: { ...state.calendarMeta, updatedAt: nowHHMM() } },
        `Lịch phòng ${ROOM_TYPE_BY_ID[roomType]?.name} ${weekdayShort(date)}: ${before} → ${remaining}`
      );
    }
    case "SET_CLOSED": {
      const { date, roomType, closed, reason = "" } = action;
      const cell = state.calendar[date]?.[roomType];
      if (!cell) return state;
      const calendar = {
        ...state.calendar,
        [date]: { ...state.calendar[date], [roomType]: { ...cell, closed, closedReason: closed ? reason : "" } },
      };
      return log(
        { ...state, calendar, calendarMeta: { ...state.calendarMeta, updatedAt: nowHHMM() } },
        `${closed ? "Đóng" : "Mở lại"} ${ROOM_TYPE_BY_ID[roomType]?.name} ${weekdayShort(date)}`
      );
    }
    case "CALENDAR_STILL_RIGHT":
      // "Lịch vẫn đúng": clears the stale warning.
      return { ...state, calendarMeta: { ...state.calendarMeta, updatedAt: nowHHMM() }, line: { ...state.line, calendarUpdated: nowHHMM() } };

    // Calls -----------------------------------------------------------
    case "REPORT_CALL": {
      const call = state.calls.find((c) => c.id === action.callId);
      if (!call) return state;
      const at = nowHHMM();
      const report = {
        id: `r-${call.id}`,
        callId: call.id,
        callLabel: `${call.who} · hôm nay ${call.time}`,
        reason: action.reason,
        note: action.note || "",
        sentAt: at,
        status: "dang-xem",
      };
      return {
        ...state,
        calls: state.calls.map((c) => (c.id === call.id ? { ...c, reported: { at, reason: action.reason } } : c)),
        reports: [report, ...state.reports.filter((r) => r.id !== report.id)],
      };
    }

    // Settings --------------------------------------------------------
    case "SAVE_SETTINGS": {
      const { section, values } = action;
      const settings = { ...state.settings, [section]: { ...state.settings[section], ...values } };
      const title = state.sections.find((s) => s.n === section)?.title || section;
      let next = { ...state, settings };
      if (section === "08" && values.switches) {
        next.switches = Object.fromEntries(values.switches.map((s) => [s.id, s.on]));
      }
      if (section === "08" && values.tempNotice) next.tempNotice = values.tempNotice;
      if (action.mark) {
        next.sections = state.sections.map((s) => (s.n === section ? { ...s, mark: action.mark } : s));
      }
      return log(next, `Lưu § ${section} · ${title}`);
    }
    case "SET_SECTION_MARK":
      return { ...state, sections: state.sections.map((s) => (s.n === action.section ? { ...s, mark: action.mark } : s)) };

    // Account ---------------------------------------------------------
    case "SET_DEVICE_NAME": {
      const devices = state.devices.map((d) => (d.current ? { ...d, name: action.name } : d));
      return { ...state, device: action.name, devices };
    }
    case "SIGN_OUT_DEVICE":
      return log({ ...state, devices: state.devices.filter((d) => d.id !== action.id) }, "Đăng xuất một máy");

    case "RESET":
      return initialState();

    default:
      return state;
  }
}
