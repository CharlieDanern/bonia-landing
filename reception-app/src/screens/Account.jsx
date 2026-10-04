import React, { useState } from "react";
import { QrGrid } from "../components/StoreQR.jsx";
import { ACCOUNT, BILLING_INFO, DEVICES, INVOICE, PAY_HISTORY, PLAN, USAGE } from "../data/account.js";
import { decimal, groupVnd, vnd } from "../lib/format.js";
import { vietQrPayload } from "../lib/vietqr.js";
import { DeskHeader, PhoneTabs, useLayout } from "../layout.jsx";
import { copyToClipboard } from "../state.jsx";
import { MONO, SERIF, dims } from "../ui.js";

// Tài khoản & thanh toán: its own page (founder 2026-10-04; it was Cài đặt
// §05 in handoff 13). Plan and minutes, the month's invoice with VietQR,
// invoice details, payment history, the login and the devices signed in.

const VCB_BIN = "970436"; // Vietcombank

export function Account() {
  const { phone } = useLayout();
  const d = dims(phone);
  const [payCopied, setPayCopied] = useState(false);
  const [devs, setDevs] = useState(DEVICES);
  const card = { background: "#fff", border: "1px solid #E4DCCB", borderRadius: 12, padding: phone ? "13px 14px" : "14px 16px", display: "flex", flexDirection: "column", gap: 8 };
  const cardTitle = { fontSize: d.fs.title, fontWeight: 600 };
  const muted = { color: "#6E6255" };
  const rowCols = phone ? "minmax(0,1fr)" : "150px minmax(0,1fr)";

  const plan = (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
        <span style={cardTitle}>{PLAN.name}</span>
        <span style={{ fontFamily: MONO, fontSize: 13 }}>{groupVnd(PLAN.price)}đ/tháng</span>
      </div>
      <span style={{ fontSize: d.fs.small, color: "#4A4239", lineHeight: 1.5 }}>Chưa gồm VAT · gồm {PLAN.minutes} phút · phút vượt {groupVnd(PLAN.overPerMin)}đ/phút, tính theo giây</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingTop: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: d.fs.small }}>
          <span>{USAGE.month}</span>
          <span style={{ fontFamily: MONO }}>{decimal(USAGE.used)} / {PLAN.minutes} phút</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: "#E4DCCB", overflow: "hidden" }}>
          <div style={{ width: `${Math.min(100, (USAGE.used / PLAN.minutes) * 100)}%`, height: "100%", background: "#7B4A2D" }} />
        </div>
      </div>
    </div>
  );

  const invoice = (
    <div style={{ ...card, gap: 10, borderColor: INVOICE.paid ? "#E4DCCB" : "#EBCFC4" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <span style={cardTitle}>Hóa đơn {INVOICE.month.toLowerCase()}</span>
        <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", padding: "3px 7px", borderRadius: 9, background: INVOICE.paid ? "#EEF0E6" : "#F6E7E1", color: INVOICE.paid ? "#4A6B3A" : "#A0412D" }}>{INVOICE.paid ? "ĐÃ THANH TOÁN" : "CHƯA THANH TOÁN"}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: "3px 16px", fontSize: d.fs.small }}>
        {INVOICE.lines.map(([l, v]) => (
          <React.Fragment key={l}>
            <span style={muted}>{l}</span>
            <span style={{ fontFamily: MONO, textAlign: "right" }}>{vnd(v)}</span>
          </React.Fragment>
        ))}
        <span style={{ fontWeight: 600, paddingTop: 3 }}>Tổng</span>
        <span style={{ fontFamily: MONO, textAlign: "right", fontWeight: 600, paddingTop: 3 }}>{vnd(INVOICE.total)}</span>
      </div>
      {!INVOICE.paid && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start", padding: 12, borderRadius: 10, background: "#FAF7F1" }}>
          <QrGrid text={vietQrPayload({ bin: VCB_BIN, account: INVOICE.account, amount: INVOICE.total, content: INVOICE.content })} size={150} pad={9} radius={8} />
          <div style={{ flex: 1, minWidth: 170, display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: "5px 12px", fontSize: d.fs.small, alignContent: "start" }}>
            <span style={muted}>Ngân hàng</span><span>{INVOICE.bank}</span>
            <span style={muted}>Số tài khoản</span><span style={{ fontFamily: MONO }}>{INVOICE.account}</span>
            <span style={muted}>Chủ tài khoản</span><span>{INVOICE.holder}</span>
            <span style={muted}>Số tiền</span><span style={{ fontFamily: MONO }}>{vnd(INVOICE.total)}</span>
            <span style={muted}>Nội dung</span><span style={{ fontFamily: MONO }}>{INVOICE.content}</span>
            <span />
            <button type="button" className="b-ghost" onClick={() => { copyToClipboard(INVOICE.content); setPayCopied(true); setTimeout(() => setPayCopied(false), 1600); }} style={{ height: d.btnSm, width: "max-content", padding: "0 14px", borderRadius: d.btnSm / 2, fontSize: d.fs.small, marginTop: 4 }}>{payCopied ? "Đã chép" : "Sao chép nội dung"}</button>
          </div>
        </div>
      )}
    </div>
  );

  const billing = (
    <div style={card}>
      <span style={cardTitle}>Thông tin xuất hóa đơn</span>
      <div style={{ display: "grid", gridTemplateColumns: rowCols, gap: "6px 14px", fontSize: d.fs.small, alignItems: "center" }}>
        {[["Tên đơn vị", BILLING_INFO.company, false], ["Mã số thuế", BILLING_INFO.taxId, true], ["Email nhận hóa đơn", BILLING_INFO.email, false]].map(([l, v, mono]) => (
          <React.Fragment key={l}>
            <span style={muted}>{l}</span>
            <input defaultValue={v} style={{ height: d.input, border: "1px solid #D9D0BF", borderRadius: 8, padding: "0 10px", fontSize: d.fs.body, background: "#fff", minWidth: 0, fontFamily: mono ? MONO : undefined }} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const history = (
    <div style={{ ...card, gap: 2 }}>
      <span style={{ ...cardTitle, paddingBottom: 4 }}>Lịch sử thanh toán</span>
      {PAY_HISTORY.map((p) => (
        <div key={p.m} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 14, minHeight: 36, alignItems: "center", borderTop: "1px solid #EFE9DD", fontSize: d.fs.small }}>
          <span>{p.m}</span>
          <span style={{ fontFamily: MONO }}>{vnd(p.v)}</span>
          <span style={{ color: p.paid ? "#4A6B3A" : "#A0412D", whiteSpace: "nowrap", minWidth: 150, textAlign: "right" }}>{p.s}</span>
        </div>
      ))}
    </div>
  );

  const account = (
    <div style={{ ...card, gap: 4 }}>
      <span style={{ ...cardTitle, paddingBottom: 4 }}>Tài khoản</span>
      <div style={{ display: "grid", gridTemplateColumns: rowCols, gap: "6px 14px", fontSize: d.fs.small, alignItems: "center" }}>
        <span style={muted}>Số đăng nhập</span><span style={{ fontFamily: MONO, fontSize: 13 }}>{ACCOUNT.login}</span>
        <span style={muted}>Lĩnh vực</span><span>{ACCOUNT.sector} · <span style={muted}>liên hệ hỗ trợ để đổi</span></span>
        <span style={muted}>Mã giới thiệu</span><span>Đăng ký qua: {ACCOUNT.referral.via} · <span style={{ fontFamily: MONO }}>{ACCOUNT.referral.code}</span></span>
      </div>
      <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", color: "#6E6255", paddingTop: 10 }}>MÁY ĐANG ĐĂNG NHẬP</span>
      {devs.map((dv) => {
        const isThis = dv.phone === phone;
        return (
          <div key={dv.n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, minHeight: 44, borderTop: "1px solid #EFE9DD" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: d.fs.body, fontWeight: 500 }}>{dv.n}</span>
              <span style={{ fontSize: d.fs.tiny, color: "#6E6255" }}>{isThis ? "Đang dùng" : dv.s}</span>
            </div>
            {isThis ? (
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", color: "#4A6B3A" }}>MÁY NÀY</span>
            ) : (
              <button type="button" className="b-ghost" onClick={() => setDevs((ds) => ds.filter((x) => x !== dv))} style={{ height: d.btnSm, padding: "0 12px", borderRadius: d.btnSm / 2, fontSize: d.fs.small, whiteSpace: "nowrap" }}>Đăng xuất</button>
            )}
          </div>
        );
      })}
    </div>
  );

  if (phone) {
    return (
      <div style={{ position: "absolute", inset: 0, background: "#F2EEE6", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: "var(--tt-top)", bottom: "calc(57px + var(--tt-bot))", overflow: "auto" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "8px 16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontFamily: SERIF, fontSize: d.fs.h1 }}>Tài khoản</span>
            {plan}
            {invoice}
            {history}
            {billing}
            {account}
          </div>
        </div>
        <PhoneTabs active={4} />
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", inset: 0, background: "#F2EEE6", overflow: "hidden" }}>
      <DeskHeader active={4} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 56, bottom: 0, overflow: "auto" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 48px 48px", display: "flex", flexDirection: "column", gap: 18 }}>
          <span style={{ fontFamily: SERIF, fontSize: d.fs.h1 }}>Tài khoản & thanh toán</span>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {plan}
              {invoice}
              {history}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {account}
              {billing}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
