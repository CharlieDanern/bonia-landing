import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useSearch } from "wouter";
import { FIELDS, ROOM_FIELDS, SECTIONS, SOURCE_LABEL, placeholderOf } from "../data/hotelSchema.js";
import { upcomingHolidays } from "../data/vnHolidays.js";
import { VOICE_GROUPS, flat, needsFill, pendingList } from "../data/settings.js";
import { DeskHeader, PhoneTabs, Switch, useLayout } from "../layout.jsx";
import { Orb } from "../components/Orb.jsx";
import { useApp } from "../state.jsx";
import { EASE, MONO, SERIF, dims } from "../ui.js";
import { playVoice } from "../voice.js";

// Cài đặt: the hotel profile (HOTEL_SETTINGS_FIELDS.md v2), nine sections
// drawn from data/hotelSchema.js. First visit (founder 2026-10-05): Bonia
// offers to fill everything from the web; while it searches a loading screen
// shows; what it found is dashed with its source (another source's reading
// is a hint to swap in); the owner edits, and Lưu confirms everything.

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
          <button type="button" aria-label="Xóa dòng" onClick={() => onChange(rows.filter((_, k) => k !== i))} className="h-line" style={{ width: 28, height: 28, borderRadius: 14, fontSize: 11, lineHeight: 1, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#6E6255" }}>✕</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...rows, ["", ""]])} style={{ alignSelf: "flex-start", height: d.btnSm, padding: "0 4px", fontSize: d.fs.small, color: "#7B4A2D" }}>+ Thêm dòng</button>
    </div>
  );
}

/** Khuyến mãi (founder 2026-10-05): each one with its title, dates, details and price; an expired one is never offered on a call. */
function PromoList({ value, onChange, d, input }) {
  const rows = Array.isArray(value) ? value.map((r) => (Array.isArray(r) ? { title: r[0] || "", details: r[1] || "", from: "", to: "", price: "" } : r)) : [];
  const set = (i, patch) => onChange(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
  const lab = { display: "flex", flexDirection: "column", gap: 4, minWidth: 0 };
  const cap = { fontSize: d.fs.tiny, color: "#6E6255" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((r, i) => {
        const over = r.to && r.to < today;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 7, padding: "10px 12px", border: `1px solid ${over ? "#E4DCCB" : "#D9D0BF"}`, borderRadius: 10, background: over ? "#FAF7F1" : "#fff" }}>
            <label style={lab}>
              <span style={cap}>Tên ưu đãi{over ? " · đã hết hạn, Bonia không giới thiệu" : ""}</span>
              <input value={r.title || ""} onChange={(e) => set(i, { title: e.target.value })} placeholder="Vd: Ở 3 đêm tặng 1 đêm" style={{ ...input, width: "100%", fontWeight: 600 }} />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              <label style={lab}><span style={cap}>Áp dụng từ</span><input type="date" value={r.from || ""} onChange={(e) => set(i, { from: e.target.value })} style={{ ...input, width: "100%" }} /></label>
              <label style={lab}><span style={cap}>Tới</span><input type="date" value={r.to || ""} onChange={(e) => set(i, { to: e.target.value })} style={{ ...input, width: "100%" }} /></label>
            </div>
            <label style={lab}>
              <span style={cap}>Chi tiết</span>
              <textarea value={r.details || ""} onChange={(e) => set(i, { details: e.target.value })} rows={2} placeholder="Gồm những gì, áp dụng cho phòng nào, điều kiện" style={{ ...input, height: "auto", width: "100%", padding: "7px 10px", lineHeight: 1.5, resize: "vertical" }} />
            </label>
            <label style={lab}>
              <span style={cap}>Giá</span>
              <input value={r.price || ""} onChange={(e) => set(i, { price: e.target.value })} placeholder="Vd: 2.250.000đ cho 4 đêm" style={{ ...input, width: "100%" }} />
            </label>
            <button type="button" onClick={() => onChange(rows.filter((_, k) => k !== i))} style={{ alignSelf: "flex-start", height: d.btnSm, padding: "0 4px", fontSize: d.fs.small, color: "#A0412D" }}>Xóa ưu đãi</button>
          </div>
        );
      })}
      <button type="button" onClick={() => onChange([...rows, { title: "", from: "", to: "", details: "", price: "" }])} style={{ alignSelf: "flex-start", height: d.btnSm, padding: "0 4px", fontSize: d.fs.small, color: "#7B4A2D" }}>+ Thêm ưu đãi</button>
    </div>
  );
}

const todayVN = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
const dmy = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  return m ? `${+m[3]}/${+m[2]}/${m[1]}` : "";
};
/** "4/2 – 10/2/2027", "24/11/2026" */
const dateRange = (from, to) => {
  if (!from) return "";
  if (!to || to === from) return dmy(from);
  const [a, b] = [dmy(from), dmy(to)];
  return from.slice(0, 4) === to.slice(0, 4) ? `${a.replace(/\/\d{4}$/, "")} – ${b}` : `${a} – ${b}`;
};

/** Hotline (founder 2026-10-05): one box per number, and a button for more. */
function PhoneList({ value, onChange, d, input }) {
  const rows = Array.isArray(value) ? value : value ? [String(value)] : [];
  const shown = rows.length ? rows : [""];
  const set = (i, t) => onChange(shown.map((x, k) => (k === i ? t : x)));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start" }}>
      {shown.map((n, i) => (
        <div key={i} style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <input value={n} onChange={(e) => set(i, e.target.value)} inputMode="tel" placeholder="0900 000 000" aria-label={`Số ${i + 1}`} style={{ ...input, width: 180, maxWidth: "100%", fontFamily: MONO }} />
          {shown.length > 1 && <button type="button" aria-label="Xóa số này" onClick={() => onChange(shown.filter((_, k) => k !== i))} className="h-line" style={{ width: 28, height: 28, borderRadius: 14, fontSize: 11, lineHeight: 1, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#6E6255" }}>✕</button>}
        </div>
      ))}
      <button type="button" onClick={() => onChange([...shown, ""])} style={{ height: d.btnSm, padding: "0 4px", fontSize: d.fs.small, color: "#7B4A2D" }}>+ Thêm số</button>
    </div>
  );
}

/**
 * Hoạt động, trải nghiệm (founder 2026-10-05): each one is either "Đã gồm trong giá
 * phòng" (a note: hours, booking ahead) or "Tính phí" with its price, two buttons
 * so every owner says it the same way. Neither: not known yet (Bonia says it has
 * no information).
 */
function PricedList({ value, onChange, d, input }) {
  const rows = Array.isArray(value) ? value : [];
  const set = (i, patch) => onChange(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", padding: "7px 8px", border: "1px solid #EFE9DD", borderRadius: 9 }}>
          <input value={r.name || ""} onChange={(e) => set(i, { name: e.target.value })} placeholder="Hoạt động, vd cưỡi ngựa" style={{ ...input, flex: "1 1 180px", minWidth: 0 }} />
          <span style={{ display: "flex", gap: 5, flex: "none" }}>
            <Chip d={d} filled on={r.included === true} onClick={() => set(i, { included: r.included === true ? null : true })}>Đã gồm trong giá phòng</Chip>
            <Chip d={d} filled on={r.included === false} onClick={() => set(i, { included: r.included === false ? null : false })}>Tính phí</Chip>
          </span>
          {r.included === false && <input value={r.price || ""} onChange={(e) => set(i, { price: e.target.value })} placeholder="Giá, vd 150.000đ/người" style={{ ...input, flex: "1 1 150px", minWidth: 0 }} />}
          {(r.included === true || (r.included == null && r.note)) && <input value={r.note || ""} onChange={(e) => set(i, { note: e.target.value })} placeholder="Ghi chú, vd buổi sáng 7:00–9:00" style={{ ...input, flex: "1 1 150px", minWidth: 0 }} />}
          <button type="button" aria-label="Xóa hoạt động" onClick={() => onChange(rows.filter((_, k) => k !== i))} className="h-line" style={{ width: 28, height: 28, marginLeft: "auto", borderRadius: 14, fontSize: 11, lineHeight: 1, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#6E6255", flex: "none" }}>✕</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...rows, { name: "", included: null, price: "", note: "" }])} style={{ alignSelf: "flex-start", height: d.btnSm, padding: "0 4px", fontSize: d.fs.small, color: "#7B4A2D" }}>+ Thêm hoạt động</button>
    </div>
  );
}

/** "+ thêm" beside a multi's options (founder 2026-10-05: amenities the list doesn't have). */
function AddItem({ list, onChange, d, input }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (t && !list.includes(t)) onChange([...list, t]);
    setDraft("");
  };
  return (
    <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} onBlur={add} placeholder="+ thêm" aria-label="Thêm mục khác" style={{ ...input, width: 120, height: d.chip, borderRadius: d.chip / 2, borderStyle: "dashed" }} />
  );
}

/**
 * Ngày lễ, Tết (founder 2026-10-05): we know Vietnam's holidays, so the owner picks
 * them from a list (data/vnHolidays.js, Tết by the lunar calendar) and sets each
 * one's price; their own dates too. A past one is never used on a call.
 */
function HolidayList({ value, onChange, d, input, host, phone }) {
  const rows = Array.isArray(value) ? value : [];
  const [picking, setPicking] = useState(false);
  const set = (i, patch) => onChange(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  const today = todayVN();
  const lab = { display: "flex", flexDirection: "column", gap: 4, minWidth: 0 };
  const cap = { fontSize: d.fs.tiny, color: "#6E6255" };
  const add = (picked) => {
    const all = [...rows, ...picked];
    // by date, the owner's undated ones last
    onChange(all.sort((a, b) => (a.from || "9999").localeCompare(b.from || "9999")));
    setPicking(false);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((r, i) => {
        const over = r.to && r.to < today;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 7, padding: "10px 12px", border: `1px solid ${over ? "#E4DCCB" : "#D9D0BF"}`, borderRadius: 10, background: over ? "#FAF7F1" : "#fff" }}>
            <label style={lab}>
              <span style={cap}>Dịp{over ? " · đã qua, Bonia không dùng" : ""}</span>
              <input value={r.title || ""} onChange={(e) => set(i, { title: e.target.value })} placeholder="Vd: Lễ hội pháo hoa" style={{ ...input, width: "100%", fontWeight: 600 }} />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              <label style={lab}><span style={cap}>Từ ngày</span><input type="date" value={r.from || ""} onChange={(e) => set(i, { from: e.target.value })} style={{ ...input, width: "100%" }} /></label>
              <label style={lab}><span style={cap}>Tới ngày</span><input type="date" value={r.to || ""} onChange={(e) => set(i, { to: e.target.value })} style={{ ...input, width: "100%" }} /></label>
            </div>
            <label style={lab}>
              <span style={cap}>Giá dịp này</span>
              <input value={r.price || ""} onChange={(e) => set(i, { price: e.target.value })} placeholder="Vd: tăng 30%, hoặc 1.800.000đ/đêm" style={{ ...input, width: "100%" }} />
            </label>
            <button type="button" onClick={() => onChange(rows.filter((_, k) => k !== i))} style={{ alignSelf: "flex-start", height: d.btnSm, padding: "0 4px", fontSize: d.fs.small, color: "#A0412D" }}>Xóa dịp này</button>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" className="b-ghost" onClick={() => setPicking(true)} style={{ height: d.btnSm + 2, padding: "0 14px", borderRadius: (d.btnSm + 2) / 2, fontSize: d.fs.small }}>Chọn ngày lễ, Tết</button>
        <button type="button" onClick={() => onChange([...rows, { title: "", from: "", to: "", price: "" }])} style={{ height: d.btnSm, padding: "0 4px", fontSize: d.fs.small, color: "#7B4A2D" }}>+ Thêm dịp khác</button>
      </div>
      {picking && host && createPortal(<HolidayPicker rows={rows} onAdd={add} onClose={() => setPicking(false)} d={d} phone={phone} />, host)}
    </div>
  );
}

function HolidayPicker({ rows, onAdd, onClose, d, phone }) {
  const today = todayVN();
  const list = upcomingHolidays(today).sort((a, b) => a.from.localeCompare(b.from));
  const key = (h) => `${h.id}:${h.from.slice(0, 4)}`;
  const has = (h) => rows.some((r) => r.title === h.title && (r.from || "").slice(0, 4) === h.from.slice(0, 4));
  // the official ones not added yet start ticked: most hotels price all of them
  const [on, setOn] = useState(() => new Set(list.filter((h) => h.official && !has(h)).map(key)));
  const toggle = (h) => setOn((s0) => { const s1 = new Set(s0); if (s1.has(key(h))) s1.delete(key(h)); else s1.add(key(h)); return s1; });
  const chosen = list.filter((h) => on.has(key(h)) && !has(h));
  const group = (title, items) => items.length > 0 && (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", color: "#6E6255" }}>{title}</span>
      {items.map((h) => {
        const added = has(h);
        const ticked = added || on.has(key(h));
        return (
          <button key={key(h)} type="button" disabled={added} onClick={() => toggle(h)} style={{ display: "grid", gridTemplateColumns: "22px minmax(0,1fr)", gap: 10, alignItems: "start", textAlign: "left", padding: "9px 12px", border: `1px solid ${ticked ? "#C9BCA5" : "#E4DCCB"}`, borderRadius: 10, background: ticked ? "#FBF8F2" : "#fff", opacity: added ? 0.6 : 1 }}>
            <span style={{ width: 18, height: 18, marginTop: 1, borderRadius: 5, border: `1.5px solid ${ticked ? "#7B4A2D" : "#C9BCA5"}`, background: ticked ? "#7B4A2D" : "#fff", color: "#fff", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>{ticked ? "✓" : ""}</span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={{ fontSize: d.fs.body, fontWeight: 600, color: "#1F1B16" }}>{h.title}{added ? " · đã có" : ""}</span>
              <span style={{ fontFamily: MONO, fontSize: 12, color: "#4A4239" }}>{dateRange(h.from, h.to)}</span>
              {h.note && <span style={{ fontSize: d.fs.tiny, color: "#6E6255", lineHeight: 1.45 }}>{h.note}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
  return (
    <Overlay phone={phone}>
      <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.18em", color: "#7B4A2D" }}>NGÀY LỄ, TẾT</span>
      <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: phone ? 22 : 25, lineHeight: 1.2 }}>Chọn các dịp khách sạn tính giá riêng</h2>
      <span style={{ fontSize: 13.5, lineHeight: 1.55, color: "#4A4239" }}>Ngày đã điền sẵn theo lịch nghỉ của nhà nước, Tết theo âm lịch. Thêm xong, bạn ghi giá cho từng dịp và sửa ngày nếu khách sạn tính khác.</span>
      {group("NGÀY NGHỈ LỄ CHÍNH THỨC", list.filter((h) => h.official))}
      {group("DỊP ĐÔNG KHÁCH KHÁC", list.filter((h) => !h.official))}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 2 }}>
        <button type="button" className="b-primary" disabled={!chosen.length} onClick={() => onAdd(chosen.map((h) => ({ title: h.title, from: h.from, to: h.to, price: "" })))} style={{ ...CENTER, height: 46, borderRadius: 23, fontSize: 14.5, opacity: chosen.length ? 1 : 0.5 }}>{chosen.length ? `Thêm ${chosen.length} dịp` : "Chọn ít nhất một dịp"}</button>
        <button type="button" onClick={onClose} style={{ ...CENTER, height: 40, fontSize: 13.5, color: "#6E6255" }}>Đóng</button>
      </div>
    </Overlay>
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

/** Giọng: by gender (founder 2026-10-06), a row of women's voices then a row of men's, each with a preview. */
function VoicePick({ value, onChange, d, greeting }) {
  const [playing, setPlaying] = useState(null);
  const stop = useRef(null);
  useEffect(() => () => stop.current?.(), []);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {VOICE_GROUPS.map((group) => (
        <div key={group[0][1]} style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {group.map(([i, label]) => {
            const on = value === i;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, height: d.chip + 4, padding: "0 3px 0 10px", borderRadius: (d.chip + 4) / 2, border: `1px solid ${on ? "#7B4A2D" : "#E4DCCB"}`, background: on ? "#FBF5EC" : "#fff" }}>
                <button type="button" onClick={() => onChange(i)} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: d.fs.small, color: "#1F1B16", height: "100%" }}>
                  <span style={{ width: 13, height: 13, borderRadius: 7, border: on ? "4px solid #7B4A2D" : "1.5px solid #C9BCA5", flex: "none" }} />
                  {label}
                </button>
                <button
                  type="button"
                  aria-label={`Nghe thử ${label.toLowerCase()}`}
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
      ))}
    </div>
  );
}

/** One control for a schema field type. */
function Control({ def, value, onChange, d, input, greeting, host, phone }) {
  switch (def.type) {
    case "text":
      return <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholderOf(def)} style={{ ...input, width: "100%" }} />;
    case "mono":
      return <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={def.ph} style={{ ...input, width: 180, maxWidth: "100%", fontFamily: MONO }} />;
    case "time":
      return <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="14:00" style={{ ...input, width: 90, fontFamily: MONO }} />;
    case "number":
      return <input value={value ?? ""} onChange={(e) => onChange(digits(e.target.value))} inputMode="numeric" style={{ ...input, width: 90, fontFamily: MONO }} />;
    case "area":
      return <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholderOf(def)} rows={def.rows || 3} style={{ ...input, height: "auto", width: "100%", minHeight: 22 * (def.rows || 3) - 2, padding: "7px 10px", lineHeight: 1.5, resize: "vertical" }} />;
    case "hours":
      return <Hours value={value} onChange={onChange} d={d} input={input} />;
    case "toggle":
      // nobody knows yet (the AI found nothing): ask, so "không" is the owner's answer and never a default
      if (value == null) return (
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 5, minHeight: d.row }}>
          <span style={{ fontSize: d.fs.body, color: "#1F1B16", marginRight: 4 }}>{def.on}?</span>
          <Chip d={d} on={false} onClick={() => onChange(true)}>Có</Chip>
          <Chip d={d} on={false} onClick={() => onChange(false)}>Không</Chip>
        </div>
      );
      return (
        <button type="button" onClick={() => onChange(!value)} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: d.fs.body, color: "#1F1B16", textAlign: "left", minHeight: d.row }}>
          <Switch on={!!value} />
          {def.on}
        </button>
      );
    case "chips":
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {[...def.opts, ...(value && !def.opts.includes(value) ? [value] : [])].map((o) => <Chip key={o} d={d} on={value === o} onClick={() => onChange(o)}>{o}</Chip>)}
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
          {def.more && <AddItem list={list} onChange={onChange} d={d} input={input} />}
        </div>
      );
    }
    case "tags":
      return <Tags value={value} onChange={onChange} d={d} input={input} />;
    case "list":
      return <ListRows value={value} onChange={onChange} cols={def.cols} d={d} input={input} />;
    case "promos":
      return <PromoList value={value} onChange={onChange} d={d} input={input} />;
    case "phones":
      return <PhoneList value={value} onChange={onChange} d={d} input={input} />;
    case "priced":
      return <PricedList value={value} onChange={onChange} d={d} input={input} />;
    case "holidays":
      return <HolidayList value={value} onChange={onChange} d={d} input={input} host={host} phone={phone} />;
    case "voice":
      return <VoicePick value={value} onChange={onChange} d={d} greeting={greeting} />;
    default:
      return null;
  }
}

const TOP_ALIGNED = ["list", "area", "promos", "holidays", "phones", "priced"];

function FieldRow({ k, x, app, d, phone, greeting, host }) {
  const def = FIELDS[k];
  const conflict = x.st === "conflict";
  const fill = needsFill(x, k);
  const warn = conflict || fill;
  const input = { height: d.input, minWidth: 0, border: "1px solid #D9D0BF", borderRadius: 8, padding: "0 10px", fontSize: d.fs.body, background: "#fff", color: "#1F1B16" };
  const border = `1px ${warn || x.st !== "ok" ? "dashed" : "solid"} ${warn ? "#A0412D" : x.st === "ok" ? "#EFE9DD" : "#C9BCA5"}`;
  return (
    <div data-f={k} style={{ display: "grid", gridTemplateColumns: phone ? "minmax(0,1fr)" : "170px minmax(0,1fr)", gap: phone ? 5 : 12, alignItems: TOP_ALIGNED.includes(def.type) ? "start" : "center", padding: "6px 8px", borderRadius: 8, border, background: warn ? "#FBF8F2" : "#fff" }}>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", paddingTop: TOP_ALIGNED.includes(def.type) ? 7 : 0 }}>
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
          <Control def={def} value={x.v} onChange={(v) => app.setVal(k, v)} d={d} input={input} greeting={greeting} host={host} phone={phone} />
        )}
        {!conflict && x.st === "new" && (x.alts || []).length > 0 && (
          <span style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", fontSize: d.fs.tiny, color: "#6E6255" }}>
            Nguồn khác ghi:
            {x.alts.map((alt) => (
              <button key={`${JSON.stringify(alt.v)}-${alt.src?.t}`} type="button" className="h-clayline" onClick={() => app.pickAlt(k, alt)} title="Dùng giá trị này" style={{ padding: "1px 8px", border: "1px solid #D9D0BF", borderRadius: 10, fontSize: d.fs.tiny, color: "#1F1B16", background: "#fff" }}>
                {Array.isArray(alt.v) ? alt.v.join(", ") : String(alt.v)} · {SOURCE_LABEL[alt.src?.t] || "nguồn khác"}
              </button>
            ))}
          </span>
        )}
        {!conflict && x.st === "new" && x.src?.t && SOURCE_LABEL[x.src.t] && !fill && (
          <span style={{ fontSize: d.fs.tiny, color: "#6E6255" }}>Bonia tìm thấy trên {SOURCE_LABEL[x.src.t]}</span>
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
  { key: "daily", l: "Theo ngày (để Bonia báo tham khảo)", inputs: [["Ngày thường", "wd", "đ"], ["Cuối tuần", "we", "đ"]] },
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
  // a price read on a booking site (the hotel's own site had none): an estimate until the owner saves
  const otaPrice = !ok && r.priceSrc && !["site", "owner"].includes(r.priceSrc.t) && SOURCE_LABEL[r.priceSrc.t];
  return (
    <div data-f={`room:${i}`} style={{ background: "#fff", border: `1px ${ok ? "solid" : "dashed"} ${ok ? "#E4DCCB" : "#C9BCA5"}`, borderRadius: 10, overflow: "hidden" }}>
      <button type="button" onClick={onToggle} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 3, padding: "9px 12px", textAlign: "left" }}>
        <span style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", width: "100%" }}>
          <span style={{ fontSize: d.fs.title, fontWeight: 600, color: "#1F1B16" }}>{r.name}</span>
          <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.1em", padding: "2px 7px", borderRadius: 9, whiteSpace: "nowrap", border: `1px solid ${ok ? "#D9D0BF" : "#7B4A2D"}`, color: ok ? "#4A6B3A" : "#7B4A2D" }}>{ok ? "✓" : `BONIA TÌM THẤY${r.src ? ` · ${(SOURCE_LABEL[r.src.t] || "").toUpperCase()}` : ""}`}</span>
        </span>
        {meta && <span style={{ fontSize: d.fs.small, color: "#4A4239", lineHeight: 1.4 }}>{meta}</span>}
        <span style={{ fontFamily: MONO, fontSize: 11, color: "#1F1B16", lineHeight: 1.5 }}>{parts.join(" · ") || "Chưa có giá"}</span>
        {parts.length > 0 && otaPrice && (
          <span style={{ fontSize: d.fs.tiny, color: "#7B4A2D" }}>
            {`Giá tham khảo trên ${SOURCE_LABEL[r.priceSrc.t]}: sửa lại theo giá của khách sạn`}
          </span>
        )}
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
            <span style={{ fontSize: d.fs.tiny, color: "#6E6255" }}>{ROOM_FIELDS.aliases.label}</span>
            <Tags value={r.aliases} onChange={(v) => set({ aliases: v })} d={d} input={input} />
            <span style={{ fontSize: d.fs.tiny, color: "#6E6255" }}>{ROOM_FIELDS.extras.label}</span>
            <Tags value={r.extras} onChange={(v) => set({ extras: v })} d={d} input={input} />
            <span style={{ fontSize: d.fs.tiny, color: "#6E6255", alignSelf: "start", paddingTop: 8 }}>{ROOM_FIELDS.notes.label}</span>
            <textarea value={r.notes ?? ""} onChange={(e) => set({ notes: e.target.value })} rows={2} placeholder="Điều riêng của loại phòng này. Để trống nếu không có" style={{ ...input, height: "auto", width: "100%", minHeight: 46, padding: "7px 10px", lineHeight: 1.5, resize: "vertical" }} />
          </div>
          {MODES.map((m) => {
            const mode = r[m.key] || { on: false };
            return (
              <div key={m.key} style={{ display: "flex", flexDirection: "column", gap: 7, padding: "8px 10px", borderRadius: 8, background: mode.on ? "#FFFFFF" : "#FAF7F1", border: "1px solid #EFE9DD" }}>
                <button type="button" onClick={() => set({ [m.key]: { ...mode, on: !mode.on } })} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: d.fs.body, fontWeight: 600, color: mode.on ? "#1F1B16" : "#6E6255", minHeight: 26, width: "max-content" }}>
                  <Switch on={!!mode.on} />
                  {m.l}
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
          </div>
        </div>
      )}
    </div>
  );
}

// ── first visit: the offer to fill everything from the web, and the wait ────

const LOOKUP_ERRORS = {
  daily_limit: "Hôm nay bạn đã tìm 5 lần. Bạn điền tay giúp, hoặc mai thử lại.",
  network: "Không kết nối được. Kiểm tra mạng rồi thử lại.",
  lookup_failed: "Bonia chưa tìm được lúc này. Thử lại, hoặc bạn điền tay giúp.",
};
const CENTER = { display: "flex", alignItems: "center", justifyContent: "center", width: "100%" };
const SOURCES_READ = "Trang web khách sạn · Google Maps · Booking.com · Agoda · Trip.com · Airbnb";

function Overlay({ children, phone }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 20, background: "rgba(242,238,230,0.92)", display: "flex", alignItems: phone ? "flex-start" : "center", justifyContent: "center", padding: phone ? "calc(var(--tt-top) + 16px) 16px 24px" : 24, overflow: "auto" }}>
      <div style={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: 14, padding: phone ? "20px 18px" : "28px 32px", background: "#fff", border: "1px solid #D9D0BF", borderRadius: 20, boxShadow: "0 12px 40px rgba(31,27,22,0.08)" }}>{children}</div>
    </div>
  );
}

function LookupOffer({ app, phone, d }) {
  const [name, setName] = useState(flat(app.settings).name || "");
  const [area, setArea] = useState("");
  const [url, setUrl] = useState("");
  const field = (l, v, set, ph, extra = {}) => (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 13, color: "#4A4239" }}>{l}</span>
      <input value={v} onChange={(e) => set(e.target.value)} placeholder={ph} style={{ height: 44, border: "1px solid #D9D0BF", borderRadius: 10, padding: "0 12px", fontSize: 14.5, background: "#fff", color: "#1F1B16" }} {...extra} />
    </label>
  );
  const ok = name.trim().length >= 2;
  return (
    <Overlay phone={phone}>
      <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.18em", color: "#7B4A2D" }}>CÀI ĐẶT LẦN ĐẦU</span>
      <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: phone ? 23 : 26, lineHeight: 1.2 }}>Để Bonia tự tìm thông tin khách sạn của bạn trên mạng?</h2>
      <span style={{ fontSize: 13.5, lineHeight: 1.55, color: "#4A4239" }}>Bonia đọc trang web của khách sạn và các trang đặt phòng, rồi điền sẵn vào Cài đặt. Bạn xem lại, sửa chỗ chưa đúng, rồi bấm Lưu.</span>
      {field("Tên khách sạn", name, setName, "Vd: Khách sạn Sân Nhài")}
      {field("Khu vực", area, setArea, "Vd: Mũi Né, Lâm Đồng (tên tỉnh cũ cũng được)")}
      {field("Trang web hoặc link Booking (không bắt buộc)", url, setUrl, "https://…", { inputMode: "url" })}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 2 }}>
        <button type="button" className="b-primary" disabled={!ok} onClick={() => app.startLookup({ name: name.trim(), area: area.trim(), urls: url.trim() ? [url.trim()] : [] })} style={{ ...CENTER, height: 46, borderRadius: 23, fontSize: 14.5, opacity: ok ? 1 : 0.5 }}>Có, tìm giúp tôi</button>
        <button type="button" className="b-ghost" disabled={!ok} onClick={() => app.startBlank(name.trim())} style={{ ...CENTER, height: 44, borderRadius: 22, fontSize: 14, opacity: ok ? 1 : 0.5 }}>Tôi tự điền</button>
      </div>
      <span style={{ fontSize: d.fs.tiny, color: "#6E6255", textAlign: "center" }}>Thường mất 1–2 phút.</span>
    </Overlay>
  );
}

function LookupWait({ app, phone, d }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(iv);
  }, []);
  const l = app.lookup;
  const s = Math.max(0, Math.floor((Date.now() - l.startedAt) / 1000));
  const reading = l.status === "running" || l.status === "pricing";
  if (l.status === "failed") {
    return (
      <Overlay phone={phone}>
        <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: phone ? 23 : 26, lineHeight: 1.2 }}>Chưa tìm được</h2>
        <span role="alert" style={{ fontSize: 13.5, lineHeight: 1.55, color: "#4A4239" }}>{LOOKUP_ERRORS[l.error] || LOOKUP_ERRORS.lookup_failed}</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {l.error !== "daily_limit" && <button type="button" className="b-primary" onClick={() => app.dismissLookup()} style={{ ...CENTER, height: 46, borderRadius: 23, fontSize: 14.5 }}>Thử lại</button>}
          <button type="button" className="b-ghost" onClick={() => app.startBlank(l.name)} style={{ ...CENTER, height: 44, borderRadius: 22, fontSize: 14 }}>Tôi tự điền</button>
        </div>
      </Overlay>
    );
  }
  return (
    <Overlay phone={phone}>
      <div style={{ display: "flex", justifyContent: "center" }}><Orb size={phone ? 150 : 180} mood="writing" tone="warm" lively /></div>
      <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: phone ? 22 : 25, lineHeight: 1.25, textAlign: "center" }}>{l.status === "pricing" ? `Bonia đang tìm giá từng loại phòng của ${l.picked.name}…` : reading ? `Bonia đang đọc thông tin của ${l.picked.name}…` : `Bonia đang tìm ${l.name} trên mạng…`}</h2>
      <span style={{ fontSize: 13.5, lineHeight: 1.55, color: "#4A4239", textAlign: "center" }}>{l.status === "pricing" ? "Trang của khách sạn chưa ghi đủ giá, nên Bonia lấy giá từng loại phòng trên Agoda, Trip.com, Traveloka. Sắp xong." : reading ? "Thường mất 1–2 phút. Cứ để trang này mở, xong Bonia điền sẵn vào Cài đặt để bạn xem lại." : "Vài giây thôi. Bonia sẽ hỏi bạn đúng khách sạn nào trước khi điền."}</span>
      <span style={{ fontFamily: MONO, fontSize: 22, color: "#7B4A2D", textAlign: "center" }}>{Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}</span>
      <span style={{ fontSize: d.fs.tiny, color: "#6E6255", textAlign: "center", lineHeight: 1.6 }}>{SOURCES_READ}</span>
    </Overlay>
  );
}

/** W4 "Đây có phải cơ sở của bạn?" — always asked, even with one match (a look-alike is never filled in);
 *  then the sector, pre-selected by Bonia, which the owner confirms or changes (handoff 14). */
const SECTORS = [["lodging", "Lưu trú"], ["other", "Khác"]];
const SECTOR_GUESS = "lodging"; // the lookup searches places to stay

function LookupChoose({ app, phone, d }) {
  const l = app.lookup;
  const none = l.status === "none";
  const [other, setOther] = useState(none);
  const [url, setUrl] = useState("");
  const [pick, setPick] = useState(0);
  const [sector, setSector] = useState(app.biz.sector || SECTOR_GUESS);
  const okUrl = /^https?:\/\/\S+\.\S+/.test(url.trim());
  const host = (u) => {
    try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; }
  };
  const card = (on) => ({ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3, textAlign: "left", padding: on ? "11px 15px" : "12px 16px", border: on ? "2px solid #7B4A2D" : "1px solid #D9D0BF", borderRadius: 12, background: on ? "#FBF5EC" : "#fff", color: "#1F1B16" });
  return (
    <Overlay phone={phone}>
      <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: phone ? 26 : 34, lineHeight: 1.15, letterSpacing: "-0.01em" }}>{none ? `Bonia chưa thấy ${l.name} trên mạng` : "Đây có phải cơ sở của bạn?"}</h2>
      {none && <span style={{ fontSize: 14, lineHeight: 1.55, color: "#4A4239" }}>Dán link trang web, Google Maps hoặc Booking của cơ sở để Bonia tìm lại, hoặc bạn tự điền.</span>}
      {!none && (
        <>
          <div role="radiogroup" aria-label="Cơ sở" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {l.candidates.map((c, i) => (
              <button key={i} type="button" role="radio" aria-checked={pick === i} onClick={() => setPick(i)} style={card(pick === i)}>
                <span style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{c.name}</span>
                {c.address && <span style={{ fontSize: 13.5, lineHeight: 1.45, color: "#4A4239" }}>{c.address}</span>}
                {(c.phone || c.url) && <span style={{ fontSize: d.fs.tiny, color: "#6E6255", lineHeight: 1.5 }}>{[c.phone, host(c.url) || SOURCE_LABEL[c.source]].filter(Boolean).join(" · ")}</span>}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 14, color: "#4A4239", paddingTop: 2 }}>Lĩnh vực</span>
          <div role="radiogroup" aria-label="Lĩnh vực" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {SECTORS.map(([k, label]) => (
              <button key={k} type="button" role="radio" aria-checked={sector === k} onClick={() => setSector(k)} style={{ ...card(sector === k), minHeight: 58, justifyContent: "center", gap: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{label}</span>
                {k === SECTOR_GUESS && <span style={{ fontSize: 12, color: "#6E6255" }}>Bonia đoán</span>}
              </button>
            ))}
          </div>
          <button type="button" className="b-primary" onClick={() => app.pickCandidate(pick, sector)} style={{ ...CENTER, height: phone ? 50 : 54, borderRadius: 27, fontSize: 15.5 }}>Đúng, điền giúp tôi</button>
        </>
      )}
      {other ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#4A4239" }}>Link trang web, Google Maps hoặc Booking của cơ sở</span>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" inputMode="url" style={{ height: 44, border: "1px solid #D9D0BF", borderRadius: 10, padding: "0 12px", fontSize: 14.5, background: "#fff", color: "#1F1B16" }} />
          </label>
          <button type="button" className="b-primary" disabled={!okUrl} onClick={() => app.startLookup({ name: l.name, area: l.area || "", urls: [url.trim()] })} style={{ ...CENTER, height: 46, borderRadius: 23, fontSize: 14.5, opacity: okUrl ? 1 : 0.5 }}>Tìm lại với link này</button>
        </div>
      ) : (
        <button type="button" onClick={() => setOther(true)} style={{ ...CENTER, height: 36, fontSize: 13.5, color: "#7B4A2D" }}>Không có trong danh sách</button>
      )}
      <button type="button" onClick={() => app.startBlank(l.name)} style={{ ...CENTER, height: 36, fontSize: 13.5, color: "#6E6255" }}>Tôi tự điền</button>
    </Overlay>
  );
}

const SAVE_ERRORS = {
  stale: "Cài đặt vừa được lưu ở máy khác. Tải lại trang để xem bản mới rồi sửa lại.",
  network: "Chưa lưu được: không kết nối được. Thử lại.",
};

// ── the page ──────────────────────────────────────────────────────────────

export function Settings() {
  const app = useApp();
  const { phone, reduce } = useLayout();
  const d = dims(phone);
  const [, navigate] = useLocation();
  // the page's root: where the holiday picker opens (over the page, not inside the scrolling list)
  const [host, setHost] = useState(null);
  const lastNext = useRef(null);
  const search = useSearch();
  const { values, rooms } = app.settings;
  const greeting = flat(app.settings).greeting;
  const scRef = useRef(null);
  const [active, setActive] = useState(SECTIONS[0].key);
  const [openRoom, setOpenRoom] = useState(null);
  const fromSetup = new URLSearchParams(search).has("xem-lai");
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  // first visit: no profile saved yet (demo: right after the demo login, /cai-dat?moi=1)
  const firstRun = app.demo ? new URLSearchParams(search).has("moi") : !!app.account.firstRun;
  const offer = firstRun && !app.lookup;
  const waiting = app.lookup && ["identifying", "running", "pricing", "failed"].includes(app.lookup.status);
  const choosing = app.lookup && ["choose", "none"].includes(app.lookup.status);
  const found = app.lookup && app.lookup.status === "done" ? app.lookup : null;

  const pend = pendingList(app.settings);
  const pendN = pend.length;
  const fillN = pend.filter(([, fk]) => !fk.startsWith("room:") && needsFill(values[fk], fk)).length;
  const review = fromSetup || pendN > 0;
  // founder 2026-10-05: right after Lưu, "great, now let's test it out"; the owner taps through (no auto-open)
  const [savedPop, setSavedPop] = useState(false);
  const goTry = () => navigate("/thu-bonia");
  const onSave = async () => {
    setSaving(true);
    setSaveErr("");
    const r = await app.save();
    setSaving(false);
    if (r && r.error) return setSaveErr(SAVE_ERRORS[r.error] || "Chưa lưu được. Thử lại.");
    setSavedPop(true);
    return undefined;
  };

  const still = reduce || (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  const jump = (sec, fk, light = false) => {
    if (fk && fk.startsWith("room:")) setOpenRoom(Number(fk.split(":")[1]));
    setTimeout(() => {
      const sc = scRef.current;
      if (!sc) return;
      const el = (fk && sc.querySelector(`[data-f="${fk}"]`)) || sc.querySelector(`[data-sec="${sec}"]`);
      if (!el) return;
      const top = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - (phone ? 110 : 20);
      sc.scrollTo({ top, behavior: still ? "auto" : "smooth" });
      if (!light || !el.animate) return;
      // founder 2026-10-05: the item lights up once the page arrives, then fades out
      let done = false;
      const glow = () => {
        if (done) return;
        done = true;
        const bg = getComputedStyle(el).backgroundColor;
        el.animate(
          [
            { backgroundColor: bg, boxShadow: "0 0 0 0 rgba(201,138,58,0)" },
            { backgroundColor: "#FFF1D9", boxShadow: "0 0 0 4px rgba(201,138,58,0.38)", offset: 0.18 },
            { backgroundColor: bg, boxShadow: "0 0 0 0 rgba(201,138,58,0)" },
          ],
          { duration: still ? 900 : 1700, easing: "ease-out" },
        );
      };
      sc.addEventListener("scrollend", glow, { once: true });
      setTimeout(glow, still ? 0 : 650);
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
      return (
        <div key={title} style={{ background: "#fff", border: "1px solid #E4DCCB", borderRadius: 12, padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "0 2px 3px", minHeight: 28 }}>
            <span style={{ fontSize: d.fs.title, fontWeight: 600 }}>{title}</span>
          </div>
          {keys.filter((k) => values[k]).map((k) => <FieldRow key={k} k={k} x={values[k]} app={app} d={d} phone={phone} greeting={greeting} host={host} />)}
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
    // never saved yet (first visit, before or after "Tôi tự điền"): nothing to tick
    return { k: s.key, num: s.n, l: s.title, mark: c ? `${c} mục chưa lưu` : firstRun ? "" : "✓ Đã lưu", mc: c ? "#7B4A2D" : "#4A6B3A", badge: c ? String(c) : firstRun ? "" : "✓", go: () => { setActive(s.key); jump(s.key); } };
  });
  // "Tới mục tiếp theo": the next unsaved item after the one shown last (or below where the owner scrolled), then round
  // to the top. Items stay unsaved until Lưu, so always going to the first one never moved (founder 2026-10-05).
  const revGo = () => {
    if (!pendN) return navigate("/thu-bonia");
    const sc = scRef.current;
    const offset = phone ? 110 : 20;
    const pos = (fk) => {
      const el = sc?.querySelector(`[data-f="${fk}"]`);
      return el ? el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop : -1;
    };
    const after = Math.max((sc?.scrollTop || 0) + offset + 8, lastNext.current && pend.some(([, fk]) => fk === lastNext.current) ? pos(lastNext.current) + 1 : 0);
    const next = pend.find(([, fk]) => pos(fk) >= after) || pend[0];
    lastNext.current = next[1];
    setActive(next[0]);
    jump(next[0], next[1], true);
    return undefined;
  };

  return (
    <div ref={setHost} style={{ position: "absolute", inset: 0, background: "#F2EEE6", overflow: "hidden" }}>
      {!phone && <DeskHeader active={2} solid />}
      {review && (
        <div style={{ position: "absolute", left: 0, right: 0, top: topH, height: revH, zIndex: 3, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: `0 ${phone ? 16 : 48}px`, background: pendN ? "#FBF5EC" : "#EEF0E6", borderBottom: "1px solid #D9D0BF" }}>
          <span style={{ fontSize: d.fs.body, fontWeight: 600, color: pendN ? "#7B4A2D" : "#4A6B3A", lineHeight: 1.35 }}>
            {!pendN ? "Đã lưu hết"
              : found && found.found === false ? `Bonia không tìm thấy ${found.name} trên mạng. Bạn điền giúp rồi bấm Lưu.`
                : phone ? `Bonia đã điền ${pendN - fillN} mục. Xem lại rồi bấm Lưu.`
                  : `Bonia đã điền ${pendN - fillN} mục${fillN ? `, ${fillN} mục cần bạn điền` : ""}. Xem lại, sửa nếu cần, rồi bấm Lưu.`}
          </span>
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
            {found && found.notes && (
              <div style={{ padding: "10px 14px", borderRadius: 12, background: "#FBF5EC", border: "1px solid #E4DCCB", fontSize: d.fs.small, lineHeight: 1.55, color: "#4A4239" }}>
                <b style={{ fontWeight: 600, color: "#7B4A2D" }}>Ghi chú của Bonia khi tìm: </b>{found.notes}
              </div>
            )}
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
          <span style={{ fontSize: d.fs.body, display: "flex", flexDirection: "column", gap: 2 }}>
            {dirtyN} thay đổi chưa lưu
            {saveErr && <span role="alert" style={{ fontSize: d.fs.tiny, color: "#A0412D" }}>{saveErr}</span>}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            {!found && <button type="button" className="b-ghost" onClick={app.discard} disabled={saving} style={{ ...smallBtn, height: d.btn, borderRadius: d.btn / 2 }}>Bỏ thay đổi</button>}
            <button type="button" className="b-primary" onClick={onSave} disabled={saving} style={{ ...smallBtn, height: d.btn, padding: "0 20px", borderRadius: d.btn / 2, opacity: saving ? 0.6 : 1 }}>{saving ? "Đang lưu…" : "Lưu"}</button>
          </div>
        </div>
      </div>
      {phone && <PhoneTabs active={2} />}
      {offer && <LookupOffer app={app} phone={phone} d={d} />}
      {waiting && <LookupWait app={app} phone={phone} d={d} />}
      {choosing && <LookupChoose key={app.lookup.startedAt} app={app} phone={phone} d={d} />}
      {savedPop && (
        <Overlay phone={phone}>
          <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.18em", color: "#4A6B3A" }}>✓ ĐÃ LƯU</span>
          <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: phone ? 23 : 26, lineHeight: 1.2 }}>Tuyệt vời! Giờ mình gọi thử Bonia nhé</h2>
          <span style={{ fontSize: 13.5, lineHeight: 1.55, color: "#4A4239" }}>Gọi như một vị khách để nghe Bonia trả lời bằng thông tin bạn vừa lưu. Chưa ưng chỗ nào thì quay lại Cài đặt sửa rồi thử lại.</span>
          <button type="button" className="b-primary" onClick={goTry} style={{ ...CENTER, height: 46, borderRadius: 23, fontSize: 14.5, marginTop: 2 }}>Thử Bonia →</button>
          <button type="button" onClick={() => setSavedPop(false)} style={{ ...CENTER, height: 40, fontSize: 13.5, color: "#6E6255" }}>Để sau</button>
        </Overlay>
      )}
    </div>
  );
}
