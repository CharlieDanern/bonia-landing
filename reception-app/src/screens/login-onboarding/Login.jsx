import React, { useEffect, useRef, useState } from "react";
import { newAccount } from "../../data/sectors.js";
import { useLocation } from "wouter";
import { Button, OtpInput, TextInput } from "../../components/ui/index.js";
import { BONIA_MARK } from "../../lib/assets.js";
import { useIsMobile, useScreenState } from "../../lib/hooks.js";
import { useActions, useStore } from "../../store/index.jsx";
import { DEVICE_SUGGESTIONS, LOGIN } from "../../data/onboarding.js";
import { ChoicePill, MONO, PushCard, SERIF, formatPhoneInput, mmss } from "./ui.jsx";

// 3.0 Đăng nhập. One hotel login (the counter phone's number), a 6-digit
// code pushed to the Bonia app on that phone (never SMS), then a name for
// this device so every history line says which machine did what.
//
// step: phone (A) · sending (F) · phoneError (G) · code (B) · codeError (C)
//       · expired (D) · help (E) · device (H)

const CODE_TTL = 5 * 60; // a code is valid for 5 minutes, then 3.0 D

const FRAMES = {
  "3.0_A": { step: "phone" },
  "3.0_B": { step: "code", code: LOGIN.sampleCode.slice(0, 3), resend: 45 },
  "3.0_C": { step: "codeError", code: "482917", resend: 21, attempts: 3 },
  "3.0_D": { step: "expired" },
  "3.0_E": { step: "help", resend: 12 },
  "3.0_F": { step: "sending" },
  "3.0_G": { step: "phoneError", phone: LOGIN.wrongPhone },
  "3.0_H": { step: "device" },
};

function initialFor(frame, state) {
  const f = FRAMES[frame] || (state === "loading" ? FRAMES["3.0_F"] : state === "error" ? FRAMES["3.0_G"] : null);
  return {
    step: f?.step || "phone",
    phone: f?.phone || LOGIN.phone,
    code: f?.code || "",
    resend: f?.resend ?? LOGIN.resendSeconds,
    attempts: f?.attempts ?? LOGIN.attemptsLeft + 1,
    frozen: !!f, // frames hold their timers still until the first action
  };
}

export function Login() {
  const { frame, state: screenState } = useScreenState();
  const mobile = useIsMobile();
  const [, navigate] = useLocation();
  const { device } = useStore();
  const { setDeviceName } = useActions();
  const [s, setS] = useState(() => initialFor(frame, screenState));
  const [deviceName, setDevice] = useState(device || DEVICE_SUGGESTIONS[0]);
  const [verifying, setVerifying] = useState(false);
  const [toast, setToast] = useState(false);
  const [codeAge, setCodeAge] = useState(0);
  const timers = useRef([]);

  // Re-seed when the frame in the URL changes (QA harness, demo links).
  useEffect(() => {
    setS(initialFor(frame, screenState));
  }, [frame, screenState]);

  const go = (patch) => setS((p) => ({ ...p, frozen: false, ...patch }));
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Resend countdown + code lifetime (live only).
  const counting = !s.frozen && ["code", "codeError", "help"].includes(s.step);
  useEffect(() => {
    if (!counting) return undefined;
    const t = setInterval(() => {
      setS((p) => ({ ...p, resend: Math.max(0, p.resend - 1) }));
      setCodeAge((a) => a + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [counting]);
  useEffect(() => {
    if (counting && codeAge >= CODE_TTL) go({ step: "expired", code: "" });
  }, [codeAge, counting]);

  // Demo only: the code "arrives" on the counter phone as a push.
  useEffect(() => {
    if (s.frozen || s.step !== "code") return undefined;
    const t = setTimeout(() => setToast(true), 1400);
    return () => clearTimeout(t);
  }, [s.step, s.frozen]);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(false), 9000);
    return () => clearTimeout(t);
  }, [toast]);

  const sendCode = () => {
    const digits = s.phone.replace(/\D/g, "");
    if (digits.length < 10) {
      go({ step: "phoneError", invalid: true });
      return;
    }
    go({ step: "sending", invalid: false });
    later(() => {
      const offline = typeof navigator !== "undefined" && navigator.onLine === false;
      if (offline || digits !== LOGIN.phone.replace(/\D/g, "")) {
        go({ step: "phoneError" });
        return;
      }
      setCodeAge(0);
      go({ step: "code", code: "", resend: LOGIN.resendSeconds, attempts: LOGIN.attemptsLeft + 1 });
    }, 1100);
  };

  const verify = (code) => {
    setVerifying(true);
    setToast(false);
    later(() => {
      setVerifying(false);
      if (code === LOGIN.sampleCode) {
        go({ step: "device", code });
        return;
      }
      const left = s.attempts - 1;
      if (left <= 0) go({ step: "expired", code: "" });
      else go({ step: "codeError", code, attempts: left });
    }, 700);
  };

  const finish = () => {
    const name = deviceName.trim();
    if (!name) return;
    setDeviceName(name);
    // a new account (sales link or ?moi=1) chooses its sector first, then sets up; an existing hotel goes to Hôm nay
    const fresh = newAccount() || (new URLSearchParams(window.location.search).has("moi") ? {} : null);
    if (fresh) navigate(fresh.sector ? "/bat-dau/tim" : "/chon-linh-vuc");
    else navigate("/hom-nay");
  };

  const right = (() => {
    switch (s.step) {
      case "sending":
        return <PhoneStep phone={s.phone} sending />;
      case "phoneError":
        return (
          <PhoneStep
            phone={s.phone}
            error={
              s.invalid
                ? "Số điện thoại cần đủ 10 số."
                : "Số này chưa có ứng dụng Bonia. Cài ứng dụng Bonia trên điện thoại quầy rồi thử lại, hoặc nhập đúng số đã đăng ký."
            }
            network={!s.invalid}
            onPhone={(v) => go({ phone: v })}
            onSend={sendCode}
          />
        );
      case "code":
      case "codeError":
        return (
          <CodeStep
            phone={s.phone}
            code={s.code}
            error={s.step === "codeError" ? s.attempts : null}
            resend={s.resend}
            frame={s.frozen ? frame : null}
            verifying={verifying}
            onCode={(v) => go({ code: v, step: v.length < 6 && s.step === "codeError" ? "code" : s.step })}
            onComplete={verify}
            onRetry={() => go({ step: "code", code: "" })}
            onChangeNumber={() => go({ step: "phone", code: "" })}
            onHelp={() => go({ step: "help" })}
            onResend={sendCode}
          />
        );
      case "expired":
        return <ExpiredStep phone={s.phone} onChangeNumber={() => go({ step: "phone" })} onResend={sendCode} />;
      case "help":
        return <HelpStep phone={s.phone} resend={s.resend} onBack={() => go({ step: "code" })} onResend={sendCode} />;
      case "device":
        return <DeviceStep value={deviceName} onChange={setDevice} onSave={finish} focused={s.frozen} />;
      default:
        return <PhoneStep phone={s.phone} focused={s.frozen} onPhone={(v) => go({ phone: v })} onSend={sendCode} />;
    }
  })();

  // Only the first step shows the address line above the tagline (3.0 A).
  const showAddress = s.step === "phone";

  return (
    <div className={`lo-login${mobile ? " lo-login--m" : ""}`}>
      <aside className="lo-login__brand">
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <img src={BONIA_MARK} alt="Bonia" style={{ height: 24, width: "auto" }} />
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--bn-muted)" }}>
            Tiếp tân
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {showAddress && !mobile && (
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--bn-muted)" }}>
              bonia.vn/reception/app
            </div>
          )}
          <div className="lo-login__tagline">
            Để lễ tân lo khách trước mặt. <span style={{ fontStyle: "italic", color: "var(--bn-clay)" }}>Bonia lo điện thoại.</span>
          </div>
        </div>
        {!mobile && (
          <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--bn-muted)" }}>
            Một đăng nhập cho cả khách sạn · dùng ở quầy
          </div>
        )}
      </aside>
      <main className="lo-login__main">
        <div className="lo-login__form">{right}</div>
      </main>
      {toast && (
        <div className="lo-toast" role="status">
          <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--bn-muted)", marginBottom: 6 }}>
            Trên điện thoại quầy
          </div>
          <PushCard
            mark={BONIA_MARK}
            code="482 913"
            onClick={() => {
              setToast(false);
              go({ code: LOGIN.sampleCode });
              verify(LOGIN.sampleCode);
            }}
          />
        </div>
      )}
    </div>
  );
}

function H2({ children }) {
  return (
    <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 36, letterSpacing: "-0.02em" }}>{children}</h2>
  );
}

function Banner({ tag, children }) {
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        padding: "12px 14px",
        borderRadius: 10,
        background: "var(--bn-urgent-bg)",
        color: "var(--bn-urgent)",
        fontSize: 14,
        fontWeight: 500,
      }}
    >
      <span
        style={{
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: "0.14em",
          border: "1px solid var(--bn-urgent)",
          borderRadius: 4,
          padding: "2px 6px",
          whiteSpace: "nowrap",
        }}
      >
        {tag}
      </span>
      {children}
    </div>
  );
}

/** ✓ 0900 000 300 ……… Đổi số */
function NumberLine({ phone, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: 48,
        borderBottom: "1px solid var(--bn-hairline)",
        fontSize: 14,
      }}
    >
      <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ color: "var(--bn-ok)" }}>✓</span>
        <span style={{ fontFamily: MONO }}>{phone}</span>
      </span>
      <button type="button" onClick={onChange} style={{ color: "var(--bn-clay)", fontWeight: 500 }}>
        Đổi số
      </button>
    </div>
  );
}

function PhoneStep({ phone, focused, sending, error, network, onPhone, onSend }) {
  const gap = error ? 24 : 28;
  return (
    <form
      style={{ display: "flex", flexDirection: "column", gap }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!sending) onSend();
      }}
    >
      <H2>Đăng nhập</H2>
      <TextInput
        label="Số điện thoại đăng nhập"
        value={phone}
        onChange={(v) => onPhone(formatPhoneInput(v))}
        mono
        inputMode="tel"
        autoComplete="tel"
        autoFocus={!sending && !error}
        focused={focused}
        disabled={sending}
        error={error}
        helper={sending ? null : "Điện thoại quầy có ứng dụng Bonia, thường chính là số hotline."}
        fieldStyle={{ padding: "0 16px", ...(sending ? { background: "var(--bn-cream-2)" } : null) }}
        labelStyle={sending ? { color: "var(--bn-muted)" } : undefined}
        inputStyle={{ letterSpacing: sending ? 0 : "0.04em", color: sending ? "var(--bn-muted)" : undefined }}
      />
      {network && (
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            padding: "14px 16px",
            borderRadius: 10,
            background: "#fff",
            border: "1px solid var(--bn-hairline)",
            fontSize: 14,
            lineHeight: 1.5,
            color: "var(--bn-ink-2)",
          }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: "0.14em",
              color: "var(--bn-muted)",
              border: "1px solid var(--bn-hairline)",
              borderRadius: 4,
              padding: "2px 6px",
              marginTop: 1,
              whiteSpace: "nowrap",
            }}
          >
            MẠNG
          </span>
          <span>
            Nếu máy đang mất mạng: <span style={{ color: "var(--bn-ink)" }}>Không gửi được mã. Kiểm tra kết nối rồi bấm Gửi mã lại.</span>
          </span>
        </div>
      )}
      <Button type="submit" size="lg" block loading={sending}>
        {sending ? "Đang gửi mã…" : "Gửi mã"}
      </Button>
      {!sending && !error && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            borderTop: "1px solid var(--bn-hairline)",
            paddingTop: 20,
          }}
        >
          {["Nhập mã 6 số", "Vào Hôm nay"].map((t, i) => (
            <div key={t} style={{ display: "flex", gap: 12, fontSize: 14, color: "var(--bn-muted)" }}>
              <span style={{ fontFamily: MONO, width: 16 }}>{i + 2}</span>
              {t}
            </div>
          ))}
        </div>
      )}
    </form>
  );
}

function CodeStep({ phone, code, error, resend, frame, verifying, onCode, onComplete, onRetry, onChangeNumber, onHelp, onResend }) {
  const isError = error != null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      <H2>Đăng nhập</H2>
      <NumberLine phone={phone} onChange={onChangeNumber} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 15, lineHeight: 1.5 }}>Mã đã gửi tới ứng dụng Bonia trên điện thoại của bạn.</div>
        <div className="lo-otp">
          <OtpInput
            value={code}
            state={isError ? "error" : "normal"}
            autoFocus={!isError}
            activeIndex={frame === "3.0_B" ? 3 : undefined}
            disabled={verifying}
            onChange={onCode}
            onComplete={onComplete}
          />
        </div>
        {isError && <Banner tag="LỖI">Mã chưa đúng. Còn {error} lần thử.</Banner>}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: "var(--bn-muted)" }}>
          {resend > 0 ? (
            <span style={{ fontFamily: MONO }}>Gửi lại mã sau {mmss(resend)}</span>
          ) : (
            <button type="button" onClick={onResend} style={{ color: "var(--bn-clay)", fontWeight: 500 }}>
              Gửi lại mã
            </button>
          )}
          <button type="button" onClick={onHelp} style={{ color: "var(--bn-clay)", fontWeight: 500 }}>
            Không thấy mã?
          </button>
        </div>
      </div>
      {isError ? (
        <Button size="lg" block onClick={onRetry}>
          Nhập lại
        </Button>
      ) : (
        <Button size="lg" block disabled={code.length < 6} loading={verifying} onClick={() => onComplete(code)}>
          {verifying ? "Đang kiểm tra…" : "Vào"}
        </Button>
      )}
    </div>
  );
}

function ExpiredStep({ phone, onChangeNumber, onResend }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      <H2>Đăng nhập</H2>
      <NumberLine phone={phone} onChange={onChangeNumber} />
      <div className="lo-otp">
        <OtpInput value="" state="expired" />
      </div>
      <Banner tag="HẾT HẠN">Mã đã hết hạn. Gửi lại mã?</Banner>
      <Button size="lg" block onClick={onResend}>
        Gửi lại mã
      </Button>
    </div>
  );
}

function HelpStep({ phone, resend, onBack, onResend }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <H2>Không thấy mã?</H2>
      <div style={{ fontSize: 16, lineHeight: 1.55 }}>Mở ứng dụng Bonia, mã hiện ở đầu màn hình.</div>
      <PushCard mark={BONIA_MARK} code="482 913" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: "var(--bn-ink-2)", lineHeight: 1.5 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ fontFamily: MONO, color: "var(--bn-muted)" }}>1</span>
          <span>Điện thoại quầy phải có ứng dụng Bonia và đang đăng nhập số {phone}.</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ fontFamily: MONO, color: "var(--bn-muted)" }}>2</span>
          <span>Nếu đã tắt thông báo của Bonia, mã vẫn hiện khi mở ứng dụng.</span>
        </div>
      </div>
      <div className="lo-row-2" style={{ display: "flex", gap: 10 }}>
        <Button size="lg" onClick={onBack} style={{ flex: 1 }}>
          Nhập mã
        </Button>
        <Button
          size="lg"
          variant="secondary"
          onClick={resend > 0 ? undefined : onResend}
          aria-disabled={resend > 0 || undefined}
          style={{ flex: 1, fontWeight: 400, color: resend > 0 ? "var(--bn-muted)" : "var(--bn-ink)" }}
        >
          {resend > 0 ? `Gửi lại mã sau ${mmss(resend)}` : "Gửi lại mã"}
        </Button>
      </div>
    </div>
  );
}

function DeviceStep({ value, onChange, onSave, focused }) {
  return (
    <form
      style={{ display: "flex", flexDirection: "column", gap: 24 }}
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <H2>Đặt tên máy này</H2>
      <div style={{ fontSize: 15, lineHeight: 1.55, color: "var(--bn-ink-2)" }}>
        Lịch sử thao tác sẽ ghi máy nào làm gì, ví dụ{" "}
        <span style={{ fontFamily: MONO, fontSize: 13, color: "var(--bn-ink)" }}>21:04 · Máy tính quầy · Đã nhận cọc</span>.
      </div>
      <TextInput
        value={value}
        onChange={onChange}
        autoFocus
        focused={focused}
        fontSize={17}
        aria-label="Tên máy này"
        fieldStyle={{ padding: "0 16px" }}
      />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {DEVICE_SUGGESTIONS.map((d) => (
          <ChoicePill key={d} height={36} padding="0 14px" bold={false} selected={value === d} onClick={() => onChange(d)}>
            {d}
          </ChoicePill>
        ))}
      </div>
      <Button type="submit" size="lg" block disabled={!value.trim()}>
        Lưu và vào Hôm nay
      </Button>
    </form>
  );
}
