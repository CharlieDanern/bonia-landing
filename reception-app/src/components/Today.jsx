import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../state.jsx";
import { DEMO_LABEL } from "../lib/clock.js";
import { dayLabel, todayChips } from "../lib/today.js";
import { EASE, MONO, SERIF } from "../ui.js";

// Hôm nay (handoff 14 W6, W9; founder 2026-10-06): one note that changes
// today for Bonia. It goes at the top of both of her prompts, above all of
// Cài đặt. Bonia reads it back before it is saved, so a vague note is caught
// before a caller hears it: an unclear read-back keeps Lưu off.

const READBACK_WAIT_MS = 900; // after the last keystroke
const untilText = (u) => (u === "keep" ? "giữ tới khi xóa" : "tự hết lúc 23:59");

function NoteIcon({ on }) {
  return (
    <span style={{ width: 32, height: 32, borderRadius: 9, background: on ? "#7B4A2D" : "#F7F3EC", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", transition: "background-color 300ms ease" }}>
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={on ? "#FFFFFF" : "#6E6255"} strokeWidth="1.5" aria-hidden="true">
        <path d="M3 2.5h7l3 3v8H3z" />
        <path d="M5.5 8h5M5.5 10.5h3.5" />
      </svg>
    </span>
  );
}

/** The bar under the Orb: the note in force (icon filled) or "Không có gì đặc biệt." */
export function TodayBar({ note, onOpen, width }) {
  const on = !!note;
  return (
    <button type="button" onClick={onOpen} className="h-cream" style={{ width, maxWidth: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, background: "#fff", border: `1px solid ${on ? "#7B4A2D" : "#D9D0BF"}`, textAlign: "left", pointerEvents: "auto" }}>
      <NoteIcon on={on} />
      <span style={{ display: "flex", flexDirection: "column", gap: 1, flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.16em", color: "#6E6255" }}>HÔM NAY</span>
        <span style={{ fontSize: 14.5, color: on ? "#1F1B16" : "#6E6255", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{on ? note.text : "Không có gì đặc biệt."}</span>
      </span>
      <span style={{ fontSize: 13, color: "#7B4A2D", whiteSpace: "nowrap" }}>{on ? `${untilText(note.until)} · Sửa` : "Thêm ghi chú"}</span>
    </button>
  );
}

/** W9: the side sheet (a bottom sheet on a phone): the note, the chips, how long it counts, and Bonia's read-back. */
export function TodaySheet({ open, onClose, phone }) {
  const app = useApp();
  const cur = app.biz.today;
  const [text, setText] = useState("");
  const [until, setUntil] = useState("day");
  // the read-back for one (text, until); "for" ties it to what the owner sees
  const [rb, setRb] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const area = useRef(null);
  const timer = useRef(null);
  const seq = useRef(0);
  const keyOf = (t, u) => `${u}|${t.trim()}`;

  // each opening starts from the note in force
  useEffect(() => {
    if (!open) return undefined;
    setText(cur?.text || "");
    setUntil(cur?.until || "day");
    setRb(cur ? { clear: true, instruction: cur.instruction, unclear: "", for: keyOf(cur.text, cur.until || "day") } : null);
    setBusy(false);
    setErr("");
    setSaveErr("");
    const f = setTimeout(() => area.current?.focus(), 320);
    const key = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", key);
    return () => {
      clearTimeout(f);
      window.removeEventListener("keydown", key);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const ask = async (t, u) => {
    const my = ++seq.current;
    if (!t.trim()) {
      setBusy(false);
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const r = await app.readback(t.trim(), u);
      if (my === seq.current) setRb({ ...r, for: keyOf(t, u) });
    } catch (e) {
      if (my === seq.current) setErr(e?.error === "too_many_attempts" ? "Thử nhiều quá. Đợi vài phút rồi gõ lại." : "Chưa đọc được. Thử lại sau ít giây.");
    } finally {
      if (my === seq.current) setBusy(false);
    }
  };
  const change = (t, u) => {
    setText(t);
    setUntil(u);
    setSaveErr("");
    clearTimeout(timer.current);
    if (rb && rb.for === keyOf(t, u)) return;
    setRb(null);
    seq.current++;
    setBusy(!!t.trim());
    timer.current = setTimeout(() => ask(t, u), READBACK_WAIT_MS);
  };
  const chip = (c) => {
    change(c, until);
    // "Đóng cửa sớm lúc …": the owner types the time over the "…"
    const at = c.indexOf("…");
    setTimeout(() => {
      const el = area.current;
      if (!el) return;
      el.focus();
      if (at >= 0) el.setSelectionRange(at, at + 1);
      else el.setSelectionRange(c.length, c.length);
    }, 0);
  };

  const fresh = rb && rb.for === keyOf(text, until);
  const unclear = fresh && !rb.clear;
  const ok = fresh && rb.clear && !busy;
  const save = async () => {
    if (!ok || saving) return;
    setSaving(true);
    setSaveErr("");
    const r = await app.saveToday({ text: text.trim(), instruction: rb.instruction, until });
    setSaving(false);
    if (r.ok) onClose();
    else setSaveErr("Chưa lưu được. Kiểm tra mạng rồi thử lại.");
  };
  const remove = async () => {
    setSaving(true);
    const r = await app.clearToday();
    setSaving(false);
    if (r.ok) onClose();
    else setSaveErr("Chưa xóa được. Kiểm tra mạng rồi thử lại.");
  };

  const rbText = busy ? "Bonia đang đọc ghi chú…" : err || (fresh ? (rb.clear ? rb.instruction : rb.unclear) : "Gõ ghi chú, Bonia sẽ đọc lại ở đây.");
  const has = fresh && !busy && !err;
  const pill = (on) => ({ minHeight: 40, padding: "0 13px", borderRadius: 20, border: `1px solid ${on ? "#7B4A2D" : "#D9D0BF"}`, background: on ? "#FBF5EC" : "#fff", color: on ? "#7B4A2D" : "#1F1B16", fontSize: 13.5 });
  const date = app.demo ? DEMO_LABEL.split(" · ")[0] : dayLabel();

  return (
    <>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(31,27,22,0.32)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity 300ms ease", zIndex: 26 }} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Hôm nay"
        aria-hidden={!open}
        style={{
          position: "absolute", zIndex: 27, background: "#fff", display: "flex", flexDirection: "column",
          ...(phone
            ? { left: 0, right: 0, bottom: 0, height: "min(640px, calc(100% - var(--tt-top) - 12px))", borderRadius: "18px 18px 0 0", boxShadow: "0 -8px 28px rgba(31,27,22,0.14)", transform: open ? "none" : "translateY(105%)" }
            : { right: 0, top: 0, bottom: 0, width: 480, borderLeft: "1px solid #D9D0BF", transform: open ? "none" : "translateX(105%)" }),
          // hidden once it has slid away, so its fields are out of the tab order
          visibility: open ? "visible" : "hidden",
          transition: open ? `transform 450ms ${EASE}, visibility 0ms` : `transform 450ms ${EASE}, visibility 0ms linear 450ms`,
        }}
      >
        <div style={{ padding: phone ? "16px 18px 12px" : "20px 24px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #EFE9DD", flex: "none" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontFamily: SERIF, fontSize: phone ? 23 : 26 }}>Hôm nay</span>
            <span style={{ fontSize: 13, color: "#6E6255" }}>{date}</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="h-line" style={{ width: 44, height: 44, borderRadius: 22, fontSize: 16, color: "#4A4239" }}>✕</button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: phone ? "16px 18px" : "18px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <textarea
            ref={area}
            value={text}
            maxLength={300}
            onChange={(e) => change(e.target.value, until)}
            rows={3}
            placeholder="Hôm nay có gì khác?"
            style={{ width: "100%", minHeight: 100, resize: "vertical", border: "1px solid #D9D0BF", borderRadius: 12, padding: "12px 14px", fontSize: 15.5, lineHeight: 1.5, color: "#1F1B16", background: "#fff" }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {todayChips(app.biz.sector).map((c) => (
              <button key={c} type="button" onClick={() => chip(c)} className="h-cream" style={pill(false)}>{c}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[["day", "Hết hôm nay · 23:59"], ["keep", "Giữ tới khi tôi xóa"]].map(([k, l]) => (
              <button key={k} type="button" aria-pressed={until === k} onClick={() => change(text, k)} style={pill(until === k)}>{l}</button>
            ))}
          </div>
          <div aria-live="polite" style={{ padding: "14px 16px", borderRadius: 12, background: unclear && has ? "#FBF8F2" : has ? "#EEF0E6" : "#FAF7F1", border: `1px ${ok ? "solid" : "dashed"} ${unclear && has ? "#A0412D" : has ? "#C9D4BC" : "#C9BCA5"}`, display: "flex", flexDirection: "column", gap: 6, minHeight: 90 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: unclear && has ? "#A0412D" : "#4A6B3A" }}>{unclear && has ? "CẦN VIẾT RÕ HƠN" : "BONIA HIỂU"}</span>
            <span style={{ fontSize: 15, lineHeight: 1.55, color: has ? "#1F1B16" : "#6E6255" }}>{rbText}</span>
          </div>
          {saveErr && <span role="alert" style={{ fontSize: 13, color: "#A0412D" }}>{saveErr}</span>}
        </div>
        <div style={{ padding: phone ? "12px 18px max(18px, var(--tt-bot))" : "12px 24px 18px", borderTop: "1px solid #EFE9DD", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flex: "none" }}>
          <span style={{ fontSize: 13, color: "#4A4239" }}>{until === "keep" ? "Giữ tới khi bạn xóa" : "Tự hết lúc 23:59 hôm nay"}</span>
          <div style={{ display: "flex", gap: 8, flex: "none" }}>
            {cur && <button type="button" className="b-ghost" disabled={saving} onClick={remove} style={{ height: 44, padding: "0 16px", borderRadius: 22, fontSize: 14, color: "#A0412D" }}>Xóa</button>}
            <button type="button" disabled={!ok || saving} onClick={save} style={{ height: 44, padding: "0 24px", borderRadius: 22, background: ok ? "#7B4A2D" : "#E4DCCB", color: ok ? "#fff" : "#6E6255", fontSize: 14, fontWeight: 500, cursor: ok ? "pointer" : "default" }}>{saving ? "Đang lưu…" : "Lưu"}</button>
          </div>
        </div>
      </div>
    </>
  );
}
