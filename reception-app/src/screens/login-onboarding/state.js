// Onboarding (3.1) state: one small store shared by the five steps, kept in
// localStorage so the owner can leave ("Lưu, làm tiếp sau") and come back
// to the same place, even mid-search. Frames (?f=3.1_X) seed it with the
// exact drawn state.
import { useSyncExternalStore } from "react";
import {
  CALL_FRAME_T,
  CALL_RING_SECONDS,
  CALL_SPEED,
  LISTEN,
  PHONE_SETUP,
  REVIEW_01,
  REVIEW_01_MORE,
  REVIEW_02_ASK,
  REVIEW_02_PRICES,
  REVIEW_SECTIONS,
  SEARCH_FORM,
  SEARCH_FRAME_T,
} from "../../data/onboarding.js";

const KEY = "tt-onboarding-v1";

/** Every reviewable fact, keyed by id: { value, confirmed, removed }. */
function initialRows() {
  const rows = {};
  for (const r of REVIEW_01.rows) {
    if (r.conflict) continue;
    rows[r.id] = { value: r.value, confirmed: !!r.confirmed, removed: false };
  }
  for (const r of REVIEW_01_MORE) rows[r.id] = { value: r.value, confirmed: false, removed: false };
  for (const s of Object.values(REVIEW_SECTIONS)) {
    for (const r of s.rows) rows[r.id] = { value: r.value, confirmed: false, removed: false };
  }
  return rows;
}

/** Questions + conflicts: { selected, answered, custom }. Index 0 = Bonia's suggestion. */
function initialAnswers() {
  const a = {
    "nhan-phong": { selected: 0, answered: false, custom: null },
    "khach-khuya": { selected: REVIEW_01.question.selected, answered: false, custom: null },
  };
  for (const q of REVIEW_02_ASK) a[q.id] = { selected: 0, answered: false, custom: null };
  for (const s of Object.values(REVIEW_SECTIONS)) {
    for (const q of s.questions) a[q.id] = { selected: 0, answered: false, custom: null };
  }
  return a;
}

function initialPrices(fromFrame) {
  const p = {};
  for (const r of REVIEW_02_PRICES) {
    // A fresh search pre-fills the Booking.com price, unconfirmed.
    p[r.id] = fromFrame ? { mine: r.mine, confirmed: r.confirmed } : { mine: r.ota, confirmed: false };
  }
  return p;
}

export function initialState() {
  return {
    mode: null, // null (AI question open) | "ai" | "manual"
    phase: "ask", // ask | form | matches | notfound | searching
    form: { name: SEARCH_FORM.name, area: SEARCH_FORM.area, links: [...SEARCH_FORM.links] },
    match: "san-nhai",
    searchStartedAt: null,
    searchFrozenT: null,
    rows: initialRows(),
    answers: initialAnswers(),
    prices: initialPrices(false),
    priceFocus: "superior",
    listen: { greeting: LISTEN.greeting, voice: LISTEN.voice, english: LISTEN.english },
    phone: { mode: PHONE_SETUP.mode, carrier: PHONE_SETUP.carrier, when: PHONE_SETUP.when },
    test: { startedAt: null, frozenE: null, timeout: false },
    done: false,
  };
}

// ── store ────────────────────────────────────────────────────────────────
let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return { ...initialState(), ...JSON.parse(raw) };
  } catch {
    /* private window / blocked storage: start fresh */
  }
  return initialState();
}

function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function getOnb() {
  return state;
}

/** set(patch) or set(prev => next); shallow-merges into the state. */
export function setOnb(next) {
  const patch = typeof next === "function" ? next(state) : next;
  state = { ...state, ...patch };
  save();
  listeners.forEach((l) => l());
}

/** Replace the state without notifying (used while rendering a frame). */
export function seedOnb(next) {
  state = next;
  save();
}

export function resetOnb() {
  setOnb(initialState());
}

function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useOnb() {
  return useSyncExternalStore(subscribe, getOnb, getOnb);
}

// Small updaters used by several steps.
export function setRow(id, patch) {
  setOnb((s) => ({ rows: { ...s.rows, [id]: { ...s.rows[id], ...patch } } }));
}
export function setAnswer(id, patch) {
  setOnb((s) => ({ answers: { ...s.answers, [id]: { ...s.answers[id], ...patch } } }));
}
export function setPrice(id, patch) {
  setOnb((s) => ({ prices: { ...s.prices, [id]: { ...s.prices[id], ...patch } } }));
}

// ── frame presets ────────────────────────────────────────────────────────
const LOGIN_FRAMES = /^3\.0_/;

/** The state drawn in a 3.1 frame (null for frames this store doesn't own). */
export function framePreset(frame) {
  if (!frame || LOGIN_FRAMES.test(frame)) return null;
  const base = { ...initialState(), mode: "ai", prices: initialPrices(true) };
  const searched = { ...base, phase: "searching", searchStartedAt: 1, searchFrozenT: null };
  switch (frame) {
    case "3.1_A":
      return { ...initialState() };
    case "3.1_B":
      return { ...base, phase: "form" };
    case "3.1_C":
      return { ...base, phase: "matches" };
    case "3.1_D":
      return { ...base, phase: "notfound" };
    case "3.1_E":
      return { ...base, phase: "searching", searchStartedAt: 1, searchFrozenT: SEARCH_FRAME_T };
    case "3.1_F":
    case "3.1_G":
    case "3.1_H":
    case "3.1_I":
    case "3.1_J":
      return searched;
    case "3.1_K":
      return { ...searched, test: { startedAt: 1, frozenE: 1, timeout: false } };
    case "3.1_L":
      return { ...searched, test: { startedAt: 1, frozenE: CALL_RING_SECONDS + CALL_FRAME_T / CALL_SPEED, timeout: false } };
    case "3.1_M":
      return { ...searched, test: { startedAt: 1, frozenE: 1e6, timeout: false } };
    case "3.1_N":
      return { ...searched, test: { startedAt: 1, frozenE: 1, timeout: true } };
    default:
      return null;
  }
}
