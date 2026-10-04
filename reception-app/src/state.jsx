import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { REQUESTS, SCRIPTS, copyText } from "./data/sample.js";
import { defaultSettings } from "./data/settings.js";
import { INVOICE } from "./data/account.js";

// One store for the whole app (sample data until the backend is wired):
// requests (Trực tiếp + Lịch sử share them), the scripted live calls of the
// demo, the Offline state, and Cài đặt (persisted per browser).

const AppState = createContext(null);
export const useApp = () => useContext(AppState);

const SETTINGS_KEY = "tt3.settings";

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

function loadSettings() {
  const D = defaultSettings();
  try {
    const P = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    if (P && P.f && P.rooms) {
      const cur = { f: { ...D.f, ...P.f }, ok: { ...D.ok, ...(P.ok || {}) }, rooms: P.rooms };
      return { ...cur, saved: P.saved || JSON.stringify(cur) };
    }
  } catch {
    // private mode or bad JSON: start from the defaults
  }
  return { ...D, saved: JSON.stringify(D) };
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
  const [reqs, setReqs] = useState(() => REQUESTS.map((r) => ({ ...r })));
  const [calls, setCalls] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [pickups, setPickups] = useState(0);
  const [offline, setOffline] = useState(false);
  const [focus, setFocus] = useState(null);
  const [copied, setCopied] = useState(null);
  const [settings, setSettings] = useState(loadSettings);

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
    if (stateRef.current.offline) return;
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
    setNow(Date.now());
  }, []);

  const toggleOffline = useCallback(() => {
    setOffline((o) => !o);
    setCalls([]);
  }, []);

  // ── settings ───────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const { f, ok, rooms, saved } = settings;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ f, ok, rooms, saved }));
    } catch {
      // storage full / blocked: settings still work for this session
    }
  }, [settings]);

  const settingsApi = useMemo(() => ({
    setF: (k, v, confirm) => setSettings((s) => ({ ...s, f: { ...s.f, [k]: v }, ok: confirm ? { ...s.ok, [k]: true } : s.ok })),
    setRoom: (i, patch) => setSettings((s) => ({ ...s, rooms: s.rooms.map((r, j) => (j === i ? { ...r, ...patch } : r)) })),
    confirmKeys: (keys) => setSettings((s) => {
      const ok = { ...s.ok };
      keys.forEach((k) => { ok[k] = true; });
      return { ...s, ok };
    }),
    save: () => setSettings((s) => ({ ...s, saved: JSON.stringify({ f: s.f, ok: s.ok, rooms: s.rooms }) })),
    discard: () => setSettings((s) => {
      const o = JSON.parse(s.saved);
      return { ...s, f: o.f, ok: o.ok, rooms: o.rooms };
    }),
    resetAll: () => {
      const D = defaultSettings();
      setSettings({ ...D, saved: JSON.stringify(D) });
    },
    /** Thử Bonia's quick settings: change and save at once (no unsaved-changes bar). */
    applyNow: (k, v) => setSettings((s) => {
      let saved = s.saved;
      try {
        const sv = JSON.parse(saved);
        sv.f = { ...sv.f, [k]: v };
        sv.ok = { ...sv.ok, [k]: true };
        saved = JSON.stringify(sv);
      } catch {
        // no saved snapshot yet
      }
      return { ...s, f: { ...s.f, [k]: v }, ok: { ...s.ok, [k]: true }, saved };
    }),
    /** A Thử Bonia correction: appended to "Thông tin khác" and saved at once. */
    appendExtra: (line) => setSettings((s) => {
      const ex = (s.f.extra || "").trim();
      const extra = (ex ? `${ex}\n` : "") + line;
      let saved = s.saved;
      try {
        const sv = JSON.parse(saved);
        sv.f = { ...sv.f, extra };
        saved = JSON.stringify(sv);
      } catch {
        // no saved snapshot yet
      }
      return { ...s, f: { ...s.f, extra }, saved };
    }),
  }), []);

  const value = {
    reqs, calls, now, pickups, offline, focus, copied, settings, unpaid: !INVOICE.paid,
    startCall, listen, later, markDone, copy, resetDemo, toggleOffline, setFocus,
    elapsed, ...settingsApi,
  };
  return <AppState.Provider value={value}>{children}</AppState.Provider>;
}
