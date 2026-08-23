import React, { useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import logo from "./logo-mark.png";

// Đăng ký (§2) — public, centered 404px card, 3 steps + result.
// The bank chip at step 2 is the trust moment: Bonia already knows where
// they work, from the domain alone.

const FREE_MAIL_RE = /@(gmail|yahoo|hotmail|outlook|icloud)\./i;
const BANKS_BY_DOMAIN_HINT = "vd. ten@vpbank.com.vn";

function StepHeader({ step }) {
  const steps = ["Thông tin", "Xác minh", "Mật khẩu"];
  return (
    <div className="reg-steps">
      {steps.map((label, i) => (
        <React.Fragment key={label}>
          {i > 0 && <span className="reg-step-rule" />}
          <span className={`reg-step-badge mono ${i === step ? "current" : i < step ? "done" : ""}`}>{i + 1}</span>
          <span className={`reg-step-label ${i === step ? "current" : ""}`}>{label}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

export default function Register({ onDone }) {
  const [step, setStep] = useState(0); // 0 info · 1 otp · 2 password · 3 result
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bank, setBank] = useState(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [result, setResult] = useState(null); // {status}
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const otpRefs = useRef([]);

  const freeMail = FREE_MAIL_RE.test(email);
  const emailHelper = freeMail
    ? "Cần email công việc, không dùng Gmail/Yahoo."
    : `Dùng email ngân hàng của bạn (${BANKS_BY_DOMAIN_HINT}) — đây là cách Bonia xác minh bạn.`;

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const sendCode = async () => {
    setErr(null);
    setBusy(true);
    try {
      const res = await api.register({ full_name: name.trim(), work_email: email.trim(), phone: phone.trim() });
      setBank(res.bank || null);
      setStep(1);
      setResendIn(60);
      setOtp(["", "", "", "", "", ""]);
    } catch (ex) {
      setErr(
        ex.body?.error === "work_email_required" ? "Cần email công việc, không dùng Gmail/Yahoo."
          : ex.body?.error === "email_already_registered" ? "Email này đã có tài khoản. Đăng nhập thay vì đăng ký."
            : ex.body?.error === "invalid_phone" ? "Số điện thoại chưa đúng định dạng."
              : ex.body?.error === "invalid_name" ? "Nhập họ tên đầy đủ."
                : "Không gửi được mã, thử lại."
      );
    } finally {
      setBusy(false);
    }
  };

  // OTP boxes: paste-splitting + auto-advance (§11.6).
  const setOtpAt = (i, raw) => {
    let digits = raw.replace(/\D/g, "");
    // Overtype: a filled box getting a new digit replaces, not splits.
    if (digits.length === 2 && digits[0] === otp[i]) digits = digits[1];
    if (digits.length > 1) {
      const next = [...otp];
      for (let j = 0; j < digits.length && i + j < 6; j++) next[i + j] = digits[j];
      setOtp(next);
      otpRefs.current[Math.min(5, i + digits.length)]?.focus();
      return;
    }
    const next = [...otp];
    next[i] = digits;
    setOtp(next);
    if (digits && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const verify = async () => {
    const code = otp.join("");
    if (code.length < 6) return setErr("Mã chưa đủ 6 số.");
    if (password.length < 8) return setErr(`Còn thiếu ${8 - password.length} ký tự.`);
    setErr(null);
    setBusy(true);
    try {
      const res = await api.registerVerify({ email: email.trim(), otp: code, password });
      setResult(res);
      setStep(3);
    } catch (ex) {
      setErr(
        ex.body?.error === "otp_wrong" ? `Mã không đúng. Còn ${ex.body.attempts_left} lần thử.`
          : ex.body?.error === "otp_expired" ? "Mã đã hết hạn. Gửi lại mã mới."
            : ex.body?.error === "otp_attempts_exhausted" ? "Quá nhiều lần thử. Gửi lại mã mới."
              : ex.body?.error === "password_min_8" ? "Mật khẩu tối thiểu 8 ký tự."
                : "Không xác minh được, thử lại."
      );
      if (["otp_wrong", "otp_expired", "otp_attempts_exhausted"].includes(ex.body?.error)) setStep(1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box" style={{ maxWidth: 404, textAlign: "left" }}>
        <div style={{ display: "flex", gap: 9, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <img src={logo} alt="" style={{ width: 30, height: 30, objectFit: "contain" }} />
          <span className="wordmark" style={{ fontSize: 15 }}>Bonia <span>Business</span></span>
        </div>
        {step < 3 && <StepHeader step={step} />}

        <div className="login-card" style={{ marginTop: 12 }}>
          {err && <div className="err-panel">{err}</div>}

          {step === 0 && (
            <>
              <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Tạo tài khoản tư vấn viên</h1>
              <p style={{ fontSize: 13, color: "var(--ink-55)", marginBottom: 14 }}>
                Bonia xác minh bạn qua email công việc. Không cần giấy tờ.
              </p>
              <label className="bid-label">Họ tên</label>
              <input className="input" style={{ height: 46 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Duy Anh" />
              <label className="bid-label">Email công việc</label>
              <input
                className="input"
                style={{ height: 46, ...(freeMail ? { borderColor: "#E6B4B4" } : {}) }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten@vpbank.com.vn"
                autoCapitalize="none"
              />
              <div className="bid-helper" style={freeMail ? { color: "#A02C2C" } : {}}>{emailHelper}</div>
              <label className="bid-label">Số điện thoại</label>
              <input className="input" style={{ height: 46 }} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0903 000 000" inputMode="tel" />
              <button className="btn-navy" style={{ width: "100%", marginTop: 14 }}
                disabled={busy || !name.trim() || !email.trim() || !phone.trim() || freeMail}
                onClick={sendCode}>
                {busy ? "Đang gửi…" : "Gửi mã xác minh"}
              </button>
              <div style={{ fontSize: 12, color: "var(--ink-45)", textAlign: "center", marginTop: 12 }}>
                Đã có tài khoản? <a href="/app/" style={{ color: "var(--navy)", fontWeight: 600 }}>Đăng nhập</a>
              </div>
            </>
          )}

          {(step === 1 || step === 2) && (
            <>
              <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                {step === 1 ? "Nhập mã xác minh" : "Đặt mật khẩu"}
              </h1>
              <p style={{ fontSize: 13, color: "var(--ink-55)", marginBottom: 14 }}>
                {step === 1 ? <>Bonia đã gửi mã 6 số tới <b>{email}</b>.</> : "Dùng để đăng nhập cùng email công việc."}
              </p>

              {step === 1 && bank && (
                <div className="reg-bank-chip">
                  <span className="reg-bank-tile">{bank.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>{bank}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-45)" }}>Nhận diện qua tên miền email · xác minh tự động</div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <>
                  <div style={{ display: "flex", gap: 8, margin: "12px 0 8px" }}>
                    {otp.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        className={`reg-otp mono ${d ? "filled" : ""}`}
                        inputMode="numeric"
                        value={d}
                        onChange={(e) => setOtpAt(i, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !otp[i] && i > 0) {
                            setOtp((o) => o.map((d, j) => (j === i - 1 ? "" : d)));
                            otpRefs.current[i - 1]?.focus();
                          }
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink-45)" }}>
                    <span>Mã có hiệu lực 10 phút</span>
                    <button className="bid-link-btn" style={{ height: "auto", padding: 0 }} disabled={resendIn > 0 || busy}
                      onClick={sendCode}>
                      {resendIn > 0 ? `Gửi lại mã (${resendIn}s)` : "Gửi lại mã"}
                    </button>
                  </div>
                  <button className="btn-navy" style={{ width: "100%", marginTop: 14 }}
                    disabled={otp.join("").length < 6}
                    onClick={() => { setErr(null); setStep(2); }}>
                    Tiếp tục
                  </button>
                  <button className="bid-draft-btn" style={{ width: "100%", marginTop: 6 }} onClick={() => setStep(0)}>Sửa email</button>
                </>
              )}

              {step === 2 && (
                <>
                  <label className="bid-label">Mật khẩu (tối thiểu 8 ký tự)</label>
                  <input className="input" type="password" style={{ height: 46, ...(password && password.length < 8 ? { borderColor: "#E6B4B4" } : {}) }}
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                  {password && password.length < 8 && (
                    <div className="bid-helper" style={{ color: "#A02C2C" }}>Còn thiếu {8 - password.length} ký tự.</div>
                  )}
                  <button className="btn-navy" style={{ width: "100%", marginTop: 14 }} disabled={busy || password.length < 8} onClick={verify}>
                    {busy ? "Đang tạo…" : "Tạo tài khoản"}
                  </button>
                </>
              )}
            </>
          )}

          {step === 3 && result && (
            <div style={{ textAlign: "center" }}>
              <div className={`reg-result-tile ${result.status === "active" ? "" : "amber"}`}>
                {result.status === "active" ? "✓" : "…"}
              </div>
              <h1 className="serif" style={{ fontSize: 22, fontWeight: 600, margin: "12px 0 6px" }}>
                {result.status === "active" ? "Tài khoản đã sẵn sàng" : "Bonia đang duyệt tài khoản"}
              </h1>
              <p style={{ fontSize: 13, color: "var(--ink-55)", lineHeight: 1.55 }}>
                {result.status === "active"
                  ? `Email ${email} đã được xác minh qua ${result.bank || "ngân hàng của bạn"}.`
                  : "Email của bạn không thuộc ngân hàng trong danh sách nhận diện tự động — Bonia duyệt thủ công trong một ngày làm việc."}
              </p>
              {result.status === "active" ? (
                <div className="reg-free-card">
                  <div style={{ display: "flex", gap: 5, justifyContent: "center", marginBottom: 6 }}>
                    {[0, 1, 2].map((i) => <span key={i} className="reg-pip" />)}
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--navy)" }}>3 lead đầu tiên miễn phí</div>
                  <div style={{ fontSize: 12, color: "var(--ink-55)", marginTop: 4, lineHeight: 1.5 }}>
                    Sau 3 lead đầu, mỗi lead nhận được sẽ giữ tạm 50% mức bid trong số dư.
                    Không mở được thẻ thì Bonia hoàn lại phần giữ.
                  </div>
                </div>
              ) : (
                <div className="bid-banner amber" style={{ textAlign: "left", marginTop: 12 }}>
                  <b>Tiếp theo là gì:</b> Bonia kiểm tra trong một ngày làm việc · bạn nhận email khi
                  tài khoản mở · đăng nhập sớm sẽ thấy đúng trạng thái này · cần gấp thì nhắn Zalo Bonia.
                </div>
              )}
              <button className="btn-navy" style={{ width: "100%", marginTop: 14 }} onClick={onDone}>
                {result.status === "active" ? "Đăng nhập" : "Tôi đã hiểu"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
