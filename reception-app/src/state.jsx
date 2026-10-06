import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { REQUESTS, SCRIPTS, copyText } from "./data/sample.js";
import { defaultSettings, blankSettings, withAllFields } from "./data/settings.js";
import { INVOICE } from "./data/account.js";
import { api, token } from "./api.js";
import { isDemo } from "./demo.js";
import { demoReadback, liveNote, vnDate } from "./lib/today.js";

// One store for the whole app: requests (Trực tiếp + Lịch sử share them), the
// scripted live calls of the demo, the Offline state, and Cài đặt.
// Demo mode: sample data, Cài đặt persisted per browser. Otherwise (founder
// 2026-10-05): the owner logs in with a code pushed to the Bonia app, and Cài
// đặt is the hotel's profile on the backend; saving confirms everything.
// Handoff 14 (founder 2026-10-06): Bonia on/off for the business (forwarded
// calls are rejected while off, and until the first Bật Bonia), the Hôm nay
// note, the one-time Orb tip and the sector. One value per business, shared
// with the phone app and the voice agent: the page asks again every 15 s, so
// a switch made on the phone shows here.

const AppState = createContext(null);
export const useApp = () => useContext(AppState);

// tt4: the hotel profile schema of 2026-10-04 (values with source + status).
const SETTINGS_KEY = "tt4.settings";

export const hm = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export function copyToClipboard(text) {
  try {
    navigator.clipboard?.writeText(text).catch(() => {});
  } catch {
    // clipboard blocked (insecure origin, old browser): the label still says "Đã chép"
  }
}

const snapshot = (s) => JSON.stringify({ values: s.values, rooms: s.rooms });
const withSaved = (p) => ({ ...p, saved: snapshot(p) });
// the demo's lookup: two places with the name (one a look-alike), then the sample hotel after a few seconds
const DEMO_IDENTIFY_MS = 2500;
const DEMO_LOOKUP_MS = 6000;
const DEMO_CANDIDATES = [
  { name: "Khách sạn Sân Nhài", address: "27 đường Sân Nhài, phường Xuân Hòa, TP.HCM", phone: "028 3930 0000", url: "https://www.booking.com/hotel/vn/san-nhai.html", source: "booking" },
  { name: "Sân Nhài Homestay", address: "14 Hoa Hồng, phường 2, Đà Lạt", phone: "", url: "https://www.agoda.com/san-nhai-homestay", source: "agoda" },
];
const LOOKUP_POLL_MS = 2000;
const STATE_POLL_MS = 15_000;
const BIZ_KEY = "tt4.biz";
const BLANK_BIZ = { active: false, activatedAt: null, today: null, tipSeen: false, sector: null };
// the demo hotel has been answering for a while; its state lives in this browser
const DEMO_BIZ = { active: true, activatedAt: "2026-09-01T02:00:00.000Z", today: null, tipSeen: true, sector: "lodging" };
/** The backend's state → the page's. */
const fromState = (x) => ({ active: !!x.active, activatedAt: x.activated_at || null, today: x.today || null, tipSeen: !!x.tip_seen, sector: x.sector || null });

function loadDemoBiz() {
  try {
    const b = JSON.parse(localStorage.getItem(BIZ_KEY) || "null");
    if (b && typeof b.active === "boolean") return { ...DEMO_BIZ, ...b };
  } catch {
    // private mode or bad JSON
  }
  return DEMO_BIZ;
}

function loadSettings() {
  const D = defaultSettings();
  try {
    const P = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    if (P && P.values && P.rooms) {
      // stored before a field changed shape: read in today's shape (the saved copy too, or everything looks unsaved)
      const up = (x) => withAllFields({ values: { ...D.values, ...x.values }, rooms: x.rooms });
      const cur = up(P);
      const was = P.saved ? JSON.parse(P.saved) : null;
      return { ...cur, saved: was && was.values ? snapshot(up(was)) : snapshot(cur) };
    }
  } catch {
    // private mode or bad JSON: start from the defaults
  }
  return { ...D, saved: snapshot(D) };
}

/** Seconds into a call, frozen once the desk takes over or the phone rings. */
function elapsed(c, now) {
  const sc = SCRIPTS[c.kind];
  const stop = c.ringAt || c.handedAt;
  const raw = ((c.endAt && !stop ? Math.min(now, c.endAt) : now) - c.start) / 1000;
  return Math.min(raw, stop ? (stop - c.start) / 1000 : sc.end);
}

/** The request a finished call files into Cần xử lý. */
function requestFromCall(c, now) {
  const sc = SCRIPTS[c.kind];
  const el = elapsed(c, c.endAt);
  const s = Math.round((c.endAt - c.start) / 1000);
  const heard = sc.summary.filter((x) => el >= x[0]).pop();
  let summary = heard ? heard[1] : "";
  if (c.handedAt) summary = summary ? `${summary} Lễ tân đã nghe máy.` : "Lễ tân đã nghe máy ngay từ đầu.";
  return {
    id: c.id,
    name: sc.name && el >= sc.nameAt ? sc.name : null,
    room: sc.room && el >= sc.roomAt ? sc.room : null,
    number: sc.number, type: sc.type, urgent: sc.urgent, day: 0, at: hm(),
    len: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`,
    summary, status: "open", addedAt: now,
    transcript: sc.lines.filter((l) => l[0] <= el).map((l) => [l[1], l[2]]),
  };
}

export function AppStateProvider({ children }) {
  const [demo] = useState(isDemo);
  // account: demo · loading · out · in ({ phone, version, firstRun: no profile saved yet })
  const [account, setAccount] = useState(() => (demo ? { status: "demo" } : token.get() ? { status: "loading" } : { status: "out" }));
  // the AI lookup: null · { status: identifying | choose | none | running | done | failed | skipped,
  //   name, startedAt, candidates, picked, notes, found, filled, error }
  // The owner confirms which place before anything is filled (founder 2026-10-05: never a look-alike hotel).
  const [lookup, setLookup] = useState(null);
  const lookupRef = useRef(null);
  lookupRef.current = lookup;
  const [reqs, setReqs] = useState(() => (demo ? REQUESTS.map((r) => ({ ...r })) : []));
  const [calls, setCalls] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [pickups, setPickups] = useState(0);
  const [offline, setOffline] = useState(false);
  const [focus, setFocus] = useState(null);
  const [copied, setCopied] = useState(null);
  const [settings, setSettings] = useState(() => (demo ? loadSettings() : withSaved(blankSettings())));
  const [biz, setBiz] = useState(() => (demo ? loadDemoBiz() : BLANK_BIZ));
  const bizRef = useRef(biz);
  bizRef.current = biz;
  // a local change wins over a state poll that was already on its way; the sector picked at the lookup
  // stays the page's until Cài đặt is saved (polls never replace it)
  const bizSeq = useRef(0);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const accountRef = useRef(account);
  accountRef.current = account;

  const tickRef = useRef(null);
  const timeouts = useRef([]);
  const copyTimer = useRef(null);
  const stateRef = useRef({});
  stateRef.current = { calls, reqs, offline };

  // ── live-call ticker ───────────────────────────────────────────────────
  const tick = useCallback(() => {
    const t = Date.now();
    const { calls: cs, reqs: rs } = stateRef.current;
    let newReqs = rs;
    const next = cs
      .map((c) => {
        const sc = SCRIPTS[c.kind];
        const c2 = { ...c };
        if (c2.ringAt && !c2.handedAt && t - c2.ringAt > 2600) c2.handedAt = t;
        if (!c2.endAt) {
          if (c2.handedAt && t - c2.handedAt > 6000) c2.endAt = t;
          else if (!c2.ringAt && t - c2.start >= sc.end * 1000) c2.endAt = c2.start + sc.end * 1000;
        }
        if (c2.endAt && !c2.added && t - c2.endAt >= 1600) {
          c2.added = true;
          newReqs = [requestFromCall(c2, t), ...newReqs];
        }
        return c2;
      })
      .filter((c) => !(c.endAt && t - c.endAt > 2400));
    const flashing = newReqs.some((r) => (r.addedAt && t - r.addedAt < 3000) || (r.doneFlash && t - r.doneFlash < 3000));
    setCalls(next);
    if (newReqs !== rs) setReqs(newReqs);
    setNow(t);
    if (!next.length && !flashing) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const ensureTick = useCallback(() => {
    if (!tickRef.current) tickRef.current = setInterval(tick, 100);
  }, [tick]);

  useEffect(() => () => {
    clearInterval(tickRef.current);
    timeouts.current.forEach(clearTimeout);
  }, []);

  const startCall = useCallback((kind) => {
    // unpaid, or the owner switched Bonia off: the call is rejected, nothing shows
    if (stateRef.current.offline || !bizRef.current.active) return;
    const t = Date.now();
    const used = stateRef.current.calls.map((c) => c.slot);
    const slot = [0, 1].find((i) => !used.includes(i));
    if (slot == null) return;
    const id = kind + t;
    setCalls((cs) => [...cs, { id, kind, start: t, slot }]);
    setPickups((p) => p + 1);
    setFocus(id);
    setNow(t);
    ensureTick();
  }, [ensureTick]);

  const listen = useCallback((id) => {
    setCalls((cs) => cs.map((x) => (x.id === id && !x.endAt && !x.ringAt ? { ...x, ringAt: Date.now() } : x)));
  }, []);

  const later = useCallback((fn, ms) => {
    timeouts.current.push(setTimeout(fn, ms));
  }, []);

  const markDone = useCallback((id, device) => {
    const t = Date.now();
    setReqs((rs) => rs.map((r) => (r.id === id ? { ...r, status: "done", doneBy: device, doneAt: hm(), doneFlash: t } : r)));
    setNow(t);
    ensureTick();
  }, [ensureTick]);

  const copy = useCallback((r) => {
    copyToClipboard(copyText(r));
    setCopied(r.id);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(null), 1600);
  }, []);

  const resetDemo = useCallback(() => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    setCalls([]);
    setReqs(REQUESTS.map((r) => ({ ...r })));
    setOffline(false);
    setBiz(DEMO_BIZ);
    setNow(Date.now());
  }, []);

  const toggleOffline = useCallback(() => {
    setOffline((o) => !o);
    setCalls([]);
  }, []);

  // ── account (not in demo mode) ──────────────────────────────────────────
  const loadAccount = useCallback(async () => {
    if (demo || !token.get()) return setAccount(demo ? { status: "demo" } : { status: "out" });
    setAccount((a) => (a.status === "in" ? a : { status: "loading" }));
    try {
      const me = await api.me();
      setSettings(withSaved(withAllFields(me.profile)));
      bizSeq.current++;
      setBiz(fromState(me));
      setAccount({ status: "in", phone: me.phone, version: me.version, firstRun: !me.profile });
    } catch (e) {
      setAccount(e.status === 401 ? { status: "out" } : { status: "error", error: e.error || "network" });
    }
  }, [demo]);
  useEffect(() => { loadAccount(); }, [loadAccount]);

  const signIn = useCallback(async (t) => { token.set(t); await loadAccount(); }, [loadAccount]);
  const signOut = useCallback(() => { token.set(null); setLookup(null); setSettings(withSaved(blankSettings())); setBiz(BLANK_BIZ); setAccount({ status: "out" }); }, []);

  // ── Bonia on/off, Hôm nay, the Orb tip (handoff 14) ─────────────────────
  // the phone may switch Bonia or change the note: ask again every 15 s and when the page comes back
  useEffect(() => {
    if (demo || account.status !== "in") return undefined;
    const pull = () => {
      if (document.visibilityState !== "visible") return;
      const seq = bizSeq.current;
      api.state().then((x) => { if (seq === bizSeq.current) setBiz((b) => ({ ...b, ...fromState(x), sector: b.sector || x.sector || null })); }).catch(() => {});
    };
    const iv = setInterval(pull, STATE_POLL_MS);
    window.addEventListener("focus", pull);
    document.addEventListener("visibilitychange", pull);
    return () => {
      clearInterval(iv);
      window.removeEventListener("focus", pull);
      document.removeEventListener("visibilitychange", pull);
    };
  }, [demo, account.status]);

  useEffect(() => {
    if (!demo) return;
    try {
      localStorage.setItem(BIZ_KEY, JSON.stringify(biz));
    } catch {
      // storage blocked: the demo's switch lasts this page only
    }
  }, [demo, biz]);

  /** Bonia on or off (Orb, Bật Bonia). Resolves to { ok } or { error }; a refusal puts the switch back. */
  const setActive = useCallback(async (on) => {
    const before = bizRef.current;
    bizSeq.current++;
    setBiz((b) => ({ ...b, active: on, activatedAt: b.activatedAt || (on ? new Date().toISOString() : null) }));
    if (!on) setCalls([]);
    if (demo) return { ok: true };
    try {
      const x = await api.setActive(on);
      bizSeq.current++;
      setBiz((b) => ({ ...b, ...fromState(x), sector: b.sector || x.sector || null }));
      return { ok: true };
    } catch (e) {
      bizSeq.current++;
      setBiz(before);
      return { error: e.error || "network" };
    }
  }, [demo]);

  /** What Bonia understood from a note: { clear, instruction, unclear }; throws { error } when it could not ask. */
  const readback = useCallback(async (text, until) => {
    if (demo) {
      await new Promise((r) => { timeouts.current.push(setTimeout(r, 700)); });
      return demoReadback(text, until);
    }
    return api.readback(text, until);
  }, [demo]);

  /** Save the note with the read-back the owner saw. Resolves to { ok } or { error }. */
  const saveToday = useCallback(async (note) => {
    bizSeq.current++;
    if (demo) {
      setBiz((b) => ({ ...b, today: { ...note, date: vnDate(), saved_at: new Date().toISOString() } }));
      return { ok: true };
    }
    try {
      const x = await api.saveToday(note);
      bizSeq.current++;
      setBiz((b) => ({ ...b, ...fromState(x), sector: b.sector || x.sector || null }));
      return { ok: true };
    } catch (e) {
      return { error: e.error || "network" };
    }
  }, [demo]);

  const clearToday = useCallback(async () => {
    const before = bizRef.current;
    bizSeq.current++;
    setBiz((b) => ({ ...b, today: null }));
    if (demo) return { ok: true };
    try {
      await api.clearToday();
      return { ok: true };
    } catch (e) {
      setBiz(before);
      return { error: e.error || "network" };
    }
  }, [demo]);

  /** "Đã hiểu" on the Orb tip: never again for this account. */
  const dismissTip = useCallback(() => {
    setBiz((b) => ({ ...b, tipSeen: true }));
    if (!demo) api.tipSeen().catch(() => {});
  }, [demo]);

  /** Store a profile on the backend; the answer (every value confirmed) becomes the saved form. */
  const persist = useCallback(async (profile) => {
    const a = accountRef.current;
    try {
      const r = await api.saveProfile({ values: profile.values, rooms: profile.rooms }, a.version, bizRef.current.sector);
      setAccount((x) => ({ ...x, version: r.version, firstRun: false }));
      if (r.sector) setBiz((b) => ({ ...b, sector: r.sector }));
      return { ok: true, profile: withAllFields(r.profile) };
    } catch (e) {
      return { error: e.error || "network" };
    }
  }, []);

  // ── the AI lookup (founder 2026-10-05: fill every field, the owner edits and saves) ──
  const finishLookup = useCallback((base, profile, notes, found) => {
    const before = settingsRef.current;
    const next = withAllFields(profile, base.picked?.name || base.name);
    const filled = Object.values(next.values).filter((x) => x.st === "new" && x.v != null && x.v !== "" && !(Array.isArray(x.v) && !x.v.length)).length + next.rooms.length;
    // unsaved on purpose: the owner reviews, then saves
    setSettings({ ...next, saved: before.saved });
    setLookup({ ...base, status: "done", notes: notes || "", found, filled });
  }, []);

  /** Polls a lookup job through its steps: identifying → choose (the owner picks) → running → done. */
  const pollLookup = useCallback((id, base) => {
    const tick = async () => {
      try {
        const j = await api.importStatus(id);
        if (j.status === "identifying" || j.status === "running" || j.status === "pricing") {
          // the wait screen says which step it is on ("pricing": reference prices from the booking sites)
          if (j.status !== lookupRef.current?.status) setLookup((l) => (l ? { ...l, status: j.status } : l));
          return void timeouts.current.push(setTimeout(tick, LOOKUP_POLL_MS));
        }
        if (j.status === "choose") return setLookup({ ...base, status: "choose", jobId: id, candidates: j.candidates || [] });
        if (j.status === "none") return setLookup({ ...base, status: "none" });
        if (j.status === "done") return finishLookup(base, j.profile, j.notes, j.found);
        setLookup({ ...base, status: "failed", error: j.error || "lookup_failed" });
      } catch (e) {
        setLookup({ ...base, status: "failed", error: e.error || "network" });
      }
    };
    timeouts.current.push(setTimeout(tick, LOOKUP_POLL_MS));
  }, [finishLookup]);

  const startLookup = useCallback(async ({ name, area, urls }) => {
    const base = { name, area, startedAt: Date.now() };
    setLookup({ ...base, status: "identifying" });
    if (demo) {
      timeouts.current.push(setTimeout(() => setLookup({ ...base, status: "choose", jobId: "demo", candidates: DEMO_CANDIDATES }), DEMO_IDENTIFY_MS));
      return;
    }
    try {
      const { job_id: id } = await api.startImport({ name, area, urls });
      pollLookup(id, base);
    } catch (e) {
      setLookup({ ...base, status: "failed", error: e.error || "network" });
    }
  }, [demo, pollLookup]);

  /** The owner's place and sector (W4): the full lookup reads only about it. */
  const pickCandidate = useCallback(async (i, sector) => {
    const l = lookupRef.current;
    if (!l || l.status !== "choose") return;
    if (sector) setBiz((b) => ({ ...b, sector }));
    const base = { name: l.name, area: l.area, picked: l.candidates[i], startedAt: Date.now() };
    setLookup({ ...base, status: "running" });
    if (demo) {
      timeouts.current.push(setTimeout(() => {
        const D = defaultSettings();
        const found = { values: Object.fromEntries(Object.entries(D.values).map(([k, x]) => [k, x.st === "ok" && k !== "name" ? { ...x, st: "new", src: x.src || { t: "booking" } } : x])), rooms: D.rooms.map((r) => ({ ...r, st: "new" })) };
        finishLookup(base, found, "Bản demo: thông tin mẫu của Khách sạn Sân Nhài.", true);
      }, DEMO_LOOKUP_MS));
      return;
    }
    try {
      await api.pickImport(l.jobId, i);
      pollLookup(l.jobId, base);
    } catch (e) {
      setLookup({ ...base, status: "failed", error: e.error || "network" });
    }
  }, [demo, pollLookup, finishLookup]);

  /** "Tôi tự điền": a blank form with the hotel's name. */
  const startBlank = useCallback((name) => {
    const before = settingsRef.current;
    const next = blankSettings(name);
    setSettings({ ...next, saved: before.saved });
    setLookup({ status: "skipped", name });
  }, []);

  // ── settings ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!demo) return;
    try {
      const { values, rooms, saved } = settings;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ values, rooms, saved }));
    } catch {
      // storage full / blocked: settings still work for this session
    }
  }, [settings]);

  const settingsApi = useMemo(() => {
    const owner = { t: "owner" };
    /** Change one thing and store it at once (Thử Bonia's quick settings, a correction), leaving other edits unsaved. */
    const saveNow = (fn) => {
      if (demo) return applySaved(fn);
      const cur = settingsRef.current;
      let base;
      try { base = JSON.parse(cur.saved); } catch { base = cur; }
      const next = { values: fn(base.values), rooms: base.rooms };
      setSettings((s) => ({ ...s, values: fn(s.values), saved: snapshot(next) }));
      persist(next);
      return undefined;
    };
    const setValues = (fn) => setSettings((s) => ({ ...s, values: fn(s.values) }));
    /** Change and also write into the saved snapshot (no unsaved-changes bar). */
    const applySaved = (fn) => setSettings((s) => {
      const next = { ...s, values: fn(s.values) };
      let saved = s.saved;
      try {
        const sv = JSON.parse(saved);
        sv.values = fn(sv.values);
        saved = JSON.stringify(sv);
      } catch {
        saved = snapshot(next);
      }
      return { ...next, saved };
    });
    return {
      /** The owner typed or picked a value: it is now confirmed. */
      setVal: (k, v) => setValues((vs) => ({ ...vs, [k]: { v, st: "ok", src: owner } })),
      /** Two sources disagreed; the owner picked one. */
      pickAlt: (k, alt) => setValues((vs) => ({ ...vs, [k]: { v: alt.v, st: "ok", src: alt.src } })),
      setRoom: (i, patch) => setSettings((s) => ({ ...s, rooms: s.rooms.map((r, j) => (j === i ? { ...r, ...patch } : r)) })),
      addRoom: () => setSettings((s) => ({ ...s, rooms: [...s.rooms, { name: "Loại phòng mới", aliases: [], count: "", bed: "", maxAdults: "", maxChildren: "", size: "", view: "", floor: "", extras: [], extraBed: "", notes: "", daily: { on: true, wd: "", we: "" }, overnight: { on: false, price: "", from: "22:00", to: "12:00" }, hourly: { on: false, h2: "", hn: "" }, monthly: { on: false, price: "" }, st: "ok", src: owner }] })),
      removeRoom: (i) => setSettings((s) => ({ ...s, rooms: s.rooms.filter((_, j) => j !== i) })),
      /** Saving confirms everything in the form (founder 2026-10-05). Resolves to { ok } or { error }. */
      save: async () => {
        const cur = settingsRef.current;
        const confirmed = { values: Object.fromEntries(Object.entries(cur.values).map(([k, x]) => [k, { v: x.v ?? null, st: "ok", ...(x.src ? { src: x.src } : {}) }])), rooms: cur.rooms.map((r) => ({ ...r, st: "ok" })) };
        if (demo) {
          setSettings(withSaved(confirmed));
          return { ok: true };
        }
        const r = await persist(confirmed);
        if (r.ok) {
          setSettings(withSaved(r.profile));
          setLookup(null);
        }
        return r;
      },
      discard: () => setSettings((s) => ({ ...s, ...JSON.parse(s.saved) })),
      resetAll: () => {
        const D = defaultSettings();
        setSettings({ ...D, saved: snapshot(D) });
      },
      /** Thử Bonia's quick settings: change and save at once. */
      applyNow: (k, v) => saveNow((vs) => ({ ...vs, [k]: { v, st: "ok", src: owner } })),
      /** Demo: load a profile from the AI import ({ profile } or { values, rooms }); unknown keys keep the defaults. */
      loadProfile: (data) => {
        const prof = data && data.profile ? data.profile : data;
        if (!prof || !prof.values || !prof.rooms) return false;
        const D = defaultSettings();
        const next = withAllFields({ values: { ...D.values, ...prof.values }, rooms: prof.rooms });
        setSettings({ ...next, saved: snapshot(next) });
        return true;
      },
    };
  }, [demo, persist]);

  const value = {
    demo, account, signIn, signOut, reloadAccount: loadAccount, lookup, startLookup, pickCandidate, startBlank, dismissLookup: () => setLookup(null),
    reqs, calls, now, pickups, offline, focus, copied, settings, unpaid: demo && !INVOICE.paid,
    biz: { ...biz, today: liveNote(biz.today) }, setActive, readback, saveToday, clearToday, dismissTip,
    startCall, listen, later, markDone, copy, resetDemo, toggleOffline, setFocus,
    elapsed, ...settingsApi,
  };
  return <AppState.Provider value={value}>{children}</AppState.Provider>;
}
