import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { QrGrid, StoreQR } from "../components/StoreQR.jsx";
import { BONIA_MARK } from "../lib/assets.js";
import { useLayout } from "../layout.jsx";
import { useApp } from "../state.jsx";
import { api } from "../api.js";

// Bắt đầu (founder 2026-10-05): the phone app does sign-up, forwarding and
// the test call; the web only asks for the phone number and the code the
// Bonia app receives as a notification, then opens Cài đặt, which offers to
// fill everything from the web. Demo mode: any 6-digit code works;
// 0900 000 999 shows "no account".
// Handoff 14 (founder 2026-10-06): a visitor who comes to the website first
// sees the three steps (W1); signing in is the pushed code or a QR scanned
// with the Bonia app and approved there (W2, the app's A12). The QR changes
// every 2 minutes. A browser that signed in before goes straight to W2.

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Source Serif 4', Georgia, serif";
const RESEND_S = 30;

export const STEPS = { "": "welcome", "dang-nhap": "login", "nhap-ma": "code", "khong-nhan-ma": "nocode", "chua-co-tai-khoan": "noacct", "cai-ung-dung": "sales" };
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
const KNOWN = "tt.known"; // this browser signed in before: skip the welcome
const known = {
  get() { try { return localStorage.getItem(KNOWN) === "1"; } catch { return false; } },
  set() { try { localStorage.setItem(KNOWN, "1"); } catch { /* private mode */ } },
};
const QR_POLL_MS = 2000;

/** W2's QR: shows a fresh code, asks every 2 s whether the app agreed, renews it when it runs out or is refused. */
function QrSignIn({ demo, onToken, phone }) {
  const [q, setQ] = useState(null); // { id, secret, url, exp }
  const [note, setNote] = useState("");
  const [failed, setFailed] = useState(false);
  const [, setTick] = useState(0);
  // only the latest request's code is shown (and none after leaving the page)
  const gen = useRef(0);
  const fresh = useCallback(async () => {
    const my = ++gen.current;
    if (demo) return setQ({ id: "demo", secret: "", url: `https://bonia.vn/reception/app/qr/demo-${Date.now().toString(36)}`, exp: Date.now() + 120_000 });
    try {
      const r = await api.qrStart();
      if (my === gen.current) { setQ({ id: r.id, secret: r.secret, url: r.url, exp: Date.now() + (r.expires_in_ms || 120_000) }); setFailed(false); }
    } catch {
      if (my === gen.current) setFailed(true);
    }
    return undefined;
  }, [demo]);
  useEffect(() => {
    fresh();
    return () => { gen.current++; };
  }, [fresh]);
  // the countdown, and a new code when it runs out
  useEffect(() => {
    const iv = setInterval(() => {
      setTick((n) => n + 1);
      if (q && Date.now() > q.exp) { setQ(null); fresh(); }
    }, 1000);
    return () => clearInterval(iv);
  }, [q, fresh]);
  // has the app agreed?
  useEffect(() => {
    if (!q || demo) return undefined;
    let stop = false;
    const poll = async () => {
      if (stop) return;
      if (document.visibilityState === "visible") {
        try {
          const r = await api.qrPoll(q.id, q.secret);
          if (stop) return;
          if (r.status === "approved" && r.token) return void onToken(r.token);
          if (r.status === "denied") { setNote("Đã từ chối trên điện thoại. Đây là mã mới."); setQ(null); return void fresh(); }
          if (r.status === "expired" || r.status === "gone") { setQ(null); return void fresh(); }
        } catch { /* the network blinked: ask again */ }
      }
      setTimeout(poll, QR_POLL_MS);
    };
    const t = setTimeout(poll, QR_POLL_MS);
    return () => { stop = true; clearTimeout(t); };
  }, [q, demo, fresh, onToken]);
  const left = q ? Math.max(0, Math.ceil((q.exp - Date.now()) / 1000)) : 0;
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", padding: 14, borderRadius: 14, background: "#FAF7F1", border: "1px solid #EFE9DD", flexWrap: phone ? "wrap" : "nowrap" }}>
      {q ? (
        <button type="button" onClick={demo ? () => onToken("demo") : undefined} aria-label="Mã QR đăng nhập" style={{ padding: 0, borderRadius: 10, cursor: demo ? "pointer" : "default", flex: "none" }}>
          <QrGrid text={q.url} />
        </button>
      ) : (
        <div style={{ width: 150, height: 150, borderRadius: 10, border: "1px solid #D9D0BF", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, color: "#6E6255", textAlign: "center", padding: 10, flex: "none" }}>
          {failed ? <button type="button" onClick={fresh} style={{ color: "#7B4A2D", fontSize: 13 }}>Không tải được mã. Thử lại</button> : "Đang tạo mã…"}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Quét bằng ứng dụng Bonia</span>
        <span style={{ fontSize: 13.5, lineHeight: 1.5, color: "#4A4239" }}>Tài khoản → Quét mã đăng nhập, rồi bấm Đồng ý.</span>
        {note && <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "#A0412D" }}>{note}</span>}
        {q && <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", color: "#6E6255" }}>MÃ ĐỔI SAU {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</span>}
        {demo && <span style={{ fontSize: 11.5, color: "#6E6255" }}>Bản demo: bấm vào mã để giả lập Đồng ý.</span>}
      </div>
    </div>
  );
}

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

/** /qr/…: the sign-in QR scanned with the phone's camera instead of the Bonia app. */
export function QrLanding() {
  return (
    <div style={{ position: "absolute", inset: 0, background: "#F2EEE6", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 420, display: "flex", flexDirection: "column", gap: 14 }}>
        <img src={BONIA_MARK} alt="Bonia" style={{ height: 26, width: "auto", alignSelf: "flex-start" }} />
        <h1 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 28, lineHeight: 1.2 }}>Quét mã này bằng ứng dụng Bonia</h1>
        <span style={{ fontSize: 15, lineHeight: 1.55, color: "#4A4239" }}>Mở ứng dụng Bonia, vào Tài khoản → Quét mã đăng nhập, rồi quét lại mã trên máy tính và bấm Đồng ý.</span>
      </div>
    </div>
  );
}

export function Start({ step: slug = "" }) {
  const app = useApp();
  const { phone } = useLayout();
  const [, navigate] = useLocation();
  const step = STEPS[slug] || "welcome";
  const go = (s) => navigate(PATH[s]);
  const [tel, setTel] = useState(() => session("tt3.phone") || (app.demo ? "0900 000 300" : ""));
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const [, setTick] = useState(0);
  const ref = session("tt3.ref");

  // logged in already: straight to Cài đặt; a browser that signed in before skips the welcome
  useEffect(() => {
    if (app.account.status === "in") navigate("/cai-dat", { replace: true });
    else if (step === "welcome" && known.get()) navigate(PATH.login, { replace: true });
  }, [app.account.status, navigate, step]);
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

  /** A token from the code or the QR: signed in, then Cài đặt. */
  const signedIn = useCallback(async (t) => {
    known.set();
    if (app.demo) return void navigate("/cai-dat?moi=1");
    await app.signIn(t);
    navigate("/cai-dat");
  }, [app, navigate]);

  const verify = async (c) => {
    if (app.demo) return void setTimeout(() => signedIn("demo"), 350);
    setBusy(true);
    setErr("");
    try {
      const { token } = await api.verify(tel, c);
      await signedIn(token);
    } catch (e) {
      setErr(errorText(e));
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const h1 = { margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: phone ? 26 : 34, lineHeight: 1.15, letterSpacing: "-0.01em" };
  const primary = (h = phone ? 50 : 54, fs = 15.5) => ({ height: h, borderRadius: h / 2, fontSize: fs, textAlign: "center", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: busy ? 0.6 : 1 });
  const steps = (list) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {list.map((t, i) => (
        <div key={t} style={{ display: "grid", gridTemplateColumns: "30px 1fr", gap: 8, fontSize: 15, lineHeight: 1.5 }}>
          <span style={{ fontFamily: MONO, color: "#7B4A2D" }}>{i + 1}</span>
          <span>{t}</span>
        </div>
      ))}
    </div>
  );
  const errLine = err && <span role="alert" style={{ fontSize: 13, lineHeight: 1.5, color: "#A0412D" }}>{err}</span>;

  let body = null;
  if (step === "welcome") {
    body = (
      <>
        <h1 style={h1}>Lễ tân Bonia</h1>
        {steps(["Cài ứng dụng Bonia trên điện thoại.", "Thực hiện chuyển cuộc gọi.", "Quay lại Website để cài đặt chi tiết."])}
        <StoreQR />
        <button type="button" className="b-primary" onClick={() => go("login")} style={primary()}>Tôi đã cài ứng dụng · Đăng nhập</button>
      </>
    );
  } else if (step === "login") {
    body = (
      <form style={{ display: "contents" }} onSubmit={(e) => { e.preventDefault(); if (!busy && tel.replace(/\D/g, "").length >= 9) sendCode("code"); }}>
        <h1 style={h1}>Đăng nhập</h1>
        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 14, color: "#4A4239" }}>Số điện thoại đã cài Bonia</span>
          <input value={tel} onChange={(e) => setTel(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="0909 123 456" style={{ height: 56, border: "1px solid #D9D0BF", borderRadius: 12, padding: "0 16px", fontFamily: MONO, fontSize: 19, background: "#fff", color: "#1F1B16" }} />
        </label>
        {errLine}
        <button type="submit" className="b-primary" disabled={busy} style={primary()}>{busy ? "Đang gửi…" : "Gửi mã tới ứng dụng Bonia"}</button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#6E6255", fontSize: 13.5 }}>
          <span style={{ flex: 1, height: 1, background: "#E4DCCB" }} />hoặc<span style={{ flex: 1, height: 1, background: "#E4DCCB" }} />
        </div>
        <QrSignIn demo={app.demo} onToken={signedIn} phone={phone} />
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
        <span style={{ fontSize: 15, lineHeight: 1.55, color: "#4A4239" }}>Cài ứng dụng Bonia trên điện thoại này trước.</span>
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {ref?.code && <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", padding: "4px 8px", border: "1px solid #D9D0BF", borderRadius: 10, color: "#4A4239", whiteSpace: "nowrap" }}>{ref.via} · {ref.code}</span>}
          {step === "welcome" && <button type="button" className="b-ghost" onClick={() => go("login")} style={{ height: 40, padding: "0 18px", borderRadius: 20, fontSize: 14.5 }}>Đăng nhập</button>}
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: phone ? "calc(var(--tt-top) + 56px)" : 68, bottom: 0, overflow: "auto", display: "flex", justifyContent: "center", alignItems: phone ? "flex-start" : "center", padding: phone ? "8px 20px 32px" : "24px 40px 60px" }}>
        <div style={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: phone ? 14 : 18, padding: phone ? 0 : "36px 40px", background: phone ? "transparent" : "#FFFFFF", border: phone ? 0 : "1px solid #D9D0BF", borderRadius: 20, margin: phone ? 0 : "auto 0" }}>
          {body}
        </div>
      </div>
    </div>
  );
}
