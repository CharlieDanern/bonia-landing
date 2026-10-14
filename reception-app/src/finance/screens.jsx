import React, { useEffect, useState } from "react";
import { useLayout } from "../layout.jsx";
import { useApp } from "../state.jsx";
import { MONO, SERIF, dims } from "../ui.js";
import { financeApi } from "./api.js";
import { FinHeader, FinPhoneTabs, useCompany } from "./common.jsx";

// The finance account's Cài đặt and Tài khoản (handoff 16).

const localPhone = (n) => { const d = String(n || "").replace(/\D/g, ""); const l = d.startsWith("84") ? `0${d.slice(2)}` : d; return /^0\d{9}$/.test(l) ? `${l.slice(0, 4)} ${l.slice(4, 7)} ${l.slice(7)}` : String(n || ""); };

/** A tab's page: the header (or the phone's tabs), a serif title, the content. */
function Page({ tab, title, children, wide = false }) {
  const { phone } = useLayout();
  const d = dims(phone);
  const inner = (
    <div style={{ padding: phone ? "10px 16px 24px" : "20px 48px 32px", display: "flex", flexDirection: "column", gap: 14, maxWidth: wide ? "none" : phone ? "none" : 1440 }}>
      <span style={{ fontFamily: SERIF, fontSize: phone ? d.fs.h1 : 30, fontWeight: 400 }}>{title}</span>
      {children}
    </div>
  );
  if (phone) {
    return (
      <div style={{ position: "absolute", inset: 0, background: "#F2EEE6", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: "var(--tt-top)", bottom: "calc(57px + var(--tt-bot))", overflow: "auto" }}>{inner}</div>
        <FinPhoneTabs active={tab} />
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", inset: 0, background: "#F2EEE6", overflow: "hidden" }}>
      <FinHeader active={tab} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 56, bottom: 0, overflow: "auto" }}>{inner}</div>
    </div>
  );
}

const card = { background: "#fff", border: "1px solid #E4DCCB", borderRadius: 12, overflow: "hidden", width: "100%", maxWidth: 640 };

export function FinanceAccount() {
  const app = useApp();
  const { full } = useCompany();
  const row = (l, v, mono) => (
    <div style={{ display: "grid", gridTemplateColumns: "120px minmax(0,1fr)", gap: 10, padding: "9px 16px", borderTop: "1px solid #EFE9DD", fontSize: 12.5 }}>
      <span style={{ color: "#6E6255" }}>{l}</span><span style={{ fontFamily: mono ? MONO : undefined }}>{v}</span>
    </div>
  );
  return (
    <Page tab={4} title="Tài khoản">
      <div style={card}>
        <div style={{ marginTop: -1 }}>
          {row("Công ty", full)}
          {row("Số đăng nhập", localPhone(app.account.phone), true)}
          {row("Gói", "Bản dùng thử")}
        </div>
      </div>
      <button type="button" onClick={app.signOut} style={{ alignSelf: "flex-start", height: 34, padding: "0 16px", borderRadius: 17, border: "1px solid #D9D0BF", background: "#fff", fontSize: 13, cursor: "pointer" }}>Đăng xuất</button>
    </Page>
  );
}

/** "Số đã gọi gần đây": the company decides whether a new list skips numbers dialled lately (founder 2026-10-11). */
function RecentDays() {
  const [v, setV] = useState(null);
  const [opts, setOpts] = useState([0, 1, 3, 7, 14, 30]);
  const [state, setState] = useState("");
  useEffect(() => { financeApi.settings().then((r) => { setV(r.recent_days); setOpts(r.recent_days_options || opts); }).catch(() => setState("failed")); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const save = async (n) => {
    const prev = v;
    setV(n); setState("saving");
    try { await financeApi.saveSettings({ recent_days: n }); setState("saved"); setTimeout(() => setState(""), 1800); } catch { setV(prev); setState("failed"); }
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {state === "saved" && <span style={{ fontSize: 12, color: "#4A6B3A" }}>Đã lưu</span>}
      {state === "failed" && <span style={{ fontSize: 12, color: "#A0412D" }}>Chưa lưu được</span>}
      <select value={v ?? ""} disabled={v === null || state === "saving"} onChange={(e) => save(Number(e.target.value))} style={{ height: 32, border: "1px solid #D9D0BF", borderRadius: 8, padding: "0 8px", fontSize: 12.5, background: "#fff", color: "#1F1B16" }}>
        {v === null && <option value="">…</option>}
        {opts.map((n) => <option key={n} value={n}>{n ? `Bỏ qua số đã gọi trong ${n} ngày` : "Gọi tất cả các số"}</option>)}
      </select>
    </div>
  );
}

export function FinanceSettings() {
  const row = (title, sub, right) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderTop: "1px solid #EFE9DD" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{title}</span>
        <span style={{ fontSize: 12, color: "#4A4239" }}>{sub}</span>
      </div>
      {right}
    </div>
  );
  const soon = <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", color: "#6E6255", border: "1px dashed #C9BCA5", borderRadius: 6, padding: "2px 7px" }}>SẮP CÓ</span>;
  return (
    <Page tab={3} title="Cài đặt">
      <div style={card}>
        <div style={{ marginTop: -1 }}>
          {row("Thông tin công ty", "Sản phẩm, biểu phí, điều kiện, giờ làm việc", soon)}
          {row("Kịch bản gọi ra", "Đội Bonia chỉnh kịch bản cho công ty", <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.14em", color: "#4A4239" }}>1 KỊCH BẢN</span>)}
          {row("Số đã gọi gần đây", "Khi tải danh sách mới, Bonia có bỏ qua số vừa gọi gần đây không. Vẫn gọi được từng danh sách.", <RecentDays />)}
          {row("Thử Bonia", "Nói chuyện với Bonia ngay trên trình duyệt", soon)}
        </div>
      </div>
    </Page>
  );
}
