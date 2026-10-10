import React from "react";
import { Link } from "wouter";
import { BONIA_MARK } from "../lib/assets.js";
import { useApp } from "../state.jsx";
import { MONO } from "../ui.js";

// Bonia Tiếp tân · Tài chính (handoff 16): the finance account's tabs, header and shared bits. Tabs (founder
// 2026-10-10: "Trực tiếp" is renamed "Gọi vào"): Gọi vào · Gọi ra · Lịch sử · Cài đặt · Tài khoản.

export const FIN_TABS = [["Gọi vào", "/"], ["Gọi ra", "/goi-ra"], ["Lịch sử", "/lich-su"], ["Cài đặt", "/cai-dat"], ["Tài khoản", "/tai-khoan"]];

// results that need a person to follow up get a dark pill; the rest an outlined one (handoff 16, "Outcome pills")
export const FOLLOW_UP = new Set(["Quan tâm", "Hẹn gọi lại", "Lời nhắn", "Khiếu nại"]);

const WEEKDAYS = ["CHỦ NHẬT", "THỨ HAI", "THỨ BA", "THỨ TƯ", "THỨ NĂM", "THỨ SÁU", "THỨ BẢY"];
/** "THỨ NĂM 9/10" in Vietnam time. */
export function todayLabel(now = Date.now()) {
  const d = new Date(now + 7 * 3600e3);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}

/** The company's name for the header: "ABC Credit" out of "Công ty Tài chính ABC Credit". */
export function useCompany() {
  const { account } = useApp();
  const full = account?.company || "ABC Credit";
  return { full, short: full.replace(/^công ty (tnhh |cổ phần )?(tài chính )?/i, "").trim() || full };
}

export function FinHeader({ active }) {
  const { short } = useCompany();
  return (
    <header className="tt-head">
      <div className="tt-head-brand">
        <img src={BONIA_MARK} alt="Bonia" />
        <span className="tt-head-name" style={{ marginLeft: 2 }}>{short}</span>
      </div>
      <nav className="tt-head-nav">
        {FIN_TABS.map(([l, href], i) => (
          <Link key={href} href={href} className={i === active ? "on" : ""}>{l}</Link>
        ))}
      </nav>
      <div className="tt-head-right">{todayLabel()}</div>
    </header>
  );
}

export function FinPhoneTabs({ active }) {
  return (
    <nav className="tt-tabs">
      {FIN_TABS.map(([l, href], i) => (
        <Link key={href} href={href} className={i === active ? "on" : ""}>
          <span className="bar" />
          {l}
        </Link>
      ))}
    </nav>
  );
}

/** The trial's line (handoff 16): only the numbers registered for the trial are called. */
export function TrialNote({ style }) {
  return (
    <div style={{ border: "1px solid #E4DCCB", background: "#F7F3EC", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, color: "#4A4239", ...style }}>
      Bản dùng thử: Bonia chỉ gọi các số đã đăng ký thử.
    </div>
  );
}

const pillBase = { fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.12em", padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap", textTransform: "uppercase", lineHeight: 1.2, display: "inline-block" };

/** A call's result: dark when someone must follow up, outlined otherwise; "Chưa gắn nhãn" when there is none yet. */
export function OutcomePill({ outcome }) {
  if (!outcome) return <span style={{ ...pillBase, border: "1px dashed #C9BCA5", color: "#6E6255" }}>Chưa gắn nhãn</span>;
  return FOLLOW_UP.has(outcome)
    ? <span style={{ ...pillBase, background: "#1F1B16", color: "#F7F3EC", border: "1px solid #1F1B16" }}>{outcome}</span>
    : <span style={{ ...pillBase, border: "1px solid #D9D0BF", color: "#4A4239", background: "#fff" }}>{outcome}</span>;
}

/** "↗ Gọi ra" / "↙ Gọi vào". */
export const directionLabel = (dir) => (dir === "inbound" ? "↙ Gọi vào" : "↗ Gọi ra");

/** "2:03" from ms. */
export const clock = (ms) => { const s = Math.round((ms || 0) / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

/** Accents and spaces ignored, for search. */
export const fold = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/\s/g, "");
