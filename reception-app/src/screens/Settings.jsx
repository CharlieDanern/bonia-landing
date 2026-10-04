import React, { useEffect, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { FIELDS, ROOM_FIELDS, SECTIONS, SOURCE_LABEL } from "../data/hotelSchema.js";
import { VOICE_COUNT, flat, needsFill, pendingList } from "../data/settings.js";
import { DeskHeader, PhoneTabs, Switch, useLayout } from "../layout.jsx";
import { useApp } from "../state.jsx";
import { EASE, MONO, SERIF, dims } from "../ui.js";
import { playVoice } from "../voice.js";

// Cài đặt: the hotel profile (HOTEL_SETTINGS_FIELDS.md v2), nine sections
// drawn from data/hotelSchema.js. Values the AI found start unconfirmed
// (dashed); typing or picking confirms them; when sources disagree the owner
// picks one tile (each tile names its source). Review mode (after the AI
// search, or while anything is left to check) adds "Còn N mục cần xem lại".

const fmt = (n) => (n === "" || n == null ? "" : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "."));
const digits = (s) => String(s).replace(/\D/g, "");

// ── field controls (module level so typing keeps focus) ───────────────────

function Chip({ on, children, onClick, d, filled = false }) {
  const st = filled
    ? { bg: on ? "#7B4A2D" : "#fff", b: on ? "#7B4A2D" : "#D9D0BF", c: on ? "#fff" : "#6E6255" }
    : { bg: on ? "#FBF5EC" : "#fff", b: on ? "#7B4A2D" : "#D9D0BF", c: on ? "#7B4A2D" : "#1F1B16" };
  return (
    <button type="button" onClick={onClick} style={{ height: d.chip, padding: "0 11px", borderRadius: d.chip / 2, border: `1px solid ${st.b}`, background: st.bg, color: st.c, fontSize: d.fs.small, whiteSpace: "nowrap" }}>
      {filled && on ? "✓ " : ""}{children}
    </button>
  );
}

function Tags({ value, onChange, d, input }) {
  const [draft, setDraft] = useState("");
  const list = value || [];
  const add = () => {
    const t = draft.trim();
    if (t && !list.includes(t)) onChange([...list, t]);
    setDraft("");
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
      {list.map((t) => (
        <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 4, height: d.chip, padding: "0 4px 0 11px", borderRadius: d.chip / 2, border: "1px solid #D9D0BF", background: "#FAF7F1", fontSize: d.fs.small }}>
          {t}
          <button type="button" aria-label={`Bỏ ${t}`} onClick={() => onChange(list.filter((x) => x !== t))} className="h-line" style={{ width: d.chip - 8, height: d.chip - 8, borderRadius: (d.chip - 8) / 2, fontSize: 10, color: "#6E6255" }}>✕</button>
        </span>
      ))}
      <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} onBlur={add} placeholder="+ thêm" style={{ ...input, width: 120, height: d.chip }} />
    </div>
  );
}

function ListRows({ value, onChange, cols, d, input }) {
  const rows = value || [];
  const set = (i, j, t) => onChange(rows.map((r, k) => (k === i ? r.map((c, m) => (m === j ? t : c)) : r)));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.3fr) auto", gap: 5, alignItems: "center" }}>
          <input value={r[0]} onChange={(e) => set(i, 0, e.target.value)} placeholder={cols[0]} style={{ ...input, width: "100%" }} />
          <input value={r[1]} onChange={(e) => set(i, 1, e.target.value)} placeholder={cols[1]} style={{ ...input, width: "100%" }} />
          <button type="button" aria-label="Xóa dòng" onClick={() => onChange(rows.filter((_, k) => k !== i))} className="h-line" style={{ width: 28, height: 28, borderRadius: 14, fontSize: 11, color: "#6E6255" }}>✕</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...rows, ["", ""]])} style={{ alignSelf: "flex-start", height: d.btnSm, padding: "0 4px", fontSize: d.fs.small, color: "#7B4A2D" }}>+ Thêm dòng</button>
    </div>
  );
}

function Hours({ value, onChange, d, input }) {
  const h = value || { allDay: false, from: "", to: "" };
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
      <button type="button" onClick={() => onChange({ ...h, allDay: !h.allDay })} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: d.fs.body, minHeight: d.row }}>
        <Switch on={!!h.allDay} />
        24/7
      </button>
      {!h.allDay && (
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: d.fs.small, color: "#6E6255" }}>
          <input value={h.from} onChange={(e) => onChange({ ...h, from: e.target.value })} placeholder="06:00" style={{ ...input, width: 76, fontFamily: MONO }} />
          tới
          <input value={h.to} onChange={(e) => onChange({ ...h, to: e.target.value })} placeholder="22:00" style={{ ...input, width: 76, fontFamily: MONO }} />
        </span>
      )}
    </div>
  );
}

function VoicePick({ value, onChange, d, greeting }) {
  const [playing, setPlaying] = useState(null);
  const stop = useRef(null);
  useEffect(() => () => stop.current?.(), []);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {Array.from({ length: VOICE_COUNT }, (_, j) => j + 1).map((i) => {
        const on = value === i;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, height: d.chip + 4, padding: "0 3px 0 10px", borderRadius: (d.chip + 4) / 2, border: `1px solid ${on ? "#7B4A2D" : "#E4DCCB"}`, background: on ? "#FBF5EC" : "#fff" }}>
            <button type="button" onClick={() => onChange(i)} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: d.fs.small, color: "#1F1B16", height: "100%" }}>
              <span style={{ width: 13, height: 13, borderRadius: 7, border: on ? "4px solid #7B4A2D" : "1.5px solid #C9BCA5", flex: "none" }} />
              Giọng {i}
            </button>
            <button
              type="button"
              aria-label={`Nghe thử giọng ${i}`}
              className="h-line"
              onClick={() => {
                stop.current?.();
                if (playing === i) return setPlaying(null);
                setPlaying(i);
                stop.current = playVoice(i, greeting || "Dạ xin nghe ạ.", () => setPlaying(null));
                return undefined;
              }}
              style={{ width: d.chip - 4, height: d.chip - 4, borderRadius: (d.chip - 4) / 2, fontSize: 10, color: "#7B4A2D" }}
            >
              {playing === i ? "■" : "▶"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** One control for a schema field type. */
function Control({ def, value, onChange, d, input, greeting }) {
  switch (def.type) {
    case "text":
      return <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={{ ...input, width: "100%" }} />;
    case "mono":
      return <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={{ ...input, width: 180, maxWidth: "100%", fontFamily: MONO }} />;
    case "time":
      return <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="14:00" style={{ ...input, width: 90, fontFamily: MONO }} />;
    case "number":
      return <input value={value ?? ""} onChange={(e) => onChange(digits(e.target.value))} inputMode="numeric" style={{ ...input, width: 90, fontFamily: MONO }} />;
    case "area":
      return <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={3} style={{ ...input, height: "auto", width: "100%", minHeight: 64, padding: "7px 10px", lineHeight: 1.5, resize: "vertical" }} />;
    case "hours":
      return <Hours value={value} onChange={onChange} d={d} input={input} />;
    case "toggle":
      return (
        <button type="button" onClick={() => onChange(!value)} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: d.fs.body, color: "#1F1B16", textAlign: "left", minHeight: d.row }}>
          <Switch on={!!value} />
          {def.on}
        </button>
      );
    case "chips":
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {def.opts.map((o) => <Chip key={o} d={d} on={value === o} onClick={() => onChange(o)}>{o}</Chip>)}
        </div>
      );
    case "multi": {
      const list = value || [];
      const extras = list.filter((x) => !def.opts.includes(x));
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {[...def.opts, ...extras].map((o) => {
            const on = list.includes(o);
            return <Chip key={o} d={d} filled on={on} onClick={() => onChange(on ? list.filter((x) => x !== o) : [...list, o])}>{o}</Chip>;
          })}
        </div>
      );
    }
    case "tags":
      return <Tags value={value} onChange={onChange} d={d} input={input} />;
    case "list":
      return <ListRows value={value} onChange={onChange} cols={def.cols} d={d} input={input} />;
    case "voice":
      return <VoicePick value={value} onChange={onChange} d={d} greeting={greeting} />;
    default:
      return null;
  }
}

function FieldRow({ k, x, app, d, phone, greeting }) {
  const def = FIELDS[k];
  const conflict = x.st === "conflict";
  const fill = needsFill(x);
  const warn = conflict || fill;
  const input = { height: d.input, minWidth: 0, border: "1px solid #D9D0BF", borderRadius: 8, padding: "0 10px", fontSize: d.fs.body, background: "#fff", color: "#1F1B16" };
  const border = `1px ${warn || x.st !== "ok" ? "dashed" : "solid"} ${warn ? "#A0412D" : x.st === "ok" ? "#EFE9DD" : "#C9BCA5"}`;
  return (
    <div data-f={k} style={{ display: "grid", gridTemplateColumns: phone ? "minmax(0,1fr)" : "170px minmax(0,1fr)", gap: phone ? 5 : 12, alignItems: def.type === "list" || def.type === "area" ? "start" : "center", padding: "6px 8px", borderRadius: 8, border, background: warn ? "#FBF8F2" : "#fff" }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", paddingTop: def.type === "list" || def.type === "area" ? 7 : 0 }}>
        <span style={{ fontSize: d.fs.small, color: "#4A4239", lineHeight: 1.4 }}>{def.label}</span>
        {fill && <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.12em", padding: "2px 5px", borderRadius: 4, background: "#F6E7E1", color: "#A0412D" }}>CẦN BẠN ĐIỀN</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
        {conflict ? (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(x.alts || []).map((alt) => (
              <button key={`${alt.v}-${alt.src?.t}`} type="button" className="h-clayline" onClick={() => app.pickAlt(k, alt)} style={{ height: d.input, padding: "0 12px", border: "1px solid #D9D0BF", borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontFamily: def.type === "time" ? MONO : undefined, fontSize: d.fs.body, color: "#1F1B16" }}>{Array.isArray(alt.v) ? alt.v.join(", ") : String(alt.v)}</span>
                <span style={{ fontSize: d.fs.tiny, color: "#6E6255" }}>· {SOURCE_LABEL[alt.src?.t] || "nguồn khác"}</span>
              </button>
            ))}
          </div>
        ) : (
          <Control def={def} value={x.v} onChange={(v) => app.setVal(k, v)} d={d} input={input} greeting={greeting} />
        )}
        {def.note && (
          <span style={{ display: "flex", gap: 7, alignItems: "center", fontSize: d.fs.tiny, color: "#6E6255" }}>
            <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.12em", border: "1px solid #6E6255", borderRadius: 4, padding: "1px 4px" }}>KHÓA</span>
            {def.note}
          </span>
        )}
      </div>
    </div>
  );
}

// ── a room type ───────────────────────────────────────────────────────────

const MODES = [
  { key: "daily", l: "Theo ngày", inputs: [["Ngày thường", "wd", "đ"], ["Cuối tuần", "we", "đ"]] },
  { key: "overnight", l: "Qua đêm", inputs: [["Giá", "price", "đ"], ["Từ", "from", ""], ["Tới", "to", ""]] },
  { key: "hourly", l: "Theo giờ", inputs: [["2 giờ đầu", "h2", "đ"], ["Mỗi giờ sau", "hn", "đ"]] },
  { key: "monthly", l: "Theo tháng", inputs: [["Giá", "price", "đ"]] },
];

function RoomCard({ r, i, open, onToggle, app, d, phone }) {
  const input = { height: d.input, minWidth: 0, border: "1px solid #D9D0BF", borderRadius: 8, padding: "0 10px", fontSize: d.fs.body, background: "#fff", color: "#1F1B16" };
  const set = (patch) => app.setRoom(i, patch);
  const parts = [];
  if (r.daily?.on) parts.push(`Theo ngày ${fmt(r.daily.wd)}${r.daily.we && r.daily.we !== r.daily.wd ? `–${fmt(r.daily.we)}` : ""}đ`);
  if (r.overnight?.on) parts.push(`Qua đêm ${fmt(r.overnight.price)}đ`);
  if (r.hourly?.on) parts.push(`Theo giờ ${fmt(r.hourly.h2)}đ`);
  if (r.monthly?.on) parts.push(`Theo tháng ${fmt(r.monthly.price)}đ`);
  const meta = [r.count && `${r.count} phòng`, r.size && `${r.size} m²`, r.bed, r.maxAdults && `tối đa ${r.maxAdults} người lớn`].filter(Boolean).join(" · ");
  const ok = r.st === "ok";
  return (
    <div data-f={`room:${i}`} style={{ background: "#fff", border: `1px ${ok ? "solid" : "dashed"} ${ok ? "#E4DCCB" : "#C9BCA5"}`, borderRadius: 10, overflow: "hidden" }}>
      <button type="button" onClick={onToggle} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 3, padding: "9px 12px", textAlign: "left" }}>
        <span style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", width: "100%" }}>
          <span style={{ fontSize: d.fs.title, fontWeight: 600, color: "#1F1B16" }}>{r.name}</span>
          <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.1em", padding: "2px 7px", borderRadius: 9, whiteSpace: "nowrap", border: `1px solid ${ok ? "#D9D0BF" : "#7B4A2D"}`, color: ok ? "#4A6B3A" : "#7B4A2D" }}>{ok ? "✓" : `XEM LẠI${r.src ? ` · ${(SOURCE_LABEL[r.src.t] || "").toUpperCase()}` : ""}`}</span>
        </span>
        {meta && <span style={{ fontSize: d.fs.small, color: "#4A4239", lineHeight: 1.4 }}>{meta}</span>}
        <span style={{ fontFamily: MONO, fontSize: 11, color: "#1F1B16", lineHeight: 1.5 }}>{parts.join(" · ") || "Chưa có giá"}</span>
      </button>
      {open && (
        <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid #EFE9DD" }}>
          <div style={{ display: "grid", gridTemplateColumns: phone ? "1fr 1fr" : "repeat(auto-fill,minmax(150px,1fr))", gap: 7 }}>
            {["name", "count", "bed", "maxAdults", "maxChildren", "size", "view", "floor", "extraBed"].map((k) => {
              const def = ROOM_FIELDS[k];
              const num = def.type === "number";
              return (
                <label key={k} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                  <span style={{ fontSize: d.fs.tiny, color: "#6E6255" }}>{def.label}</span>
                  <input value={r[k] ?? ""} onChange={(e) => set({ [k]: num ? digits(e.target.value) : e.target.value })} inputMode={num ? "numeric" : undefined} style={{ ...input, width: "100%" }} />
                </label>
              );
            })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: phone ? "minmax(0,1fr)" : "140px minmax(0,1fr)", gap: "7px 12px", alignItems: "center" }}>
            <span style={{ fontSize: d.fs.tiny, color: "#6E6255" }}>{ROOM_FIELDS.bath.label}</span>
            <div style={{ display: "flex", gap: 5 }}>{ROOM_FIELDS.bath.opts.map((o) => <Chip key={o} d={d} on={r.bath === o} onClick={() => set({ bath: o })}>{o}</Chip>)}</div>
            <span style={{ fontSize: d.fs.tiny, color: "#6E6255" }}>{ROOM_FIELDS.aliases.label}</span>
            <Tags value={r.aliases} onChange={(v) => set({ aliases: v })} d={d} input={input} />
            <span style={{ fontSize: d.fs.tiny, color: "#6E6255" }}>{ROOM_FIELDS.extras.label}</span>
            <Tags value={r.extras} onChange={(v) => set({ extras: v })} d={d} input={input} />
          </div>
          {MODES.map((m) => {
            const mode = r[m.key] || { on: false };
            return (
              <div key={m.key} style={{ display: "flex", flexDirection: "column", gap: 7, padding: "8px 10px", borderRadius: 8, background: mode.on ? "#FFFFFF" : "#FAF7F1", border: "1px solid #EFE9DD" }}>
                <button type="button" onClick={() => set({ [m.key]: { ...mode, on: !mode.on } })} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: d.fs.body, fontWeight: 600, color: mode.on ? "#1F1B16" : "#6E6255", minHeight: 26, width: "max-content" }}>
                  <Switch on={!!mode.on} />
                  {m.l}
                  <span style={{ fontWeight: 400, fontSize: d.fs.small, color: "#6E6255" }}>{mode.on ? "" : "· tắt"}</span>
                </button>
                {mode.on && (
                  <div style={{ display: "grid", gridTemplateColumns: m.inputs.length === 3 ? (phone ? "1fr 1fr" : "1.4fr 1fr 1fr") : m.inputs.length === 2 ? "1fr 1fr" : "minmax(0,200px)", gap: 7 }}>
                    {m.inputs.map(([l, k, suf]) => (
                      <label key={k} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                        <span style={{ fontSize: d.fs.tiny, color: "#6E6255" }}>{l}</span>
                        <span style={{ position: "relative", display: "block" }}>
                          <input value={suf ? fmt(mode[k]) : mode[k] ?? ""} onChange={(e) => set({ [m.key]: { ...mode, [k]: suf ? Number(digits(e.target.value)) || "" : e.target.value } })} inputMode={suf ? "numeric" : "text"} style={{ ...input, width: "100%", padding: "0 24px 0 10px", fontFamily: MONO, textAlign: "right" }} />
                          <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", fontSize: d.fs.small, color: "#6E6255" }}>{suf}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button type="button" onClick={() => app.removeRoom(i)} style={{ height: d.btnSm, padding: "0 4px", fontSize: d.fs.small, color: "#A0412D" }}>Xóa loại phòng</button>
            {!ok && <button type="button" className="b-primary" onClick={() => set({ st: "ok" })} style={{ height: d.btn, padding: "0 16px", borderRadius: d.btn / 2, fontSize: d.fs.small }}>Đúng giá này</button>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── the page ──────────────────────────────────────────────────────────────

export function Settings() {
  const app = useApp();
  const { phone } = useLayout();
  const d = dims(phone);
  const [, navigate] = useLocation();
  const search = useSearch();
  const { values, rooms } = app.settings;
  const greeting = flat(app.settings).greeting;
  const scRef = useRef(null);
  const [active, setActive] = useState(SECTIONS[0].key);
  const [openRoom, setOpenRoom] = useState(null);
  const fromSetup = new URLSearchParams(search).has("xem-lai");

  const pend = pendingList(app.settings);
  const pendN = pend.length;
  const review = fromSetup || pendN > 0;

  const jump = (sec, fk) => {
    if (fk && fk.startsWith("room:")) setOpenRoom(Number(fk.split(":")[1]));
    setTimeout(() => {
      const sc = scRef.current;
      if (!sc) return;
      const el = (fk && sc.querySelector(`[data-f="${fk}"]`)) || sc.querySelector(`[data-sec="${sec}"]`);
      if (!el) return;
      const top = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - (phone ? 110 : 20);
      sc.scrollTo({ top, behavior: "smooth" });
    }, 40);
  };

  useEffect(() => {
    const h = window.location.hash.replace("#", "");
    if (SECTIONS.some((s) => s.key === h)) setTimeout(() => jump(h), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = () => {
    const sc = scRef.current;
    if (!sc) return;
    let a = SECTIONS[0].key;
    SECTIONS.forEach((s) => {
      const el = sc.querySelector(`[data-sec="${s.key}"]`);
      if (el && el.getBoundingClientRect().top - sc.getBoundingClientRect().top < 140) a = s.key;
    });
    if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 4) a = SECTIONS[SECTIONS.length - 1].key;
    if (a !== active) setActive(a);
  };

  const dirtyN = (() => {
    const s = JSON.parse(app.settings.saved);
    let c = 0;
    Object.keys(values).forEach((k) => {
      if (JSON.stringify(values[k]) !== JSON.stringify(s.values[k])) c++;
    });
    if (rooms.length !== s.rooms.length) c++;
    rooms.forEach((r, i) => {
      if (JSON.stringify(r) !== JSON.stringify(s.rooms[i])) c++;
    });
    return c;
  })();

  const topH = phone ? "var(--tt-top)" : "56px";
  const revH = review ? (phone ? 50 : 44) : 0;
  const smallBtn = { height: d.btnSm, padding: "0 12px", borderRadius: d.btnSm / 2, fontSize: d.fs.small, whiteSpace: "nowrap" };

  const cards = (sec) =>
    sec.cards.map(([title, keys]) => {
      const p = keys.filter((k) => values[k] && values[k].st === "new" && !needsFill(values[k]));
      return (
        <div key={title} style={{ background: "#fff", border: "1px solid #E4DCCB", borderRadius: 12, padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "0 2px 3px", minHeight: 28 }}>
            <span style={{ fontSize: d.fs.title, fontWeight: 600 }}>{title}</span>
            {p.length > 0 && <button type="button" className="b-ghost" onClick={() => app.confirmKeys(p)} style={smallBtn}>Đúng hết · {p.length}</button>}
          </div>
          {keys.filter((k) => values[k]).map((k) => <FieldRow key={k} k={k} x={values[k]} app={app} d={d} phone={phone} greeting={greeting} />)}
        </div>
      );
    });

  const roomsView = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 2px 0" }}>
        <span style={{ fontSize: d.fs.title, fontWeight: 600 }}>Từng loại phòng</span>
        <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.14em", color: "#6E6255", whiteSpace: "nowrap" }}>{rooms.reduce((a, r) => a + (Number(r.count) || 0), 0)} PHÒNG · {rooms.length} LOẠI</span>
      </div>
      {rooms.map((r, i) => <RoomCard key={i} r={r} i={i} open={openRoom === i} onToggle={() => setOpenRoom(openRoom === i ? null : i)} app={app} d={d} phone={phone} />)}
      <button type="button" onClick={() => { app.addRoom(); setOpenRoom(rooms.length); }} style={{ height: d.btn + 4, border: "1px dashed #C9BCA5", borderRadius: 10, fontSize: d.fs.body, color: "#4A4239", textAlign: "center" }}>+ Thêm loại phòng</button>
    </div>
  );

  const index = SECTIONS.map((s) => {
    const c = pend.filter((p) => p[0] === s.key).length;
    return { k: s.key, num: s.n, l: s.title, mark: c ? `${c} cần xem lại` : "✓ Đã xong", mc: c ? "#7B4A2D" : "#4A6B3A", badge: c ? String(c) : "✓", go: () => { setActive(s.key); jump(s.key); } };
  });
  const revGo = () => {
    if (pendN) {
      const [sec, fk] = pend[0];
      setActive(sec);
      jump(sec, fk);
    } else navigate("/thu-bonia");
  };

  return (
    <div style={{ position: "absolute", inset: 0, background: "#F2EEE6", overflow: "hidden" }}>
      {!phone && <DeskHeader active={2} solid />}
      {review && (
        <div style={{ position: "absolute", left: 0, right: 0, top: topH, height: revH, zIndex: 3, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: `0 ${phone ? 16 : 48}px`, background: pendN ? "#FBF5EC" : "#EEF0E6", borderBottom: "1px solid #D9D0BF" }}>
          <span style={{ fontSize: d.fs.body, fontWeight: 600, color: pendN ? "#7B4A2D" : "#4A6B3A" }}>{pendN ? `Còn ${pendN} mục cần xem lại` : "Đã xem lại hết"}</span>
          <button type="button" className="b-primary" onClick={revGo} style={{ ...smallBtn, height: d.btnSm + 2, padding: "0 14px" }}>{pendN ? (phone ? "Mục tiếp" : "Tới mục tiếp theo") : "Thử Bonia →"}</button>
        </div>
      )}
      <div ref={scRef} onScroll={onScroll} style={{ position: "absolute", left: 0, right: 0, top: `calc(${topH} + ${revH}px)`, bottom: phone ? "calc(57px + var(--tt-bot))" : 0, overflow: "auto" }}>
        {phone && (
          <div style={{ position: "sticky", top: 0, zIndex: 2, background: "#F2EEE6", padding: "6px 16px 8px", display: "flex", flexDirection: "column", gap: 6, borderBottom: "1px solid #E4DCCB" }}>
            <span style={{ fontFamily: SERIF, fontSize: d.fs.h1 }}>Cài đặt</span>
            <div className="tt-scroll-x" style={{ display: "flex", gap: 5, margin: "0 -16px", padding: "0 16px" }}>
              {index.map((it) => {
                const on = active === it.k;
                return (
                  <button key={it.k} type="button" onClick={it.go} style={{ height: d.chip, padding: "0 11px", borderRadius: d.chip / 2, border: `1px solid ${on ? "#1F1B16" : "#D9D0BF"}`, background: on ? "#1F1B16" : "#fff", color: on ? "#F7F3EC" : "#1F1B16", fontSize: d.fs.small, whiteSpace: "nowrap", flex: "none" }}>
                    {it.l}
                    <span style={{ fontFamily: MONO, fontSize: 10, marginLeft: 5, color: on ? "#F7F3EC" : it.mc }}>{it.badge}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: phone ? "12px 16px 110px" : "24px 48px 110px", display: "grid", gridTemplateColumns: phone ? "minmax(0,1fr)" : "200px minmax(0,1fr)", gap: 40, alignItems: "start" }}>
          {!phone && (
            <aside style={{ position: "sticky", top: 20, display: "flex", flexDirection: "column", gap: 1 }}>
              {index.map((it) => {
                const on = active === it.k;
                return (
                  <button key={it.k} type="button" onClick={it.go} className="h-white" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1, padding: "7px 10px", borderRadius: 8, background: on ? "#FFFFFF" : "transparent", textAlign: "left" }}>
                    <span style={{ display: "flex", gap: 9, alignItems: "baseline" }}>
                      <span style={{ fontFamily: MONO, fontSize: 9.5, color: "#6E6255", width: 16 }}>{it.num}</span>
                      <span style={{ fontSize: d.fs.body, fontWeight: on ? 600 : 400 }}>{it.l}</span>
                    </span>
                    <span style={{ paddingLeft: 25, fontSize: d.fs.tiny, color: it.mc }}>{it.mark}</span>
                  </button>
                );
              })}
            </aside>
          )}
          <main style={{ display: "flex", flexDirection: "column", gap: 30, minWidth: 0 }}>
            {SECTIONS.map((sec) => (
              <section key={sec.key} data-sec={sec.key} id={sec.key} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.2em", color: "#6E6255" }}>{sec.n}</span>
                  <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 20 }}>{sec.title}</h2>
                </div>
                {cards(sec)}
                {sec.rooms && roomsView()}
              </section>
            ))}
          </main>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: phone ? "calc(57px + var(--tt-bot))" : 0, zIndex: 4, display: "flex", justifyContent: "center", padding: `8px ${phone ? 16 : 48}px`, background: "#fff", borderTop: "1px solid #D9D0BF", transform: dirtyN ? "translateY(0)" : "translateY(120%)", opacity: dirtyN ? 1 : 0, pointerEvents: dirtyN ? "auto" : "none", transition: `transform 280ms ${EASE}, opacity 200ms ease` }}>
        <div style={{ width: "100%", maxWidth: 1100, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: d.fs.body }}>{dirtyN} thay đổi chưa lưu</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="b-ghost" onClick={app.discard} style={{ ...smallBtn, height: d.btn, borderRadius: d.btn / 2 }}>Bỏ thay đổi</button>
            <button type="button" className="b-primary" onClick={app.save} style={{ ...smallBtn, height: d.btn, padding: "0 20px", borderRadius: d.btn / 2 }}>Lưu</button>
          </div>
        </div>
      </div>
      {phone && <PhoneTabs active={2} />}
    </div>
  );
}
