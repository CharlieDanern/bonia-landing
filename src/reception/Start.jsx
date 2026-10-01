import { useEffect, useRef, useState } from "react";
import { C, F, contentMax, eyebrow, accent, appear } from "./tokens.js";
import { SECTOR_KEYS, SECTORS, nb } from "./sectors.js";
import { DEMO_ENDPOINT } from "./links.js";

/* § 04 · Bắt đầu (#demo), handoff v5 "§04". Left: "Nhận tư vấn", the page's
 * only form and only call to action (sales calls the business back). Right:
 * how the Bonia team sets a business up, information only, no links.
 *
 * Lĩnh vực follows the page sector (?nganh= or a call-demo tile) until the
 * visitor picks a chip; after that their pick stays, as in the prototype
 * (field null = follow the sector).
 *
 * The form never fakes success. With DEMO_ENDPOINT null it shows the send
 * error; with an endpoint it POSTs JSON and only a 2xx response shows the
 * thank-you view. */

const FIELDS = ["Phòng khám", "Khách sạn/Homestay", "Nhà hàng", "Khác"];
const OTHER_PLACEHOLDER = "Tên cơ sở của anh/chị";
const WHEN = ["Sáng", "Trưa", "Chiều", "Tối"];
const WHEN_TEXT = {
  Sáng: "vào buổi sáng",
  Trưa: "vào buổi trưa",
  Chiều: "vào buổi chiều",
  Tối: "vào buổi tối",
};

const ERR_BIZ = "Anh/chị điền giúp tên doanh nghiệp.";
const ERR_PHONE = "Số điện thoại chưa đúng, anh/chị kiểm tra lại giúp.";
const ERR_SEND = "Chưa gửi được yêu cầu. Anh/chị thử lại sau giúp.";
const SEND_TIMEOUT_MS = 15000;

const STEPS = [
  [
    "01",
    "Team Bonia liên hệ tư vấn",
    "Bonia gọi lại, hỏi cách cơ sở đang nhận cuộc gọi và những thông tin quan trọng về cơ sở kinh doanh.",
  ],
  [
    "02",
    "Thiết lập trọn gói, gọi thử trước",
    "Bonia cài giọng nói, lời chào, bảng giá, ưu đãi, rồi gọi demo tới khi hoàn toàn vừa ý.",
  ],
  ["03", "Dùng thử miễn phí 1 tháng", "Chỉ bắt đầu thanh toán khi Bonia hoạt động ổn sau 1 tháng."],
  ["04", "Hỗ trợ kỹ thuật liên tục", "Team Bonia luôn sẵn sàng hỗ trợ."],
];

// v5 narrows the side padding floor to 16 px (tokens.sectionPad still says 18).
const pad = "clamp(56px,8vw,104px) clamp(16px,5vw,72px)";

// The business-name placeholder is the chosen field's sample business.
const placeholderFor = (field) => {
  const k = SECTOR_KEYS.find((key) => SECTORS[key].field === field);
  return k ? SECTORS[k].placeholder : OTHER_PLACEHOLDER;
};

const col = (gap) => ({ display: "flex", flexDirection: "column", gap });

const cardTitle = {
  fontFamily: F.serif,
  fontSize: "clamp(24px,2.6vw,30px)",
  lineHeight: 1.15,
  letterSpacing: "-0.015em",
  fontWeight: 400,
  margin: 0,
  color: C.ink,
};

const cardEyebrow = (color) => ({
  fontFamily: F.mono,
  fontSize: 10.5,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color,
  margin: 0,
});

const card = {
  borderRadius: 20,
  padding: "clamp(18px,2.8vw,34px)",
  minWidth: 0,
  ...col(18),
};

const labelText = { fontSize: 13, color: C.ink3 };

// All inputs 16 px so iOS Safari does not zoom in on focus.
const input = {
  height: 48,
  width: "100%",
  minWidth: 0,
  border: `1px solid ${C.line}`,
  borderRadius: 10,
  background: C.warm,
  padding: "0 14px",
  fontFamily: "inherit",
  fontSize: 16,
  color: C.ink,
  margin: 0,
};

function Chip({ on, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      style={{
        minHeight: 40,
        padding: "0 14px",
        borderRadius: 999,
        border: `1px solid ${on ? C.clay : C.line}`,
        background: on ? C.clay : C.surface,
        color: on ? C.onClay : C.ink,
        fontSize: 14,
        cursor: "pointer",
        transition: "background .2s",
      }}
    >
      {children}
    </button>
  );
}

function Chips({ label, children }) {
  return (
    <div style={col(8)}>
      <span style={labelText}>{label}</span>
      <div role="group" aria-label={label} style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

function ContactForm({ sector }) {
  const [biz, setBiz] = useState("");
  const [picked, setPicked] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [when, setWhen] = useState("");
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState(false);
  const [sent, setSent] = useState(false);

  const alive = useRef(true);
  const thanksRef = useRef(null);
  const bizRef = useRef(null);
  const focusNext = useRef(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // Move focus with the view swap, so keyboard and screen-reader users land
  // on the thank-you line after sending and back on the form after "Sửa".
  useEffect(() => {
    const target = focusNext.current === "thanks" ? thanksRef.current : focusNext.current === "form" ? bizRef.current : null;
    focusNext.current = null;
    if (target) target.focus();
  }, [sent]);

  const field = picked || SECTORS[sector].field;
  const digits = phone.replace(/\D/g, "");
  const bizOk = biz.trim().length >= 2;
  const phoneOk = digits.length >= 9 && digits.length <= 11;
  const ok = bizOk && phoneOk;

  const errText = tried && !ok ? (!bizOk ? ERR_BIZ : ERR_PHONE) : sendErr ? ERR_SEND : "";

  // Any change clears a stale send error.
  const change = (setter) => (v) => {
    setter(v);
    setSendErr(false);
  };
  const onInput = (setter) => (e) => change(setter)(e.target.value);

  async function onSubmit(e) {
    e.preventDefault();
    if (sending) return;
    setTried(true);
    setSendErr(false);
    if (!ok) return;
    if (!DEMO_ENDPOINT) {
      setSendErr(true);
      return;
    }
    setSending(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), SEND_TIMEOUT_MS);
    try {
      const res = await fetch(DEMO_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business: biz.trim(),
          field, // Lĩnh vực as shown on the chip
          sector, // the page's ?nganh= when the form was sent
          name: name.trim(),
          phone: phone.trim(),
          when,
          page: window.location.href,
        }),
        signal: ctrl.signal,
      });
      if (!alive.current) return;
      if (res.ok) {
        // Keep the field that was sent, so "Sửa thông tin" shows it even if
        // the visitor switches the page sector afterwards.
        setPicked(field);
        focusNext.current = "thanks";
        setSent(true);
      } else {
        setSendErr(true);
      }
    } catch {
      if (alive.current) setSendErr(true);
    } finally {
      clearTimeout(timer);
      if (alive.current) setSending(false);
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 12,
          padding: "12px 0",
          ...appear(),
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            background: C.clay,
            color: C.onClay,
            fontSize: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✓
        </span>
        <p
          ref={thanksRef}
          tabIndex={-1}
          style={{ margin: 0, fontFamily: F.serif, fontSize: 26, lineHeight: 1.2, outline: "none" }}
        >
          Cảm ơn {name.trim() || "anh/chị"}.
        </p>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: C.ink3 }}>
          Bên em sẽ gọi lại số{" "}
          <span style={{ fontFamily: F.mono, color: C.ink, whiteSpace: "nowrap" }}>{nb(phone.trim())}</span>{" "}
          {WHEN_TEXT[when] || "trong giờ làm việc"}.
        </p>
        <button
          type="button"
          onClick={() => {
            focusNext.current = "form";
            setSent(false);
          }}
          style={{
            border: "none",
            background: "none",
            padding: "8px 0",
            fontSize: 13.5,
            fontWeight: 500,
            color: C.clay,
            cursor: "pointer",
          }}
        >
          Sửa thông tin
        </button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} aria-busy={sending} style={{ ...col(14), margin: 0 }}>
      <label style={col(6)}>
        <span style={labelText}>Tên doanh nghiệp</span>
        <input
          ref={bizRef}
          value={biz}
          onChange={onInput(setBiz)}
          placeholder={placeholderFor(field)}
          autoComplete="organization"
          aria-invalid={tried && !bizOk ? true : undefined}
          style={input}
        />
      </label>
      <Chips label="Lĩnh vực">
        {FIELDS.map((l) => (
          <Chip key={l} on={field === l} onClick={() => change(setPicked)(l)}>
            {l}
          </Chip>
        ))}
      </Chips>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,200px),1fr))",
          gap: 12,
        }}
      >
        <label style={{ ...col(6), minWidth: 0 }}>
          <span style={labelText}>Người liên hệ</span>
          <input value={name} onChange={onInput(setName)} placeholder="Chị Nhi, quản lý" autoComplete="name" style={input} />
        </label>
        <label style={{ ...col(6), minWidth: 0 }}>
          <span style={labelText}>Số điện thoại</span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={onInput(setPhone)}
            placeholder="0909 123 456"
            aria-invalid={tried && bizOk && !phoneOk ? true : undefined}
            style={{ ...input, fontFamily: F.mono }}
          />
        </label>
      </div>
      <Chips label="Giờ tiện gọi lại">
        {WHEN.map((l) => (
          <Chip key={l} on={when === l} onClick={() => change(setWhen)(when === l ? "" : l)}>
            {l}
          </Chip>
        ))}
      </Chips>
      {errText ? (
        <span
          role="alert"
          style={{
            fontSize: 13.5,
            color: C.danger,
            background: C.dangerBg,
            borderRadius: 8,
            padding: "9px 12px",
          }}
        >
          {errText}
        </span>
      ) : null}
      <button
        type="submit"
        disabled={sending}
        style={{
          width: "100%",
          height: 52,
          border: "none",
          borderRadius: 999,
          background: ok || sending ? C.clay : C.clayDisabled,
          color: C.onClay,
          fontSize: 15.5,
          fontWeight: 500,
          cursor: sending ? "progress" : "pointer",
          transition: "background .2s",
        }}
      >
        {sending ? "Đang gửi…" : "Gửi thông tin"}
      </button>
    </form>
  );
}

function ContactCard({ sector }) {
  return (
    <div style={{ ...card, background: C.surface, border: `1.5px solid ${C.clay}` }}>
      <div style={col(6)}>
        <p style={cardEyebrow(C.clay)}>Nhận tư vấn</p>
        <h3 style={cardTitle}>Đặt lịch demo trực tiếp</h3>
      </div>
      <ContactForm sector={sector} />
    </div>
  );
}

// The prototype's label reads "QUY TÌNH"; the intended word is "QUY TRÌNH".
function ProcessCard() {
  return (
    <div style={{ ...card, background: C.warm, border: `1px solid ${C.line}` }}>
      <div style={col(6)}>
        <p style={cardEyebrow(C.muted)}>Quy trình triển khai</p>
        <h3 style={cardTitle}>Team Bonia luôn sẵn sàng hỗ trợ</h3>
      </div>
      <ol style={{ margin: 0, padding: 0, listStyle: "none", ...col(0), borderTop: `1px solid ${C.line2}` }}>
        {STEPS.map(([n, title, text]) => (
          <li
            key={n}
            style={{
              padding: "16px 0",
              borderBottom: `1px solid ${C.line2}`,
              display: "grid",
              gridTemplateColumns: "40px minmax(0,1fr)",
              gap: 10,
              alignItems: "baseline",
            }}
          >
            <span aria-hidden="true" style={{ fontFamily: F.mono, fontSize: 13, color: C.clay }}>
              {n}
            </span>
            <div style={col(3)}>
              <span style={{ fontSize: 16.5, fontWeight: 500 }}>{title}</span>
              <span style={{ fontSize: 14, lineHeight: 1.5, color: C.ink3 }}>{text}</span>
            </div>
          </li>
        ))}
      </ol>
      <p style={{ margin: 0, marginTop: "auto", fontSize: 13.5, lineHeight: 1.5, color: C.ink3 }}>
        Trả theo tháng, hủy bất cứ lúc nào.
      </p>
    </div>
  );
}

export default function Start({ sector }) {
  return (
    <section id="demo" data-screen-label="05 Bắt đầu" style={{ padding: pad, scrollMarginTop: 64 }}>
      <div style={{ maxWidth: contentMax, margin: "0 auto", ...col("clamp(28px,4vw,44px)") }}>
        <div style={{ ...col(14), maxWidth: 820 }}>
          <p style={eyebrow()}>§ 04 · Bắt đầu</p>
          <h2
            style={{
              margin: 0,
              fontFamily: F.serif,
              fontWeight: 300,
              fontSize: "clamp(32px,5vw,60px)",
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
              textWrap: "balance",
              color: C.ink,
            }}
          >
            Quầy bận đến mấy,
            <br />
            <span style={accent}>điện thoại vẫn có người nghe.</span>
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,440px),1fr))",
            gap: "clamp(16px,2.4vw,28px)",
            alignItems: "stretch",
          }}
        >
          <ContactCard sector={sector} />
          <ProcessCard />
        </div>
      </div>
    </section>
  );
}
