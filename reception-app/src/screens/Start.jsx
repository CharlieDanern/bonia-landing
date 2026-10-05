import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { StoreQR } from "../components/StoreQR.jsx";
import { BONIA_MARK } from "../lib/assets.js";
import { useLayout } from "../layout.jsx";
import { useApp } from "../state.jsx";
import { api } from "../api.js";

// Bắt đầu (founder 2026-10-05): the phone app does sign-up, forwarding and
// the test call; the web only asks for the phone number and the code the
// Bonia app receives as a notification, then opens Cài đặt, which offers to
// fill everything from the web. Demo mode: any 6-digit code works;
// 0900 000 999 shows "no account".

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Source Serif 4', Georgia, serif";
const RESEND_S = 30;

export const STEPS = { "": "login", "nhap-ma": "code", "khong-nhan-ma": "nocode", "chua-co-tai-khoan": "noacct", "cai-ung-dung": "sales" };
const PATH = Object.fromEntries(Object.entries(STEPS).map(([p, s]) => [s, p ? `/bat-dau/${p}` : "/bat-dau"]));

// what each backend refusal means for the owner
const ERRORS = {
  phone: "Số điện thoại chưa đúng.",
  no_device: "Điện thoại này chưa nhận được thông báo từ Bonia. Mở ứng dụng Bonia, cho phép thông báo, rồi thử lại.",
  too_many_attempts: "Thử quá nhiều lần. Đợi vài phút rồi thử lại.",
  wrong: "Mã chưa đúng. Kiểm tra lại thông báo mới nhất trong ứng dụng Bonia.",
  expired: "Mã đã hết hạn. Bấm gửi lại mã.",
  too_many: "Nhập sai quá nhiều lần. Bấm gửi lại mã.",
  no_code: "Mã đã hết hạn. Bấm gửi lại mã.",
  network: "Không kết nối được. Kiểm tra mạng rồi thử lại.",
};
const errorText = (e) => (e?.error === "too_soon" ? `Mã vừa được gửi. Đợi ${Math.ceil((e.retry_in_ms || 30000) / 1000)} giây rồi thử lại.` : ERRORS[e?.error] || "Có lỗi, thử lại sau ít phút.");

function session(key, v) {
  try {
    if (v === undefined) return JSON.parse(sessionStorage.getItem(key) || "null");
    sessionStorage.setItem(key, JSON.stringify(v));
  } catch {
    // private mode
  }
  return null;
}

/** /start/VNPT-HCM-0123: a salesperson's link. Remembers the referral, opens the app install. */
export function StartLink({ code }) {
  const [, navigate] = useLocation();
  useEffect(() => {
    const [via, ...rest] = String(code || "").split("-");
    session("tt3.ref", { via, code: rest.join("-") });
    navigate(PATH.sales, { replace: true });
  }, [code, navigate]);
  return null;
}

export function Start({ step: slug = "" }) {
  const app = useApp();
  const { phone } = useLayout();
  const [, navigate] = useLocation();
  const step = STEPS[slug] || "login";
  const go = (s) => navigate(PATH[s]);
  const [tel, setTel] = useState(() => session("tt3.phone") || (app.demo ? "0900 000 300" : ""));
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const [, setTick] = useState(0);
  const ref = session("tt3.ref");

  // logged in already: straight to Cài đặt
  useEffect(() => {
    if (app.account.status === "in") navigate("/cai-dat", { replace: true });
  }, [app.account.status, navigate]);
  useEffect(() => {
    setErr("");
    if (step === "code") setCode("");
  }, [step]);
  useEffect(() => {
    if (resendAt <= Date.now()) return undefined;
    const iv = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(iv);
  }, [resendAt]);
  const wait = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));

  /** Ask the backend to push a code to the Bonia app on this number. */
  const sendCode = async (then) => {
    session("tt3.phone", tel);
    setErr("");
    if (app.demo) {
      setResendAt(Date.now() + RESEND_S * 1000);
      return go(tel.replace(/\s/g, "") === "0900000999" ? "noacct" : then);
    }
    setBusy(true);
    try {
      await api.requestCode(tel);
      setResendAt(Date.now() + RESEND_S * 1000);
      go(then);
    } catch (e) {
      if (e.error === "no_account") go("noacct");
      else setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (c) => {
    if (app.demo) return void setTimeout(() => navigate("/cai-dat?moi=1"), 350);
    setBusy(true);
    setErr("");
    try {
      const { token } = await api.verify(tel, c);
      await app.signIn(token);
      navigate("/cai-dat");
    } catch (e) {
      setErr(errorText(e));
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const h1 = { margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: phone ? 24 : 28, lineHeight: 1.15, letterSpacing: step === "login" ? "-0.01em" : undefined };
  const primary = (h = 44, fs = 14) => ({ height: h, borderRadius: h / 2, fontSize: fs, textAlign: "center", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: busy ? 0.6 : 1 });
  const steps = (list) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {list.map((t, i) => (
        <div key={t} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: 8, fontSize: 13.5, lineHeight: 1.5 }}>
          <span style={{ fontFamily: MONO, color: "#7B4A2D" }}>{i + 1}</span>
          <span>{t}</span>
        </div>
      ))}
    </div>
  );
  const errLine = err && <span role="alert" style={{ fontSize: 13, lineHeight: 1.5, color: "#A0412D" }}>{err}</span>;

  let body = null;
  if (step === "login") {
    body = (
      <form style={{ display: "contents" }} onSubmit={(e) => { e.preventDefault(); if (!busy && tel.replace(/\D/g, "").length >= 9) sendCode("code"); }}>
        <h1 style={h1}>Đăng nhập</h1>
        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#4A4239" }}>Số điện thoại đã cài Bonia</span>
          <input value={tel} onChange={(e) => setTel(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="0909 123 456" style={{ height: 46, border: "1px solid #D9D0BF", borderRadius: 10, padding: "0 14px", fontFamily: MONO, fontSize: 17, background: "#fff", color: "#1F1B16" }} />
        </label>
        {errLine}
        <button type="submit" className="b-primary" disabled={busy} style={primary(46, 14.5)}>{busy ? "Đang gửi…" : "Gửi mã tới ứng dụng Bonia"}</button>
        <span style={{ fontSize: 13, color: "#6E6255", textAlign: "center" }}>Chưa có ứng dụng Bonia? <Link href={PATH.noacct}>Cài ứng dụng</Link></span>
      </form>
    );
  } else if (step === "code") {
    body = (
      <>
        <h1 style={h1}>Nhập mã</h1>
        <span style={{ fontSize: 13.5, lineHeight: 1.55, color: "#4A4239" }}>Mã đã gửi tới ứng dụng Bonia trên số <span style={{ fontFamily: MONO, color: "#1F1B16" }}>{tel}</span>, trong thông báo mới nhất.</span>
        {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
        <input
          value={code}
          autoFocus
          disabled={busy}
          onChange={(e) => {
            const c = e.target.value.replace(/\D/g, "").slice(0, 6);
            setCode(c);
            if (c.length === 6) verify(c);
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="••••••"
          style={{ height: 56, border: "2px solid #7B4A2D", borderRadius: 10, padding: "0 14px", fontFamily: MONO, fontSize: 24, letterSpacing: "0.5em", textAlign: "center", background: "#fff", color: "#1F1B16" }}
        />
        {errLine}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 14 }}>
          <button type="button" onClick={() => go("nocode")} style={{ minHeight: 44, color: "#7B4A2D", fontSize: 14 }}>Không nhận được mã?</button>
          {wait > 0
            ? <span style={{ fontFamily: MONO, fontSize: 13, color: "#6E6255", alignSelf: "center" }}>Gửi lại sau 0:{String(wait).padStart(2, "0")}</span>
            : <button type="button" disabled={busy} onClick={() => sendCode("code")} style={{ minHeight: 44, color: "#7B4A2D", fontSize: 14 }}>Gửi lại mã</button>}
        </div>
      </>
    );
  } else if (step === "nocode") {
    body = (
      <>
        <h1 style={h1}>Không nhận được mã?</h1>
        {steps(["Mở ứng dụng Bonia trên điện thoại có số này, và cho phép Bonia gửi thông báo.", "Mã nằm trong thông báo mới nhất trên điện thoại.", "Chưa có ứng dụng? Cài Bonia rồi đăng ký bằng số này trước."])}
        <div style={{ padding: 14, borderRadius: 14, background: "#fff", border: "1px solid #D9D0BF", display: "flex", gap: 12, alignItems: "center" }}>
          <img src={BONIA_MARK} alt="" style={{ height: 30, width: "auto" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Mã đăng nhập Bonia Tiếp tân</span>
            <span style={{ fontSize: 13.5, color: "#4A4239" }}><span style={{ fontFamily: MONO, color: "#1F1B16" }}>482913</span>. Mã hết hạn sau 5 phút.</span>
          </div>
        </div>
        {errLine}
        <button type="button" className="b-primary" disabled={busy || wait > 0} onClick={() => sendCode("code")} style={primary()}>{wait > 0 ? `Gửi lại sau ${wait} giây` : "Gửi lại mã"}</button>
      </>
    );
  } else if (step === "noacct") {
    body = (
      <>
        <h1 style={h1}>Số này chưa dùng Bonia.</h1>
        <span style={{ fontSize: 13.5, lineHeight: 1.55, color: "#4A4239" }}>Cài ứng dụng Bonia trên điện thoại này và đăng ký bằng số này trước.</span>
        <StoreQR />
        <button type="button" className="b-primary" onClick={() => go("login")} style={primary()}>Tôi đã cài xong</button>
      </>
    );
  } else if (step === "sales") {
    body = (
      <>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", color: "#6E6255" }}>BƯỚC 1 / 2</span>
        <h1 style={h1}>Cài Bonia trên điện thoại quầy</h1>
        {steps(["Quét mã bằng điện thoại quầy để cài Bonia.", "Đăng ký bằng số điện thoại quầy.", "Chọn nhà mạng, cài chuyển cuộc gọi.", "Gọi thử trong ứng dụng."])}
        <StoreQR />
        <button type="button" className="b-primary" onClick={() => go("login")} style={primary()}>Tôi đã cài xong</button>
      </>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: "#F2EEE6", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: phone ? "var(--tt-top)" : 12, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${phone ? 20 : 40}px` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={BONIA_MARK} alt="Bonia" style={{ height: 22, width: "auto" }} />
          <span className="tt-mono-label">TIẾP TÂN</span>
        </div>
        {ref?.code && <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", padding: "4px 8px", border: "1px solid #D9D0BF", borderRadius: 10, color: "#4A4239", whiteSpace: "nowrap" }}>{ref.via} · {ref.code}</span>}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: phone ? "calc(var(--tt-top) + 56px)" : 68, bottom: 0, overflow: "auto", display: "flex", justifyContent: "center", alignItems: phone ? "flex-start" : "center", padding: phone ? "8px 20px 32px" : "24px 40px 60px" }}>
        <div style={{ width: "100%", maxWidth: phone ? 520 : 480, display: "flex", flexDirection: "column", gap: 14, padding: phone ? 0 : "28px 32px", background: phone ? "transparent" : "#FFFFFF", border: phone ? 0 : "1px solid #D9D0BF", borderRadius: 20, margin: phone ? 0 : "auto 0" }}>
          {body}
        </div>
      </div>
    </div>
  );
}
