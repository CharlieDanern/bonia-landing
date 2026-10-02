// What each §-card still needs (3.1 F) — derived from the onboarding state
// so every screen agrees: "N cần bạn điền" = unanswered questions only;
// "Đúng hết · N mục" = every unconfirmed fact except prices.
import {
  REVIEW_01,
  REVIEW_01_MORE,
  REVIEW_02_ASK,
  REVIEW_02_PRICES,
  REVIEW_CARDS,
  REVIEW_SECTIONS,
} from "../../data/onboarding.js";

const ROWS_01 = REVIEW_01.rows.filter((r) => !r.conflict).map((r) => r.id);

export function sectionIds(n) {
  if (n === "01") {
    return { rows: [...ROWS_01, ...REVIEW_01_MORE.map((r) => r.id)], conflicts: ["nhan-phong"], questions: ["khach-khuya"], prices: [] };
  }
  if (n === "02") {
    return { rows: [], conflicts: [], questions: REVIEW_02_ASK.map((q) => q.id), prices: REVIEW_02_PRICES.map((p) => p.id) };
  }
  const s = REVIEW_SECTIONS[n];
  return { rows: s.rows.map((r) => r.id), conflicts: [], questions: s.questions.map((q) => q.id), prices: [] };
}

export function sectionStats(state, n) {
  const ids = sectionIds(n);
  const open = (id) => !state.rows[id]?.confirmed && !state.rows[id]?.removed;
  const rows = ids.rows.filter(open).length;
  const conflicts = ids.conflicts.filter((id) => !state.answers[id]?.answered).length;
  const need = ids.questions.filter((id) => !state.answers[id]?.answered).length;
  const prices = ids.prices.filter((id) => !state.prices[id]?.confirmed).length;
  return { need, prices, bulk: rows + conflicts + need, open: rows + conflicts + need + prices };
}

export function totals(state) {
  let need = 0;
  for (const c of REVIEW_CARDS) need += sectionStats(state, c.n).need;
  return { need, found: REVIEW_CARDS.reduce((a, c) => a + c.found, 0) };
}

/** "Đúng hết": confirm every fact and accept Bonia's suggestion for the
 *  open questions and conflicts in this card. Never touches prices. */
export function confirmAll(state, n) {
  const ids = sectionIds(n);
  const rows = { ...state.rows };
  for (const id of ids.rows) if (!rows[id].removed) rows[id] = { ...rows[id], confirmed: true };
  const answers = { ...state.answers };
  for (const id of [...ids.conflicts, ...ids.questions]) answers[id] = { ...answers[id], answered: true };
  return { rows, answers };
}

/** 550000 → "550 nghìn", 1250000 → "1 triệu 250 nghìn" (how Bonia says it). */
export function spokenPrice(n) {
  if (!n) return "";
  const tr = Math.floor(n / 1e6);
  const ng = Math.round((n % 1e6) / 1000);
  if (tr && ng) return `${tr} triệu ${ng} nghìn`;
  if (tr) return `${tr} triệu`;
  return `${ng} nghìn`;
}
