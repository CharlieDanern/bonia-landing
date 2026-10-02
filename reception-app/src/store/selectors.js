// Derived values. Everything the frames show as a consequence of other
// data (⚠ conflicts, "Còn 3 / 14 phòng", sidebar counts, pills) is computed
// here so a single action updates every screen at once.

import { DEMO_DATE } from "../lib/clock.js";
import { ROOM_TYPES, TOTAL_ROOMS } from "../data/calendar.js";
import { STATUS_GROUPS } from "../data/requests.js";

// ── Calendar ─────────────────────────────────────────────────────────

/** Rooms left for a night: total − booked − closed. "Hết phòng tối nay" forces 0 tonight. */
export function remaining(state, date, roomType) {
  const cell = state.calendar[date]?.[roomType];
  if (!cell || cell.closed) return 0;
  if (date === DEMO_DATE && state.switches["het-phong-toi-nay"]) return 0;
  return cell.total - cell.booked;
}

/** Pending (unconfirmed) requests holding a night. They never subtract. */
export function pendingFor(state, date, roomType) {
  return state.requests.filter(
    (r) => r.status === "moi" && r.roomType === roomType && (r.nights || []).includes(date)
  );
}

/** Everything a calendar cell needs to draw itself. */
export function cellView(state, date, roomType) {
  const cell = state.calendar[date]?.[roomType] || { total: 0, booked: 0 };
  const left = remaining(state, date, roomType);
  const pending = pendingFor(state, date, roomType);
  return {
    total: cell.total,
    remaining: left,
    closed: !!cell.closed,
    closedReason: cell.closedReason || "",
    manual: !!cell.manual,
    pending: pending.length,
    pendingIds: pending.map((r) => r.id),
    conflict: pending.length > 0 && pending.length > left,
  };
}

/** Tonight block on Hôm nay: per type + total ("Còn 3 / 14 phòng"). */
export function tonight(state) {
  const rows = ROOM_TYPES.map((t) => ({ ...t, remaining: remaining(state, DEMO_DATE, t.id) }));
  return { rows, remaining: rows.reduce((n, r) => n + r.remaining, 0), total: TOTAL_ROOMS };
}

// ── Requests ─────────────────────────────────────────────────────────

/** Nights where this pending request competes with more requests than rooms left. */
export function conflictNights(state, r) {
  if (r.status !== "moi" || !r.nights?.length) return [];
  return r.nights.filter((d) => cellView(state, d, r.roomType).conflict);
}

export function hasConflict(state, r) {
  return conflictNights(state, r).length > 0;
}

/** Another request already took the last room: "Có thể đã hết phòng". */
export function mayBeFull(state, r) {
  if (r.status !== "moi" || !r.nights?.length) return false;
  return r.nights.some((d) => remaining(state, d, r.roomType) <= 0);
}

/** Other pending requests fighting for the same nights. */
export function conflictPeers(state, r) {
  const nights = new Set(conflictNights(state, r));
  return state.requests.filter(
    (x) => x.id !== r.id && x.status === "moi" && x.roomType === r.roomType && (x.nights || []).some((d) => nights.has(d))
  );
}

export function statusGroup(status) {
  return Object.keys(STATUS_GROUPS).find((g) => STATUS_GROUPS[g].includes(status)) || "xong";
}

/** Pills in the order the list draws them: GẤP · QUÁ HẠN · ⚠ · type tag · status. */
export function requestPills(state, r) {
  const pills = [];
  if (r.urgent && statusGroup(r.status) !== "xong") pills.push({ kind: "urgent", text: "GẤP" });
  if (r.overdue && statusGroup(r.status) !== "xong") pills.push({ kind: "overdue", text: "QUÁ HẠN" });
  if (hasConflict(state, r)) pills.push({ kind: "conflict", text: "⚠" });
  if (r.listTag && r.status === "moi") pills.push({ kind: "type", text: r.listTag });
  pills.push(statusPill(r.status));
  return pills;
}

const STATUS_PILLS = {
  moi: { kind: "new", text: "MỚI" },
  "cho-coc": { kind: "processing", text: "CHỜ CỌC" },
  "da-giao": { kind: "processing", text: "ĐÃ GIAO" },
  "dang-tim": { kind: "processing", text: "ĐANG TÌM" },
  "tim-thay": { kind: "processing", text: "TÌM THẤY" },
  "da-xac-nhan": { kind: "done", text: "✓ ĐÃ XÁC NHẬN" },
  xong: { kind: "done", text: "✓ XONG" },
  "khong-thay": { kind: "done", text: "KHÔNG THẤY" },
  "da-tra-khach": { kind: "done", text: "✓ ĐÃ TRẢ KHÁCH" },
  "da-tu-choi": { kind: "done", text: "ĐÃ TỪ CHỐI" },
};

export function statusPill(status) {
  return STATUS_PILLS[status] || { kind: "done", text: String(status).toUpperCase() };
}

/** List subline; a messaged booking gains "· Đã nhắn khách 11:20". */
export function listSub(r) {
  return r.messagedAt && r.type === "dat-phong" ? `${r.listSub} · Đã nhắn khách ${r.messagedAt}` : r.listSub;
}

/** Hôm nay subline; contested bookings end with "· ⚠ tranh phòng". */
export function todaySub(state, r) {
  return hasConflict(state, r) ? `${r.todaySub} · ⚠ tranh phòng` : r.todaySub;
}

/** Urgent first, then newest first (the list's "MỚI NHẤT TRƯỚC"). */
export function sortRequests(list) {
  const open = (r) => statusGroup(r.status) !== "xong";
  return [...list].sort((a, b) => {
    const ua = a.urgent && open(a) ? 1 : 0;
    const ub = b.urgent && open(b) ? 1 : 0;
    if (ua !== ub) return ub - ua;
    return 0; // data is already newest-first
  });
}

export function segmentCounts(state) {
  const c = { moi: 0, "dang-xu-ly": 0, xong: 0, all: state.requests.length };
  for (const r of state.requests) c[statusGroup(r.status)] += 1;
  return c;
}

/** Bookings the hotel still has to text ("Chưa nhắn khách · 2"). */
export function notMessaged(state) {
  return state.requests.filter((r) => r.needsMessage && !r.messagedAt && statusGroup(r.status) !== "xong");
}

/** Sidebar "Yêu cầu 7" = new + open urgent ones. */
export function sidebarCounts(state) {
  const n = state.requests.filter(
    (r) => r.status === "moi" || (r.urgent && statusGroup(r.status) === "dang-xu-ly")
  ).length;
  return { "yeu-cau": n ? String(n) : "" };
}

export function newRequests(state) {
  return state.requests.filter((r) => r.status === "moi");
}

export function urgentOpen(state) {
  return state.requests.filter((r) => r.urgent && statusGroup(r.status) !== "xong");
}

/** Hôm nay conflict banner: one entry per contested room type / first night. */
export function conflictsToday(state) {
  const out = [];
  const seen = new Set();
  for (const r of state.requests) {
    for (const d of conflictNights(state, r)) {
      const key = `${r.roomType}|${d}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const v = cellView(state, d, r.roomType);
      out.push({ roomType: r.roomType, date: d, remaining: v.remaining, requestIds: v.pendingIds });
    }
  }
  // Keep the first night per room type (frames show "(T6 9/10)").
  const byType = new Map();
  for (const c of out) if (!byType.has(c.roomType)) byType.set(c.roomType, c);
  return [...byType.values()];
}

// ── Settings ─────────────────────────────────────────────────────────

/** Section marks for the Settings Nav ({ "02": "review", … }). */
export function sectionMarks(state) {
  return Object.fromEntries(state.sections.map((s) => [s.n, s.mark]));
}
