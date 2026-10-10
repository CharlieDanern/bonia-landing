import React from "react";
import { holidaysOf } from "../data/vnHolidays.js";
import { MONO } from "../ui.js";
import { FOLLOW_UP } from "./common.jsx";

// Gọi ra's shared bits (handoff 16 + update 17): campaign status, "Cách gọi" in words, the estimate, the calling
// hours, masked numbers, and the result boxes' colours.

export const fmt = (n) => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
export const pct = (a, b) => (b ? `${((a / b) * 100).toFixed(1).replace(".", ",")}%` : "");

/** "0900 000 181" from any form of a Vietnamese number. */
export function spaced(p) {
  const d = String(p || "").replace(/\D/g, "");
  const l = d.startsWith("84") ? `0${d.slice(2)}` : d;
  return /^0\d{9}$/.test(l) ? `${l.slice(0, 4)} ${l.slice(4, 7)} ${l.slice(7)}` : String(p || "");
}
/** "0900 ••• 181" until Hiện số. */
export const masked = (p) => { const s = spaced(p); return s.length >= 10 ? `${s.slice(0, 4)} ••• ${s.slice(-3)}` : s; };

/** "1:05" from seconds. */
export const mmss = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, "0")}`;

export const STATUS = {
  draft: ["NHÁP", "#6E6255", "#C9BCA5", true],
  scheduled: ["LÊN LỊCH", "#7B4A2D", "#D9C3AE"],
  running: ["ĐANG GỌI", "#4A6B3A", "#4A6B3A"],
  paused: ["TẠM DỪNG", "#4A4239", "#D9D0BF"],
  stopped: ["ĐÃ DỪNG", "#4A4239", "#D9D0BF"],
  done: ["ĐÃ XONG", "#4A6B3A", "#C9D8BF"],
};

/** The campaign's status tag; a running one has a blinking dot. */
export function StatusPill({ status, blink = 1 }) {
  const [l, c, b, dashed] = STATUS[status] || STATUS.draft;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.1em", padding: "3px 8px", borderRadius: 9, border: `1px ${dashed ? "dashed" : "solid"} ${b}`, color: c, whiteSpace: "nowrap", lineHeight: 1.2 }}>
      {status === "running" && <span style={{ width: 6, height: 6, borderRadius: 3, background: c, opacity: blink, transition: "opacity 300ms" }} />}
      {l}
    </span>
  );
}

export const DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
export const GAP_LABEL = { "2h": "2 giờ", "4h": "4 giờ", next_day: "hôm sau" };
export const CONCURRENCY = [5, 10, 20, 30, 50];
export const PLAN_MAX = 50;

/** "T2–T7", or "T2, T4, T6" when the days skip. days: 1 = Monday … 7 = Sunday. */
export function daysLabel(days = []) {
  const d = [...days].sort((a, b) => a - b);
  if (!d.length) return "—";
  const run = d.every((x, i) => !i || x === d[i - 1] + 1);
  return run && d.length > 2 ? `${DAYS[d[0] - 1]}–${DAYS[d[d.length - 1] - 1]}` : d.map((x) => DAYS[x - 1]).join(", ");
}
export const windowsLabel = (w = []) => w.map(([a, z]) => `${a}–${z}`).join(", ");
export const retryLabel = (s) => (s.retries ? `${s.retries} lần, cách ${GAP_LABEL[s.retry_gap] || "2 giờ"}` : "Không gọi lại");
const minutes = (hm) => { const [h, m] = hm.split(":").map(Number); return h * 60 + m; };
export const dayMinutes = (w = []) => w.reduce((n, [a, z]) => n + Math.max(0, minutes(z) - minutes(a)), 0);

/** The campaign's line under its name: what, when, and how missed calls are retried. */
export function settingsLine(s) {
  return [windowsLabel(s.windows), s.retries ? `gọi lại ${s.retries} lần sau ${GAP_LABEL[s.retry_gap]}` : "không gọi lại", s.note ? "có dặn thêm" : ""].filter(Boolean).join(" · ");
}

/**
 * "Ước tính gọi xong" (handoff 16): minutes = N × attempts × 1.3, attempts 1 / 1.45 / 1.65 / 1.74 for 0–3 retries;
 * capacity per hour = calls at once × 60 × 0.85. Inside one day's hours: minutes or hours; otherwise days.
 */
export function estimate(n, s) {
  if (!n) return null;
  const att = [1, 1.45, 1.65, 1.74][s.retries] ?? 1.45;
  const callMin = n * att * 1.3;
  const perHour = s.concurrency * 60 * 0.85;
  const hours = callMin / perHour;
  const day = dayMinutes(s.windows) / 60;
  let text;
  if (hours * 60 < 60) text = `~${Math.max(1, Math.round(hours * 60))} phút`;
  else if (!day || hours <= day) text = `~${hours.toFixed(1).replace(".", ",")} giờ`;
  else text = `~${Math.ceil(hours / day)} ngày gọi`;
  return { text, note: "Giả định mỗi lần gọi trung bình 1,3 phút kể cả lúc đổ chuông, và khoảng 45% khách không nghe máy ở lần đầu." };
}

const VN = 7 * 3600e3;
export const vnDate = (ms = Date.now()) => new Date(ms + VN).toISOString().slice(0, 10);

/** Inside the campaign's days and hours (Vietnam time, holidays skipped)? The dialer's own rule (finance/dialer.js). */
export function inWindow(now, s) {
  const vn = new Date(now + VN);
  const day = vn.getUTCDay() === 0 ? 7 : vn.getUTCDay();
  if (!(s.days || []).includes(day)) return false;
  if (s.skip_holidays && (s.holiday_dates || []).includes(vn.toISOString().slice(0, 10))) return false;
  const hm = vn.toISOString().slice(11, 16);
  return (s.windows || []).some(([a, z]) => hm >= a && hm < z);
}

/** When calling starts again: "13:30", "T2 08:30" (within the next 2 weeks), or null. */
export function nextCallTime(now, s) {
  const starts = (s.windows || []).map(([a]) => a).sort();
  for (let k = 0; k < 15; k++) {
    const day = vnDate(now + k * 86400e3);
    for (const a of starts) {
      const t = Date.parse(`${day}T${a}:00+07:00`);
      if (t <= now || !inWindow(t, s)) continue;
      const d = new Date(t + VN).getUTCDay() || 7;
      return `${k ? `${DAYS[d - 1]} ` : ""}${a}`;
    }
  }
  return null;
}

/** Nghỉ ngày lễ: every official holiday's date, this year and next (Tết by the lunar calendar). */
export function holidayDates(now = Date.now()) {
  const today = vnDate(now);
  const y = Number(today.slice(0, 4));
  const out = [];
  for (const h of [...holidaysOf(y), ...holidaysOf(y + 1)]) {
    if (!h.official || h.to < today) continue;
    for (let t = Date.parse(`${h.from}T00:00:00Z`); t <= Date.parse(`${h.to}T00:00:00Z`); t += 86400e3) out.push(new Date(t).toISOString().slice(0, 10));
  }
  return [...new Set(out)].sort().slice(0, 80);
}

// The result boxes (handoff 16: follow-up results in wide boxes, the rest narrow; update 17 colours). The words are
// the founder's labels (the engine's prompts/labels.json); a result the list doesn't know gets a narrow box of its own,
// so the counts always add up.
export const NO_ANSWER = "Không nghe máy";
export const BOXES = {
  outbound: ["Quan tâm", "Hẹn gọi lại", "Đang cân nhắc", "Không quan tâm", "Không muốn được gọi", "Sai người", "Không rõ"],
  inbound: ["Quan tâm", "Lời nhắn", "Khiếu nại", "Hỏi thông tin", "Khách hiện tại", "Khác"],
};
export const OUT_COL = { "Quan tâm": "#5E8A4A", "Hẹn gọi lại": "#A65E24", "Lời nhắn": "#4A4239", "Khiếu nại": "#8A3F2E" };
export const FLASH = { "Quan tâm": "#EEF2E8", "Hẹn gọi lại": "#F7EBDD", "Lời nhắn": "#EFEBE4", "Khiếu nại": "#F5E6E0" };
export const PILL = { "Quan tâm": ["#E6EDDD", "#4A6B3A"], "Hẹn gọi lại": ["#F5E4C9", "#8A4D1C"], "Lời nhắn": ["#EFE9DD", "#4A4239"], "Khiếu nại": ["#F3E0D9", "#8A3F2E"] };
export const colOf = (o) => OUT_COL[o] || "#B8AB94";
export const needs = (o) => FOLLOW_UP.has(o);

/** The live view's feed pill: the follow-up results in their colours, the rest outlined. */
export function FeedPill({ outcome }) {
  const label = outcome || NO_ANSWER;
  const p = PILL[label];
  return (
    <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", padding: "3px 6px", borderRadius: 8, whiteSpace: "nowrap", textTransform: "uppercase", background: p ? p[0] : "transparent", color: p ? p[1] : "#6E6255", border: `1px solid ${p ? p[0] : "#D9D0BF"}`, lineHeight: 1.2 }}>
      {label}
    </span>
  );
}

/** A round chip of a choice row (5 / 10 / 20 …, Không / 1 lần …). */
export function Choice({ on, onClick, children, mono = false, h = 30, copper = false, style }) {
  const bg = on ? (copper ? "#7B4A2D" : "#1F1B16") : "#fff";
  return (
    <button type="button" onClick={onClick} style={{ height: h, minWidth: mono ? 44 : undefined, padding: "0 11px", borderRadius: 8, border: `1px solid ${on ? bg : "#D9D0BF"}`, background: bg, color: on ? (copper ? "#fff" : "#F7F3EC") : copper ? "#6E6255" : "#1F1B16", fontFamily: mono ? MONO : undefined, fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap", ...style }}>
      {children}
    </button>
  );
}

/** The small switch of the column table and "Nghỉ ngày lễ". */
export function Toggle({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} style={{ width: 34, height: 20, borderRadius: 10, border: 0, padding: 2, background: on ? "#7B4A2D" : "#E4DCCB", cursor: "pointer", display: "flex", justifyContent: on ? "flex-end" : "flex-start", transition: "background 200ms", flex: "none" }}>
      <span style={{ width: 16, height: 16, borderRadius: 8, background: "#fff", boxShadow: "0 1px 2px rgba(31,27,22,0.2)" }} />
    </button>
  );
}

/** Read an Excel or CSV file with SheetJS (loaded when needed): the header row and every row as { column: text }. */
export async function readSheet(file) {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false, raw: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return { headers: [], rows: [] };
  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "", blankrows: false });
  const headers = (grid[0] || []).map((h) => String(h ?? "").trim());
  const rows = grid.slice(1).filter((r) => r.some((v) => String(v ?? "").trim() !== "")).map((r) => {
    const o = {};
    headers.forEach((h, i) => { if (h) o[h] = String(r[i] ?? "").trim(); });
    return o;
  });
  return { headers: headers.filter(Boolean), rows };
}

/** A number as 0xxxxxxxxx (mobile) or 0xxxxxxxxxx (landline), else null: the backend's own check (phone10). */
export function phone10(raw) {
  let d = String(raw ?? "").replace(/[\s.()+-]/g, "");
  if (!/^\d+$/.test(d)) return null;
  if (d.startsWith("84") && (d.length === 11 || d.length === 12)) d = `0${d.slice(2)}`;
  else if (!d.startsWith("0") && (d.length === 9 || d.length === 10)) d = `0${d}`;
  return /^0[1-9]\d{8,9}$/.test(d) ? d : null;
}

/** The browser's first look at the rows (the backend checks again on save): good numbers, wrong ones, repeats. */
export function checkRows(rows, phoneCol) {
  const seen = new Map();
  const good = [];
  const wrong = [];
  const duplicate = [];
  rows.forEach((r, i) => {
    const n = i + 2; // the file's row (1 is the column names)
    const raw = String(r[phoneCol] ?? "").trim();
    const p = phone10(raw);
    if (!p) { wrong.push({ n, row: r, why: raw ? `${raw} · không phải số điện thoại` : "Thiếu số điện thoại" }); return; }
    if (seen.has(p)) { duplicate.push({ n, row: r, why: `Trùng dòng ${seen.get(p)}` }); return; }
    seen.set(p, n);
    good.push({ phone: p, row: r });
  });
  return { good, wrong, duplicate };
}
