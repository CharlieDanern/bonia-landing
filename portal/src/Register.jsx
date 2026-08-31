import React, { useEffect, useRef, useState } from "react";
import { api, ZALO } from "./api.js";
import logo from "./logo-mark.png";

// Đăng ký (§2) — public, centered 404px card, 3 steps + result.
// The bank chip at step 2 is the trust moment: Bonia already knows where
// they work, from the domain alone.

const FREE_MAIL_RE = /@(gmail|yahoo|hotmail|outlook|icloud)\./i;
const BANKS_BY_DOMAIN_HINT = "vd. ten@vpbank.com.vn";

function StepHeader({ step }) {
  // The partner-type choice is a real step, not a preamble: it changes the
  // email rule, what else is required and who approves the account.
  const steps = ["Hình thức", "Thông tin", "Xác minh", "Mật khẩu"];
  return (
    <div className="reg-steps">
      {steps.map((label, i) => (
        <React.Fragment key={label}>
          {i > 0 && <span className="reg-step-rule" />}
          <span
            className={`reg-step-badge mono ${i === step ? "current" : i < step ? "done" : ""}`}
          >
            {i + 1}
          </span>
          <span className={`reg-step-label ${i === step ? "current" : ""}`}>
            {label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

export default function Register({ onDone }) {
  // -1 = choose partner type · 0 info · 1 otp · 2 password · 3 result
  const [step, setStep] = useState(-1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [branch, setBranch] = useState("");
  const [cities, setCities] = useState([]);
  // Fetched, not hardcoded: the server validates coverage against its own
  // canonical list by exact string match, so a local copy that drifted by
  // one accent would fail as an empty shelf rather than a visible error.
  const [cityList, setCityList] = useState([]);
  // Which of the two ways of proving standing this signup is taking. Asked
  // first, because it changes the email rule, what else is required, and
  // whether the account can ever go live without a human looking at it.
  const [partnerType, setPartnerType] = useState("employee");
  const [declaredBank, setDeclaredBank] = useState("");
  const [proof, setProof] = useState(null); // { base64, mime, filename, size }
  const isFreelancer = partnerType === "freelancer";
  // Derived, never stored: "toàn quốc" is just every province selected, so it
  // self-corrects if the canonical list ever grows.
  const allCities = cityList.length > 0 && cities.length === cityList.length;
  useEffect(() => {
    api
      .cities()
      .then((r) => setCityList(r.cities || []))
      .catch(() => setCityList([]));
  }, []);
  const [bank, setBank] = useState(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [result, setResult] = useState(null); // {status}
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const otpRefs = useRef([]);

  // The free-mail rule is the EMPLOYEE rule: a bank mailbox is their proof of
  // standing. A freelancer has none by definition — warning them off Gmail
  // would flag the normal case as an error.
  const freeMail = !isFreelancer && FREE_MAIL_RE.test(email);
  const emailHelper = isFreelancer
    ? "Dùng email bạn kiểm tra thường xuyên — Bonia gửi mã xác minh và thông báo lead tới đây."
    : freeMail
      ? "Cần email công việc, không dùng Gmail/Yahoo."
      : `Dùng email ngân hàng của bạn (${BANKS_BY_DOMAIN_HINT}) — đây là cách Bonia xác minh bạn.`;

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // `resend` is counted in its OWN server-side bucket, so pressing
  // "Gửi lại mã" never eats a branch's fresh-signup allowance.
  const sendCode = async (opts = {}) => {
    const resend = opts.resend === true;
    setErr(null);
    setBusy(true);
    try {
      const res = await api.register({
        full_name: name.trim(),
        work_email: email.trim(),
        phone: phone.trim(),
        branch_name: branch.trim(),
        cities,
        resend,
        partner_type: partnerType,
        ...(isFreelancer
          ? {
              declared_bank: declaredBank.trim(),
              proof_base64: proof?.base64,
              proof_mime: proof?.mime,
              proof_filename: proof?.filename,
            }
          : {}),
      });
      setBank(res.bank || null);
      setStep(1);
      setResendIn(60);
      setOtp(["", "", "", "", "", ""]);
    } catch (ex) {
      setErr(
        ex.body?.error === "work_email_required"
          ? "Cần email công việc, không dùng Gmail/Yahoo."
          : ex.body?.error === "bank_required"
            ? "Chọn ngân hàng bạn đang hợp tác."
            : ex.body?.error === "proof_required" || ex.body?.error === "invalid_proof"
              ? "Cần tải lên văn bản chứng minh hợp tác với ngân hàng."
              : ex.body?.error === "unsupported_proof_type"
                ? "Chỉ nhận PDF, JPG, PNG hoặc WEBP."
                : ex.body?.error === "proof_too_large"
                  ? "File quá lớn — tối đa 5MB."
          : ex.body?.error === "email_already_registered"
            ? "Email này đã có tài khoản. Đăng nhập thay vì đăng ký."
            : ex.body?.error === "invalid_phone"
              ? "Số điện thoại chưa đúng định dạng."
              : ex.body?.error === "invalid_name"
                ? "Nhập họ tên đầy đủ."
                : ex.body?.error === "invalid_branch"
                ? "Nhập tên chi nhánh bạn đang làm việc."
                : ex.body?.error === "cities_required"
                ? "Chọn ít nhất một tỉnh/thành bạn có thể phục vụ."
                : ex.body?.error === "invalid_city"
                ? "Có khu vực không hợp lệ. Tải lại trang rồi chọn lại."
                : ex.body?.error === "invalid_email"
                  ? "Địa chỉ email chưa đúng."
                  : ex.body?.error === "too_many_requests"
                    ? `Bạn đã gửi mã quá nhiều lần. Đợi 10 phút rồi thử lại, hoặc nhắn Zalo ${ZALO}.`
                    : ex.body?.error === "email_send_failed"
                      ? `Chưa gửi được email tới ${email.trim()}. Kiểm tra lại địa chỉ, hoặc nhắn Zalo ${ZALO} để Bonia mở tài khoản giúp bạn.`
                      : `Không gửi được mã, thử lại. Nếu vẫn lỗi, nhắn Zalo ${ZALO}.`,
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
      for (let j = 0; j < digits.length && i + j < 6; j++)
        next[i + j] = digits[j];
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
    if (password.length < 8)
      return setErr(`Còn thiếu ${8 - password.length} ký tự.`);
    setErr(null);
    setBusy(true);
    try {
      const res = await api.registerVerify({
        email: email.trim(),
        otp: code,
        password,
      });
      setResult(res);
      setStep(3);
    } catch (ex) {
      setErr(
        ex.body?.error === "otp_wrong"
          ? `Mã không đúng. Còn ${ex.body.attempts_left} lần thử.`
          : ex.body?.error === "otp_expired"
            ? "Mã đã hết hạn. Gửi lại mã mới."
            : ex.body?.error === "otp_attempts_exhausted"
              ? "Quá nhiều lần thử. Gửi lại mã mới."
              : ex.body?.error === "password_min_8"
                ? "Mật khẩu tối thiểu 8 ký tự."
                : "Không xác minh được, thử lại.",
      );
      if (
        ["otp_wrong", "otp_expired", "otp_attempts_exhausted"].includes(
          ex.body?.error,
        )
      )
        setStep(1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box" style={{ maxWidth: 404, textAlign: "left" }}>
        <div
          style={{
            display: "flex",
            gap: 9,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <img
            src={logo}
            alt=""
            style={{ width: 30, height: 30, objectFit: "contain" }}
          />
          <span className="wordmark" style={{ fontSize: 15 }}>
            Bonia <span>Business</span>
          </span>
        </div>
        {step < 3 && <StepHeader step={step + 1} />}

        <div className="login-card" style={{ marginTop: 12 }}>
          {err && <div className="err-panel">{err}</div>}

          {step === -1 && (
            <>
              <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                Tạo tài khoản tư vấn viên
              </h1>
              <p style={{ fontSize: 13, color: "var(--ink-55)" }}>
                Bạn làm việc với ngân hàng theo hình thức nào? Cách Bonia xác
                minh và điều kiện nhận lead khác nhau ở hai hình thức.
              </p>

              <div className="reg-choice-grid">
                <button
                  type="button"
                  className="reg-choice"
                  onClick={() => { setPartnerType("employee"); setStep(0); }}
                >
                  <span className="reg-choice-t">Nhân viên ngân hàng</span>
                  <span className="reg-choice-s">Có email công việc do ngân hàng cấp</span>
                  <span className="reg-choice-rule" />
                  <span className="reg-choice-pt"><i>✓</i> Xác minh tự động qua email công việc</span>
                  <span className="reg-choice-pt"><i>✓</i> 3 lead đầu không cần tạm giữ tiền</span>
                  <span className="reg-choice-pt"><i>✓</i> Dùng được ngay sau khi xác minh</span>
                  <span className="reg-choice-go">Tiếp tục →</span>
                </button>

                <button
                  type="button"
                  className="reg-choice"
                  onClick={() => { setPartnerType("freelancer"); setStep(0); }}
                >
                  <span className="reg-choice-t">Cộng tác viên</span>
                  <span className="reg-choice-s">Hợp tác với ngân hàng, không có email nội bộ</span>
                  <span className="reg-choice-rule" />
                  <span className="reg-choice-pt"><i>•</i> Dùng được email bất kỳ</span>
                  <span className="reg-choice-pt"><i>•</i> Cần văn bản hợp tác do ngân hàng cấp</span>
                  <span className="reg-choice-pt"><i>•</i> Tạm giữ toàn bộ mức bid từ lead đầu tiên</span>
                  <span className="reg-choice-go">Tiếp tục →</span>
                </button>
              </div>

              <p className="bid-micro" style={{ marginTop: 18 }}>
                Chọn nhầm cũng không sao — bạn quay lại được ở bước sau.
              </p>
              <p className="bid-micro" style={{ marginTop: 14 }}>
                Đã có tài khoản?{" "}
                <button className="bid-link-btn" onClick={onDone}>Đăng nhập</button>
              </p>
            </>
          )}

          {step === 0 && (
            <>
              <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                Tạo tài khoản tư vấn viên
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--ink-55)",
                  marginBottom: 14,
                }}
              >
                {isFreelancer
                  ? "Bonia xác minh cộng tác viên qua văn bản hợp tác với ngân hàng. Hồ sơ được duyệt thủ công."
                  : "Bonia xác minh bạn qua email công việc. Không cần giấy tờ."}
              </p>
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 10, padding: "9px 12px", marginBottom: 14,
                  background: "var(--paper, #F7F9FC)", border: "1px solid #E4E8F0", borderRadius: 10,
                }}
              >
                <span style={{ fontSize: 12.5, color: "var(--ink-55)" }}>
                  Đăng ký với tư cách{" "}
                  <b style={{ color: "var(--ink)" }}>
                    {isFreelancer ? "Cộng tác viên" : "Nhân viên ngân hàng"}
                  </b>
                </span>
                <button className="bid-link-btn" type="button" onClick={() => setStep(-1)}>
                  Đổi
                </button>
              </div>

              <label className="bid-label">Họ tên</label>
              <input
                className="input"
                style={{ height: 46 }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Duy Anh"
              />
              <label className="bid-label">{isFreelancer ? "Email" : "Email công việc"}</label>
              <input
                className="input"
                style={{
                  height: 46,
                  ...(freeMail ? { borderColor: "#E6B4B4" } : {}),
                }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isFreelancer ? "ten@email.com" : "ten@vpbank.com.vn"}
                autoCapitalize="none"
              />
              <div
                className="bid-helper"
                style={freeMail ? { color: "#A02C2C" } : {}}
              >
                {emailHelper}
              </div>
              <label className="bid-label">Số điện thoại</label>
              <input
                className="input"
                style={{ height: 46 }}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0903 000 000"
                inputMode="tel"
              />

              <label className="bid-label" style={{ marginTop: 14 }}>
                Chi nhánh đang làm việc
              </label>
              <input
                className="input"
                style={{ height: 46 }}
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="VD: Chi nhánh Quận 7"
              />
              <div style={{ fontSize: 12, color: "var(--ink-45)", marginTop: 6 }}>
                Bonia dùng thông tin này để xác minh hồ sơ của bạn.
              </div>

              {/* SERVICE AREA, not home address. "Where are you based" is a
                  proxy, and a misleading one — a rep sitting in one district
                  routinely covers several provinces. Ask the question routing
                  actually needs answered. */}
              {isFreelancer && (
                <>
                  <label className="bid-label" style={{ marginTop: 14 }}>
                    Ngân hàng bạn đang hợp tác
                  </label>
                  <input
                    className="input"
                    style={{ height: 46 }}
                    value={declaredBank}
                    onChange={(e) => setDeclaredBank(e.target.value)}
                    placeholder="VD: VIB"
                  />
                  <label className="bid-label" style={{ marginTop: 14 }}>
                    Văn bản chứng minh hợp tác
                  </label>
                  <div style={{ fontSize: 12, color: "var(--ink-45)", marginBottom: 8 }}>
                    Hợp đồng cộng tác viên, thư uỷ quyền hoặc mã đại lý do ngân hàng
                    cấp. PDF hoặc ảnh chụp, tối đa 5MB.
                  </div>
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return setProof(null);
                      if (f.size > 5 * 1024 * 1024) {
                        setErr("File quá lớn — tối đa 5MB.");
                        return setProof(null);
                      }
                      const r = new FileReader();
                      r.onload = () =>
                        setProof({
                          // strip the data: prefix — the API takes raw base64
                          base64: String(r.result).split(",")[1] || "",
                          mime: f.type,
                          filename: f.name,
                          size: f.size,
                        });
                      r.readAsDataURL(f);
                    }}
                  />
                  {proof && (
                    <div style={{ fontSize: 12, color: "var(--ink-45)", marginTop: 6 }}>
                      Đã chọn: {proof.filename} ({Math.round(proof.size / 1024)}KB)
                    </div>
                  )}
                </>
              )}

              <label className="bid-label" style={{ marginTop: 14 }}>
                Bạn có thể phục vụ khách ở tỉnh/thành nào?
              </label>
              <div style={{ fontSize: 12, color: "var(--ink-45)", marginBottom: 8 }}>
                Chọn tất cả khu vực bạn nhận khách. Bonia chỉ hiển thị thẻ của bạn
                cho khách ở những khu vực này.
              </div>
              {/* Nationwide shortcut: reps who take applications through an
                  online form genuinely serve every province, and ticking 63
                  chips one at a time is the kind of friction that loses a
                  signup. Stores the same explicit list the server expects —
                  no "all" sentinel — so routing and coverage stay unchanged. */}
              <button
                type="button"
                className={`reg-city-chip ${allCities ? "on" : ""}`}
                style={{ marginBottom: 8 }}
                onClick={() => setCities(allCities ? [] : [...cityList])}
                disabled={!cityList.length}
              >
                {allCities ? "✓ Toàn quốc" : "Toàn quốc"}
              </button>
              <div className="reg-city-grid">
                {cityList.map((c) => {
                  const on = cities.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      className={`reg-city-chip ${on ? "on" : ""}`}
                      onClick={() =>
                        setCities((prev) =>
                          prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                        )
                      }
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              {cities.length > 0 ? (
                <div style={{ fontSize: 12, color: "var(--ink-45)", marginTop: 8 }}>
                  {allCities ? "Đã chọn toàn quốc." : `Đã chọn ${cities.length} khu vực.`}
                </div>
              ) : null}

              <button
                className="btn-navy"
                style={{ width: "100%", marginTop: 14 }}
                disabled={
                  busy ||
                  !name.trim() ||
                  !email.trim() ||
                  !phone.trim() ||
                  branch.trim().length < 3 ||
                  cities.length === 0 ||
                  freeMail
                }
                onClick={() => sendCode()}
              >
                {busy ? "Đang gửi…" : "Gửi mã xác minh"}
              </button>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ink-45)",
                  textAlign: "center",
                  marginTop: 12,
                }}
              >
                Đã có tài khoản?{" "}
                <a
                  href="/app/"
                  style={{ color: "var(--navy)", fontWeight: 600 }}
                >
                  Đăng nhập
                </a>
              </div>
            </>
          )}

          {(step === 1 || step === 2) && (
            <>
              <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                {step === 1 ? "Nhập mã xác minh" : "Đặt mật khẩu"}
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--ink-55)",
                  marginBottom: 14,
                }}
              >
                {step === 1 ? (
                  <>
                    Bonia đã gửi mã 6 số tới <b>{email}</b>.
                  </>
                ) : (
                  "Dùng để đăng nhập cùng email công việc."
                )}
              </p>

              {step === 1 && bank && (
                <div className="reg-bank-chip">
                  <span className="reg-bank-tile">
                    {bank.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--navy)",
                      }}
                    >
                      {bank}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-45)" }}>
                      Nhận diện qua tên miền email · xác minh tự động
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <>
                  <div
                    style={{ display: "flex", gap: 8, margin: "12px 0 8px" }}
                  >
                    {otp.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          otpRefs.current[i] = el;
                        }}
                        className={`reg-otp mono ${d ? "filled" : ""}`}
                        inputMode="numeric"
                        value={d}
                        onChange={(e) => setOtpAt(i, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !otp[i] && i > 0) {
                            setOtp((o) =>
                              o.map((d, j) => (j === i - 1 ? "" : d)),
                            );
                            otpRefs.current[i - 1]?.focus();
                          }
                        }}
                      />
                    ))}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "var(--ink-45)",
                    }}
                  >
                    <span>Mã có hiệu lực 10 phút</span>
                    <button
                      className="bid-link-btn"
                      style={{ height: "auto", padding: 0 }}
                      disabled={resendIn > 0 || busy}
                      onClick={() => sendCode({ resend: true })}
                    >
                      {resendIn > 0
                        ? `Gửi lại mã (${resendIn}s)`
                        : "Gửi lại mã"}
                    </button>
                  </div>
                  <button
                    className="btn-navy"
                    style={{ width: "100%", marginTop: 14 }}
                    disabled={otp.join("").length < 6}
                    onClick={() => {
                      setErr(null);
                      setStep(2);
                    }}
                  >
                    Tiếp tục
                  </button>
                  <button
                    className="bid-draft-btn"
                    style={{ width: "100%", marginTop: 6 }}
                    onClick={() => setStep(0)}
                  >
                    Sửa email
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <label className="bid-label">
                    Mật khẩu (tối thiểu 8 ký tự)
                  </label>
                  <input
                    className="input"
                    type="password"
                    style={{
                      height: 46,
                      ...(password && password.length < 8
                        ? { borderColor: "#E6B4B4" }
                        : {}),
                    }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {password && password.length < 8 && (
                    <div className="bid-helper" style={{ color: "#A02C2C" }}>
                      Còn thiếu {8 - password.length} ký tự.
                    </div>
                  )}
                  <button
                    className="btn-navy"
                    style={{ width: "100%", marginTop: 14 }}
                    disabled={busy || password.length < 8}
                    onClick={verify}
                  >
                    {busy ? "Đang tạo…" : "Tạo tài khoản"}
                  </button>
                  <div
                    className="bid-micro"
                    style={{ textAlign: "center", marginTop: 10 }}
                  >
                    Tạo tài khoản đồng nghĩa đồng ý{" "}
                    <a
                      href="https://bonia.net/terms-business.html"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--navy)", fontWeight: 600 }}
                    >
                      Điều khoản Bonia Business
                    </a>
                    , bao gồm quy định xác nhận hai phía và xử lý gian lận.
                  </div>
                </>
              )}
            </>
          )}

          {step === 3 && result && (
            <div style={{ textAlign: "center" }}>
              <div
                className={`reg-result-tile ${result.status === "active" ? "" : "amber"}`}
              >
                {result.status === "active" ? "✓" : "…"}
              </div>
              <h1
                className="serif"
                style={{ fontSize: 22, fontWeight: 600, margin: "12px 0 6px" }}
              >
                {result.status === "active"
                  ? "Tài khoản đã sẵn sàng"
                  : "Bonia đang duyệt tài khoản"}
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--ink-55)",
                  lineHeight: 1.55,
                }}
              >
                {result.status === "active"
                  ? `Email ${email} đã được xác minh qua ${result.bank || "ngân hàng của bạn"}.`
                  : "Email của bạn không thuộc ngân hàng trong danh sách nhận diện tự động — Bonia duyệt thủ công trong một ngày làm việc."}
              </p>
              {result.status === "active" ? (
                <div className="reg-free-card">
                  <div
                    style={{
                      display: "flex",
                      gap: 5,
                      justifyContent: "center",
                      marginBottom: 6,
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="reg-pip" />
                    ))}
                  </div>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: "var(--navy)",
                    }}
                  >
                    3 lead đầu tiên không cần tạm giữ tiền
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-55)",
                      marginTop: 4,
                      lineHeight: 1.5,
                    }}
                  >
                    {/* HOLD copy — collateral, the full bid, not the
                        consumer commission setting. Leave as a literal. */}
                    Sau 3 lead đầu, mỗi lead nhận được sẽ giữ tạm toàn bộ mức bid
                    trong số dư. Không mở được thẻ thì khoản tạm giữ được hoàn lại vào ví.
                  </div>
                </div>
              ) : (
                <div
                  className="bid-banner amber"
                  style={{ textAlign: "left", marginTop: 12 }}
                >
                  <b>Tiếp theo là gì:</b> Hãy theo dõi email khi tài khoản được
                  phê duyệt - Hoặc liên hệ team Bonia tại Zalo {ZALO}.
                </div>
              )}
              <button
                className="btn-navy"
                style={{ width: "100%", marginTop: 14 }}
                onClick={onDone}
              >
                {result.status === "active" ? "Đăng nhập" : "Tôi đã hiểu"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
